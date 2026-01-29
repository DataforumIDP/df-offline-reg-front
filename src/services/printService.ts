// --- QR PDF rendering ---
async function renderQrElement(
  doc: jsPDF,
  element: import('@/store/slices/templateEditorSlice').QrElement,
  data: PrintData,
  pageWidth: number
): Promise<void> {
  let value = ''
  if (element.resourceType === 'field' && element.fieldKey) {
    value = String(data[element.fieldKey] ?? '')
  } else if (element.resourceType === 'fixed' && element.fixedValue) {
    value = String(element.fixedValue)
  }
  if (element.prefix) value = element.prefix + value
  if (!value) return
  const sizeMm = element.width
  const sizePx = Math.round(mmToScreenPx(sizeMm))
  // Динамический импорт qr-code-styling (чтобы не ломать SSR)
  const { default: QRCodeStyling } = await import('qr-code-styling')
  // 1. Сначала создаём временный QR, чтобы узнать moduleCount (размер QR в "модулях")
  const tmpQr = new QRCodeStyling({
    width: sizePx,
    height: sizePx,
    margin: 0,
    type: 'canvas',
    data: value,
    qrOptions: {
      errorCorrectionLevel: element.ecLevel as any || 'Q',
    },
  })
  // @ts-ignore
  const moduleCount = tmpQr._qr ? tmpQr._qr.getModuleCount() : 21 // fallback на 21 (QR v1)
  // 2. Рассчитываем нужный canvasPx, чтобы "активная" часть QR заняла sizePx
  const quietZoneModules = 4 // qr-code-styling всегда добавляет 4 модуля
  const canvasPx = Math.round(sizePx * (moduleCount + 2 * quietZoneModules) / moduleCount)
  // 3. Формируем финальные опции QR
  const qrOptions: any = {
    width: canvasPx,
    height: canvasPx,
    margin: 0,
    type: 'canvas',
    data: value,
    image: element.logoUrl || undefined,
    qrOptions: {
      errorCorrectionLevel: element.ecLevel || 'Q',
    },
    dotsOptions: {
      color: element.fgColor || '#000000',
      type: element.moduleStyle || 'square',
    },
    backgroundOptions: {
      color: element.bgColor || '#ffffff00',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 0,
    },
    // Можно добавить cornersSquareOptions/cornersDotOptions при необходимости
  }
  let dataUrl: string | null = null
  try {
    const qr = new QRCodeStyling(qrOptions)
    // Генерируем PNG как Blob, затем читаем как dataURL
    const raw = await qr.getRawData('png')
    if (!raw || typeof Blob === 'undefined' || !(raw instanceof Blob)) {
      throw new Error('QR PNG generation failed')
    }
    const blob: Blob = raw
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('Ошибка генерации QR PNG для PDF:', err)
    dataUrl = null
  }
  if (!dataUrl) return
  let x = element.x
  if (element.center) {
    x = (pageWidth - sizeMm) / 2
  }
  const y = element.y
  // Вставляем QR в PDF, сжимая до sizeMm (теперь "активная" часть QR ровно sizeMm)
  doc.addImage(dataUrl, 'PNG', x, y, sizeMm, sizeMm)
}
/**
 * Сервис для генерации PDF и печати бейджей
 * 
 * ВАЖНО: PDF использует точки (points) для размеров шрифта:
 * - 1 inch = 72 points
 * - 1 mm = 2.834645669 points (72 / 25.4)
 * 
 * jsPDF позволяет работать с мм напрямую для позиционирования,
 * а размер шрифта задаётся в pt (как мы и храним в шаблоне)
 */

import { jsPDF } from 'jspdf'
import type { TemplateElement, TextFieldElement } from '@/store/slices/templateEditorSlice'

// ========== Типы ==========

/**
 * Конфигурация шаблона печати
 */
export interface PrintTemplate {
  /** Ширина страницы в мм */
  widthMm: number
  /** Высота страницы в мм */
  heightMm: number
  /** Элементы шаблона (текстовые поля, QR-коды и т.д.) */
  elements: TemplateElement[]
}

/**
 * Данные для печати одного бейджа
 * Ключи - это fieldKey из элементов шаблона
 */
export type PrintData = Record<string, string | number | undefined>

/**
 * Настройки печати
 */
export interface PrintOptions {
  /** Скачать файл (true) или вернуть Blob (false) */
  download?: boolean
  /** Имя файла при скачивании */
  filename?: string
  /** Несколько бейджей на одной странице (в будущем) */
  multiplePerPage?: boolean
}

// ========== Константы ==========

// Коэффициент для конвертации mm в points
const MM_TO_PT = 72 / 25.4 // ≈ 2.834645669

/**
 * Шрифт по умолчанию для fallback (поддерживает кириллицу)
 */
const DEFAULT_CYRILLIC_FONT = 'Roboto'

/**
      doc.addImage(dataUrl, 'PNG', x, y, sizeMm, sizeMm)
 */
const loadedFonts: Map<string, ArrayBuffer> = new Map()

/**
 * Очистить кэш загруженных шрифтов
 */
export function clearFontCache(): void {
  loadedFonts.clear()
  console.log('Font cache cleared')
}

/**
 * URL-адреса шрифтов для загрузки
 * 
 * ВАЖНО: Стандартные шрифты jsPDF (Helvetica, Times, Courier) НЕ поддерживают кириллицу!
 * Для кириллицы обязательно нужно встраивать TTF шрифт.
 * 
 * Используем локальные шрифты из public/fonts
 */
const FONT_URLS: Record<string, Record<string, string>> = {
  // Roboto - основной шрифт с полной поддержкой кириллицы
  'Roboto': {
    'normal': '/fonts/Roboto/Roboto-Regular.ttf',
    'bold': '/fonts/Roboto/Roboto-Bold.ttf',
    'italic': '/fonts/Roboto/Roboto-Italic.ttf',
    'bolditalic': '/fonts/Roboto/Roboto-BoldItalic.ttf',
  },
  // Segoe UI
  'Segoe UI': {
    'normal': '/fonts/SegoeUI/Segoe UI.ttf',
    'bold': '/fonts/SegoeUI/Segoe UI_bold.ttf',
    'italic': '/fonts/SegoeUI/Segoe UI_cursive.ttf',
    'bolditalic': '/fonts/SegoeUI/Segoe UI_bold_cursive.ttf',
  },
  // Times New Roman
  'Times New Roman': {
    'normal': '/fonts/Times New Roman/timesnrcyrmt.ttf',
    'bold': '/fonts/Times New Roman/timesnrcyrmt_bold.ttf',
    'italic': '/fonts/Times New Roman/timesnrcyrmt_inclined.ttf',
    'bolditalic': '/fonts/Times New Roman/timesnrcyrmt_boldinclined.ttf',
  },
}

/**
 * Маппинг системных шрифтов на локальные шрифты
 * Используется для fallback, когда выбран шрифт, которого нет в FONT_URLS
 */
const FONT_FALLBACK: Record<string, string> = {
  'Arial': 'Roboto',
  'Helvetica': 'Roboto',
  'Segoe UI': 'Segoe UI', // есть локально
  'Tahoma': 'Roboto',
  'Verdana': 'Roboto',
  'Times New Roman': 'Times New Roman', // есть локально
  'Georgia': 'Times New Roman',
  'Courier': 'Roboto',
  'Courier New': 'Roboto',
  'Open Sans': 'Roboto',
  'PT Serif': 'Times New Roman',
}

// ========== Вспомогательные функции ==========

/**
 * Получить ключ для кэша шрифта
 */
function getFontKey(fontFamily: string, weight: 'normal' | 'bold', style: 'normal' | 'italic'): string {
  let variant: string = weight
  if (style === 'italic') {
    variant = weight === 'bold' ? 'bolditalic' : 'italic'
  }
  return `${fontFamily}-${variant}`
}

/**
 * Загрузить шрифт по URL
 */
async function loadFontFromUrl(url: string): Promise<ArrayBuffer> {
  console.log(`Loading font from: ${url}`)
  const response = await fetch(url, {
    mode: 'cors',
    cache: 'force-cache',
  })
  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.status} ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  console.log(`Font loaded, size: ${buffer.byteLength} bytes`)
  if (buffer.byteLength < 1000) {
    throw new Error('Font file too small, possibly corrupt')
  }
  return buffer
}

/**
 * Получить URL шрифта для варианта
 * Использует fallback для системных шрифтов
 */
function getFontUrl(fontFamily: string, weight: 'normal' | 'bold', style: 'normal' | 'italic'): { url: string | null, actualFont: string } {
  // Сначала проверяем, есть ли шрифт напрямую
  let fontUrls = FONT_URLS[fontFamily]
  let actualFont = fontFamily
  
  // Если нет - пробуем fallback
  if (!fontUrls) {
    const fallbackFont = FONT_FALLBACK[fontFamily] || DEFAULT_CYRILLIC_FONT
    fontUrls = FONT_URLS[fallbackFont]
    actualFont = fallbackFont
    
    if (!fontUrls) {
      // Последний fallback на Roboto
      fontUrls = FONT_URLS[DEFAULT_CYRILLIC_FONT]
      actualFont = DEFAULT_CYRILLIC_FONT
    }
  }
  
  if (!fontUrls) {
    return { url: null, actualFont }
  }
  
  let variant: string = weight
  if (style === 'italic') {
    variant = weight === 'bold' ? 'bolditalic' : 'italic'
  }
  
  // Если нужного варианта нет, пробуем fallback на normal
  const url = fontUrls[variant] || fontUrls['normal'] || null
  return { url, actualFont }
}

/**
 * Добавить шрифт в PDF документ
 * ВАЖНО: Для кириллицы обязательно нужен TTF шрифт!
 * Стандартные шрифты jsPDF (helvetica, times, courier) НЕ поддерживают кириллицу.
 */
async function embedFont(
  doc: jsPDF,
  fontFamily: string,
  weight: 'normal' | 'bold',
  style: 'normal' | 'italic'
): Promise<{ fontName: string; fontStyle: string }> {
  // Получаем URL шрифта (с fallback для системных шрифтов)
  const { url: fontUrl, actualFont } = getFontUrl(fontFamily, weight, style)
  
  if (!fontUrl) {
    console.warn(`Font ${fontFamily} not available and no fallback found`)
    // Возвращаем Roboto как последний fallback
    const robotoResult = getFontUrl(DEFAULT_CYRILLIC_FONT, weight, style)
    if (robotoResult.url) {
      return embedFont(doc, DEFAULT_CYRILLIC_FONT, weight, style)
    }
    // Крайний случай (без кириллицы!)
    return { fontName: 'helvetica', fontStyle: 'normal' }
  }
  
  // Формируем уникальный ключ для этого варианта шрифта
  const fontKey = getFontKey(actualFont, weight, style)
  const jsPdfFontName = actualFont.replace(/\s+/g, '') + '_' + fontKey.split('-')[1]
  const jsPdfFontStyle = 'normal' // Мы встраиваем каждый вариант как отдельный шрифт
  
  // Проверяем, уже ли загружен этот шрифт в документ
  const existingFonts = doc.getFontList()
  if (existingFonts[jsPdfFontName]) {
    console.log(`Font ${jsPdfFontName} already loaded`)
    return { fontName: jsPdfFontName, fontStyle: jsPdfFontStyle }
  }
  
  // Проверяем кэш данных шрифта
  let fontData = loadedFonts.get(fontKey)
  
  if (!fontData) {
    try {
      fontData = await loadFontFromUrl(fontUrl)
      loadedFonts.set(fontKey, fontData)
    } catch (error) {
      console.error(`Failed to load font ${actualFont}:`, error)
      // Пробуем Roboto как fallback
      if (actualFont !== DEFAULT_CYRILLIC_FONT) {
        return embedFont(doc, DEFAULT_CYRILLIC_FONT, weight, style)
      }
      return { fontName: 'helvetica', fontStyle: 'normal' }
    }
  }
  
  // Конвертируем ArrayBuffer в base64
  const fontBase64 = arrayBufferToBase64(fontData)
  
  // Добавляем шрифт в jsPDF
  // Каждый вариант (regular, bold, italic, bolditalic) - отдельный шрифт
  const vfsFileName = `${fontKey}.ttf`
  doc.addFileToVFS(vfsFileName, fontBase64)
  doc.addFont(vfsFileName, jsPdfFontName, jsPdfFontStyle)
  
  console.log(`Font registered: ${jsPdfFontName} from ${vfsFileName}`)
  
  return { fontName: jsPdfFontName, fontStyle: jsPdfFontStyle }
}

/**
 * Конвертировать ArrayBuffer в base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Измерить ширину текста в мм
 */
function measureTextWidth(doc: jsPDF, text: string, fontSize: number): number {
  // jsPDF.getStringUnitWidth возвращает ширину в units шрифта
  // Нужно умножить на fontSize и разделить на масштаб
  const stringWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor
  return stringWidth
}

/**
 * Вписать текст в заданную ширину (адаптивный размер)
 */
function fitTextToWidth(
  doc: jsPDF,
  text: string,
  maxFontSize: number,
  maxWidth: number,
  minFontSize: number = 6
): number {
  let fontSize = maxFontSize
  
  while (fontSize > minFontSize) {
    doc.setFontSize(fontSize)
    const textWidth = measureTextWidth(doc, text, fontSize)
    
    if (textWidth <= maxWidth) {
      return fontSize
    }
    
    fontSize -= 0.5
  }
  
  return minFontSize
}


// ========== Основные функции ========== 

// import React from 'react'

/**
 * Отрисовать текстовый элемент на странице PDF
 */
async function renderTextElement(
  doc: jsPDF,
  element: TextFieldElement,
  data: PrintData,
  pageWidth: number
): Promise<void> {
  // Получаем текст из данных
  const text = element.fieldKey 
    ? String(data[element.fieldKey] ?? '')
    : '[Поле не выбрано]'
  
  if (!text) return
  
  // Встраиваем и устанавливаем шрифт
  const { fontName, fontStyle } = await embedFont(doc, element.fontFamily, element.fontWeight, element.fontStyle)
  
  doc.setFont(fontName, fontStyle)
  
  // Размер шрифта (уже в pt)
  let fontSize = element.fontSize
  
  // Ширина элемента
  const elementWidth = element.fullWidth ? pageWidth : element.width
  
  // Адаптивный размер шрифта
  if (element.adaptive) {
    fontSize = fitTextToWidth(doc, text, fontSize, elementWidth)
  }
  
  doc.setFontSize(fontSize)
  
  // Цвет текста (чёрный)
  doc.setTextColor(0, 0, 0)
  
  // Позиция X с учётом выравнивания
  let x = element.x
  let align: 'left' | 'center' | 'right' = 'left'
  
  if (element.fullWidth) {
    // Для полной ширины - позиция от края
    switch (element.textAlign) {
      case 'center':
        x = pageWidth / 2
        align = 'center'
        break
      case 'right':
        x = pageWidth - 2 // небольшой отступ справа
        align = 'right'
        break
      default:
        x = 2 // небольшой отступ слева
        align = 'left'
    }
  } else {
    // Для фиксированной ширины
    switch (element.textAlign) {
      case 'center':
        x = element.x + element.width / 2
        align = 'center'
        break
      case 'right':
        x = element.x + element.width
        align = 'right'
        break
      default:
        align = 'left'
    }
  }
  
  // Позиция Y
  // В jsPDF y=0 это верх страницы, что совпадает с нашей системой координат
  const y = element.y + (fontSize * 0.35) // Небольшая коррекция для baseline
  
  // Рисуем текст
  doc.text(text, x, y, { align })
}

/**
 * Сгенерировать PDF для одного бейджа
 */
export async function generateBadgePdf(
  template: PrintTemplate,
  data: PrintData,
  options: PrintOptions = {}
): Promise<Blob> {
  const { download = false, filename = 'badge.pdf' } = options
  
  // Создаём PDF документ с размерами в мм
  const doc = new jsPDF({
    orientation: template.widthMm > template.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [template.widthMm, template.heightMm],
  })
  
  // Рендерим все элементы
  for (const element of template.elements) {
    if (element.type === 'text') {
      await renderTextElement(doc, element, data, template.widthMm)
    } else if (element.type === 'qr') {
      await renderQrElement(doc, element, data, template.widthMm)
    }
  }
  // Если нужно скачать
  if (download) {
    doc.save(filename)
  }
  // Возвращаем Blob
  return doc.output('blob')
}

/**
 * Сгенерировать PDF для нескольких бейджей (каждый на отдельной странице)
 */
export async function generateMultipleBadgesPdf(
  template: PrintTemplate,
  dataList: PrintData[],
  options: PrintOptions = {}
): Promise<Blob> {
  const { download = false, filename = 'badges.pdf' } = options
  
  if (dataList.length === 0) {
    throw new Error('No data provided for PDF generation')
  }
  
  // Создаём PDF документ
  const doc = new jsPDF({
    orientation: template.widthMm > template.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [template.widthMm, template.heightMm],
  })
  
  // Рендерим бейджи
  for (let i = 0; i < dataList.length; i++) {
    if (i > 0) {
      doc.addPage([template.widthMm, template.heightMm])
    }
    
    const data = dataList[i]
    
    for (const element of template.elements) {
      if (element.type === 'text') {
        await renderTextElement(doc, element, data, template.widthMm)
      } else if (element.type === 'qr') {
        await renderQrElement(doc, element, data, template.widthMm)
      }
    }
  }
  
  // Если нужно скачать
  if (download) {
    doc.save(filename)
  }
  // Возвращаем Blob
  return doc.output('blob')
}

/**
 * Открыть PDF в новой вкладке для предпросмотра
 */
export async function previewBadgePdf(
  template: PrintTemplate,
  data: PrintData
): Promise<void> {
  const blob = await generateBadgePdf(template, data)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  
  // Освобождаем URL через некоторое время
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/**
 * Скачать PDF файл
 */
export async function downloadBadgePdf(
  template: PrintTemplate,
  data: PrintData,
  filename: string = 'badge.pdf'
): Promise<void> {
  await generateBadgePdf(template, data, { download: true, filename })
}

/**
 * Скачать PDF с несколькими бейджами
 */
export async function downloadMultipleBadgesPdf(
  template: PrintTemplate,
  dataList: PrintData[],
  filename: string = 'badges.pdf'
): Promise<void> {
  await generateMultipleBadgesPdf(template, dataList, { download: true, filename })
}

// ========== Вспомогательные функции для конвертации единиц ==========

/**
 * Конвертировать миллиметры в точки (points)
 */
export function mmToPoints(mm: number): number {
  return mm * MM_TO_PT
}

/**
 * Конвертировать точки в миллиметры
 */
export function pointsToMm(pt: number): number {
  return pt / MM_TO_PT
}

/**
 * Конвертировать пиксели экрана (96 DPI) в миллиметры
 */
export function screenPxToMm(px: number): number {
  return px / (96 / 25.4) // 96 DPI screen
}

/**
 * Конвертировать миллиметры в пиксели экрана (96 DPI)
 */
export function mmToScreenPx(mm: number): number {
  return mm * (96 / 25.4)
}

/**
 * Конвертировать пиксели печати (300 DPI) в миллиметры
 */
export function printPxToMm(px: number): number {
  return px / (300 / 25.4) // 300 DPI print
}

/**
 * Конвертировать миллиметры в пиксели печати (300 DPI)
 */
export function mmToPrintPx(mm: number): number {
  return mm * (300 / 25.4)
}
