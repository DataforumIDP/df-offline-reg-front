import { fetchPrintTemplateById } from '@/services/api/templates'
import { loadPrintSettings, sendPdfToPrintServer } from '@/components/organisms/PrintSettings'
import { isElectron } from '@/hooks/useElectron'

/**
 * Convert Blob to Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Отправить Blob на печать:
 * - Electron: печать через Ghostscript
 * - Web: либо открыть в браузере, либо отправить на сервер REGA Print
 */
export async function printOrSend(
    blob: Blob,
    copies: number = 1,
): Promise<{ mode: 'web' | 'server' | 'electron'; message: string }> {
    // Check if running in Electron
    if (isElectron() && window.electronAPI) {
        try {
            const pdfBase64 = await blobToBase64(blob)
            const result = await window.electronAPI.printPdf({
                pdfBase64,
                copies,
                filename: `badge-${Date.now()}.pdf`,
            })

            if (result.success) {
                return { mode: 'electron', message: result.message || 'Отправлено на печать' }
            } else {
                throw new Error(result.error || 'Ошибка печати')
            }
        } catch (error: any) {
            throw new Error(error.message || 'Ошибка печати в Electron')
        }
    }

    // Web mode fallback
    const settings = loadPrintSettings()

    if (settings.mode === 'server') {
        const result = await sendPdfToPrintServer(
            blob,
            settings.server.address,
            settings.server.port,
            copies,
        )
        return { mode: 'server', message: result.message }
    }

    // WEB mode — открыть PDF в новой вкладке
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return { mode: 'web', message: 'PDF открыт в новой вкладке' }
}

/**
 * Сгенерировать и скачать PDF бейджа по id шаблона
 */
export async function printBadgeByTemplateId(
    templateId: number,
    data: PrintData,
    options: PrintOptions = {},
): Promise<Blob> {
    const template = await fetchPrintTemplateById(templateId)
    // Преобразуем к формату PrintTemplate (elements, widthMm, heightMm)
    const settings = template.settings || {}
    const normalizedTemplate = {
        widthMm: settings.widthMm,
        heightMm: settings.heightMm,
        elements: settings.elements || [],
    }
    return generateBadgePdf(normalizedTemplate, data, options)
}

/**
 * Сгенерировать и скачать PDF для нескольких бейджей по id шаблона
 */
export async function printMultipleBadgesByTemplateId(
    templateId: number,
    dataList: PrintData[],
    options: PrintOptions = {},
): Promise<Blob> {
    const template = await fetchPrintTemplateById(templateId)
    const settings = template.settings || {}
    const normalizedTemplate = {
        widthMm: settings.widthMm,
        heightMm: settings.heightMm,
        elements: settings.elements || [],
    }
    return generateMultipleBadgesPdf(normalizedTemplate, dataList, options)
}

/**
 * Открыть PDF / отправить на сервер печати по id шаблона
 */
export async function previewBadgeByTemplateId(
    templateId: number,
    data: PrintData,
): Promise<{ mode: 'web' | 'server' | 'electron'; message: string }> {
    const blob = await printBadgeByTemplateId(templateId, data)
    return printOrSend(blob)
}

/**
 * Скачать PDF файл по id шаблона
 */
export async function downloadBadgeByTemplateId(
    templateId: number,
    data: PrintData,
    filename: string = 'badge.pdf',
): Promise<void> {
    await printBadgeByTemplateId(templateId, data, { download: true, filename })
}

/**
 * Скачать PDF с несколькими бейджами по id шаблона
 */
export async function downloadMultipleBadgesByTemplateId(
    templateId: number,
    dataList: PrintData[],
    filename: string = 'badges.pdf',
): Promise<void> {
    await printMultipleBadgesByTemplateId(templateId, dataList, { download: true, filename })
}
// --- QR PDF rendering ---
async function renderQrElement(
    doc: jsPDF,
    element: import('@/store/slices/templateEditorSlice').QrElement,
    data: PrintData,
    pageWidth: number,
): Promise<void> {
    let value = ''
    if (element.resourceType === 'field' && element.fieldKey) {
        value = String(data[element.fieldKey] ?? '')
    } else if (element.resourceType === 'fixed' && element.fixedValue) {
        value = String(element.fixedValue)
    }
    if (element.prefix) {
        value = element.prefix + value
    }
    if (!value) {
        return
    }
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
            errorCorrectionLevel: (element.ecLevel as any) || 'Q',
        },
    })
    // @ts-ignore
    const moduleCount = tmpQr._qr ? tmpQr._qr.getModuleCount() : 21 // fallback на 21 (QR v1)
    // 2. Рассчитываем нужный canvasPx, чтобы "активная" часть QR заняла sizePx
    const quietZoneModules = 4 // qr-code-styling всегда добавляет 4 модуля
    const canvasPx = Math.round((sizePx * (moduleCount + 2 * quietZoneModules)) / moduleCount)
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
    if (!dataUrl) {
        return
    }
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
 * Проверить доступность всех шрифтов (для диагностики)
 */
export async function checkFontsAvailability(): Promise<
    { font: string; variant: string; url: string; ok: boolean; error?: string }[]
> {
    const results: { font: string; variant: string; url: string; ok: boolean; error?: string }[] = []
    for (const [fontName, variants] of Object.entries(FONT_URLS)) {
        for (const [variant, url] of Object.entries(variants)) {
            try {
                const buf = await loadFontFromUrl(url)
                results.push({ font: fontName, variant, url, ok: buf.byteLength > 1000 })
            } catch (e: any) {
                results.push({ font: fontName, variant, url, ok: false, error: e.message })
            }
        }
    }
    return results
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
    // Inter - современный шрифт с поддержкой кириллицы
    Inter: {
        normal: '/fonts/Inter/Inter-Regular.otf',
        bold: '/fonts/Inter/Inter-Bold.otf',
        italic: '/fonts/Inter/Inter-Italic.otf',
        bolditalic: '/fonts/Inter/Inter-BoldItalic.otf',
    },
    // Roboto - основной шрифт с полной поддержкой кириллицы
    Roboto: {
        normal: '/fonts/Roboto/Roboto-Regular.ttf',
        bold: '/fonts/Roboto/Roboto-Bold.ttf',
        italic: '/fonts/Roboto/Roboto-Italic.ttf',
        bolditalic: '/fonts/Roboto/Roboto-BoldItalic.ttf',
    },
    // Segoe UI
    'Segoe UI': {
        normal: '/fonts/SegoeUI/Segoe UI.ttf',
        bold: '/fonts/SegoeUI/Segoe UI_bold.ttf',
        italic: '/fonts/SegoeUI/Segoe UI_cursive.ttf',
        bolditalic: '/fonts/SegoeUI/Segoe UI_bold_cursive.ttf',
    },
    // Times New Roman
    'Times New Roman': {
        normal: '/fonts/Times New Roman/timesnrcyrmt.ttf',
        bold: '/fonts/Times New Roman/timesnrcyrmt_bold.ttf',
        italic: '/fonts/Times New Roman/timesnrcyrmt_inclined.ttf',
        bolditalic: '/fonts/Times New Roman/timesnrcyrmt_boldinclined.ttf',
    },
    'TikTok Sans': {
        normal: '/fonts/TTSans/TTSansReg.ttf',
        bold: '/fonts/TTSans/TTSansSemiBold.ttf',
        italic: '/fonts/Times New Roman/timesnrcyrmt_inclined.ttf',
        bolditalic: '/fonts/Times New Roman/timesnrcyrmt_boldinclined.ttf',
    },
    // Inter GF - статические TTF файлы, оптический размер 18pt
    InterGF: {
        normal: '/fonts/InterGF/Inter_18pt-Regular.ttf',
        bold: '/fonts/InterGF/Inter_18pt-Bold.ttf',
        italic: '/fonts/InterGF/Inter_18pt-Italic.ttf',
        bolditalic: '/fonts/InterGF/Inter_18pt-BoldItalic.ttf',
    },
}

/**
 * Маппинг системных шрифтов на локальные шрифты
 * Используется для fallback, когда выбран шрифт, которого нет в FONT_URLS
 */
const FONT_FALLBACK: Record<string, string> = {
    Arial: 'Roboto',
    Helvetica: 'Roboto',
    'TikTok Sans': 'Roboto',
    'Segoe UI': 'Segoe UI',
    Tahoma: 'Roboto',
    Verdana: 'Roboto',
    'Times New Roman': 'Times New Roman',
    Georgia: 'Times New Roman',
    Courier: 'Roboto',
    'Courier New': 'Roboto',
    'Open Sans': 'Roboto',
    'PT Serif': 'Times New Roman',
    Inter: 'Inter',
    InterGF: 'InterGF',
}

// ========== Вспомогательные функции ==========

/**
 * Получить ключ для кэша шрифта
 */
function getFontKey(
    fontFamily: string,
    weight: 'normal' | 'bold',
    style: 'normal' | 'italic',
): string {
    let variant: string = weight
    if (style === 'italic') {
        variant = weight === 'bold' ? 'bolditalic' : 'italic'
    }
    return `${fontFamily}-${variant}`
}

/**
 * Загрузить шрифт по URL
 * В Electron: читаем файл через IPC (fetch не работает с file://)
 * В Web: обычный fetch
 */
async function loadFontFromUrl(url: string): Promise<ArrayBuffer> {
    // Electron: загрузка через IPC из файловой системы
    if (typeof window !== 'undefined' && (window as any).electronAPI?.readFontFile) {
        try {
            // url вида '/fonts/Roboto/Roboto-Regular.ttf' -> 'fonts/Roboto/Roboto-Regular.ttf'
            const relativePath = url.startsWith('/') ? url.slice(1) : url
            console.log(`Loading font via IPC: ${relativePath}`)
            const base64 = await (window as any).electronAPI.readFontFile(relativePath)
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i)
            }
            console.log(`Font loaded via IPC, size: ${bytes.byteLength} bytes`)
            return bytes.buffer
        } catch (error) {
            console.error(`Failed to load font via IPC: ${url}`, error)
            throw error
        }
    }

    // Web: обычный fetch
    console.log(`Loading font from: ${url}`)
    const response = await fetch(url, {
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
function getFontUrl(
    fontFamily: string,
    weight: 'normal' | 'bold',
    style: 'normal' | 'italic',
): { url: string | null; actualFont: string } {
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
    style: 'normal' | 'italic',
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
    const stringWidth = (doc.getStringUnitWidth(text) * fontSize) / doc.internal.scaleFactor
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
    minFontSize: number = 6,
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
    pageWidth: number,
): Promise<void> {
    // Получаем текст из данных
    let text = element.fieldKey ? String(data[element.fieldKey] ?? '') : '[Поле не выбрано]'

    if (!text) {
        return
    }

    // Применяем разбиение по сепаратору если указан
    if (element.separator !== undefined && element.separatorIndex !== undefined) {
        const parts = text.split(element.separator).map(part => part.trim()).filter(part => part.length > 0)
        const index = element.separatorIndex
        
        if (element.separatorExtra) {
            // Захватываем все части начиная с индекса
            text = parts.slice(index).join(element.separator).trim()
        } else {
            // Берём только одну часть по индексу
            text = parts[index]?.trim() ?? ''
        }
        
        // Если часть не найдена - возвращаем пустоту
        if (!text) {
            return
        }
    }

    // Применяем верхний регистр если включён
    if (element.uppercase) {
        text = text.toUpperCase()
    }

    // Встраиваем и устанавливаем шрифт
    const { fontName, fontStyle } = await embedFont(
        doc,
        element.fontFamily,
        element.fontWeight,
        element.fontStyle,
    )

    doc.setFont(fontName, fontStyle)

    // Размер шрифта (уже в pt)
    let fontSize = element.fontSize

    // Ширина элемента
    const elementWidth = element.fullWidth ? pageWidth : element.width

    // Адаптивный размер шрифта (только если не многострочный режим)
    if (element.adaptive && !element.multiline) {
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
    const y = element.y + fontSize * 0.35 // Небольшая коррекция для baseline

    // Многострочный режим - разбить текст на строки и обрезать с троеточием
    if (element.multiline && element.maxLines) {
        const maxLines = Math.min(Math.max(element.maxLines, 1), 10)
        // Межстрочный интервал: fontSize в pt, конвертируем в mm (1pt = 0.3528mm), множитель 1.2
        const lineHeightMm = fontSize * 0.3528 * 1.2

        // Разбиваем текст на строки, которые помещаются в ширину
        const lines = doc.splitTextToSize(text, elementWidth)

        // Ограничиваем количество строк
        const displayLines: string[] = lines.slice(0, maxLines)

        // Если текст был обрезан, добавляем троеточие к последней строке
        if (lines.length > maxLines) {
            const lastLine = displayLines[displayLines.length - 1]
            // Обрезаем последнюю строку и добавляем троеточие
            let truncatedLine = lastLine
            const ellipsis = '…'

            // Проверяем, помещается ли строка с троеточием
            while (
                measureTextWidth(doc, truncatedLine + ellipsis, fontSize) > elementWidth &&
                truncatedLine.length > 0
            ) {
                truncatedLine = truncatedLine.slice(0, -1).trim()
            }

            displayLines[displayLines.length - 1] = truncatedLine + ellipsis
        }

        // Рисуем каждую строку
        displayLines.forEach((line, index) => {
            const lineY = y + index * lineHeightMm
            doc.text(line, x, lineY, { align })
        })
    } else {
        // Обычный режим - одна строка
        doc.text(text, x, y, { align })
    }
}

/**
 * Сгенерировать PDF для одного бейджа
 */
export async function generateBadgePdf(
    template: PrintTemplate,
    data: PrintData,
    options: PrintOptions = {},
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
    options: PrintOptions = {},
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
 * Открыть PDF / отправить на сервер печати
 */
export async function previewBadgePdf(
    template: PrintTemplate,
    data: PrintData,
): Promise<{ mode: 'web' | 'server' | 'electron'; message: string }> {
    const blob = await generateBadgePdf(template, data)
    return printOrSend(blob)
}

/**
 * Скачать PDF файл
 */
export async function downloadBadgePdf(
    template: PrintTemplate,
    data: PrintData,
    filename: string = 'badge.pdf',
): Promise<void> {
    await generateBadgePdf(template, data, { download: true, filename })
}

/**
 * Скачать PDF с несколькими бейджами
 */
export async function downloadMultipleBadgesPdf(
    template: PrintTemplate,
    dataList: PrintData[],
    filename: string = 'badges.pdf',
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

/**
 * Сгенерировать превью (JPG) из шаблона для использования как прелоадера
 * Создаёт canvas с отрендеренными элементами и возвращает Blob
 */
export async function generateTemplatePreview(
    template: PrintTemplate,
    sampleData: PrintData = {},
): Promise<Blob> {
    // Размеры canvas (используем 96 DPI как для экрана, но масштабируем 2x для качества)
    const scale = 2
    const screenDpi = 96
    const pxPerMm = (screenDpi / 25.4) * scale

    const width = Math.round(template.widthMm * pxPerMm)
    const height = Math.round(template.heightMm * pxPerMm)

    // Создаём canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Белый фон
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Рендерим текстовые элементы
    for (const element of template.elements) {
        if (element.type === 'text') {
            const textEl = element as import('@/store/slices/templateEditorSlice').TextFieldElement

            // Получаем значение поля или используем placeholder
            const fieldKey = textEl.fieldKey || 'field'
            const text = (sampleData[fieldKey] as string) || fieldKey

            // Позиция
            const x = textEl.fullWidth
                ? textEl.textAlign === 'center'
                    ? width / 2
                    : textEl.textAlign === 'right'
                      ? width - 10
                      : 10
                : textEl.x * pxPerMm
            const y = textEl.y * pxPerMm

            // Ширина элемента в px
            const elementWidthPx = textEl.fullWidth ? width - 20 : textEl.width * pxPerMm

            // Стиль шрифта
            const fontSizePx = ((textEl.fontSize * pxPerMm) / (300 / 25.4)) * (screenDpi / 25.4)
            const fontWeight = textEl.fontWeight === 'bold' ? 'bold' : 'normal'
            const fontStyle = textEl.fontStyle === 'italic' ? 'italic' : 'normal'
            ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${textEl.fontFamily || 'Arial'}`
            ctx.fillStyle = '#000000'
            ctx.textAlign = textEl.textAlign as CanvasTextAlign
            ctx.textBaseline = 'top'

            // Многострочный режим
            if (textEl.multiline && textEl.maxLines) {
                const maxLines = Math.min(Math.max(textEl.maxLines, 1), 10)
                const lineHeight = fontSizePx * 1.2 // Межстрочный интервал

                // Разбиваем текст на слова и формируем строки
                const words = text.split(' ')
                const lines: string[] = []
                let currentLine = ''

                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word
                    const testWidth = ctx.measureText(testLine).width

                    if (testWidth > elementWidthPx && currentLine) {
                        lines.push(currentLine)
                        currentLine = word
                    } else {
                        currentLine = testLine
                    }
                }
                if (currentLine) {
                    lines.push(currentLine)
                }

                // Ограничиваем и добавляем троеточие
                const displayLines = lines.slice(0, maxLines)
                if (lines.length > maxLines) {
                    let lastLine = displayLines[displayLines.length - 1]
                    const ellipsis = '…'
                    while (
                        ctx.measureText(lastLine + ellipsis).width > elementWidthPx &&
                        lastLine.length > 0
                    ) {
                        lastLine = lastLine.slice(0, -1).trim()
                    }
                    displayLines[displayLines.length - 1] = lastLine + ellipsis
                }

                // Рисуем каждую строку
                displayLines.forEach((line, index) => {
                    ctx.fillText(line, x, y + index * lineHeight)
                })
            } else {
                ctx.fillText(text, x, y)
            }
        } else if (element.type === 'qr') {
            const qrEl = element as import('@/store/slices/templateEditorSlice').QrElement

            // Позиция и размер
            const size = qrEl.width * pxPerMm
            const x = qrEl.center ? (width - size) / 2 : qrEl.x * pxPerMm
            const y = qrEl.y * pxPerMm

            // Рисуем placeholder для QR
            ctx.strokeStyle = '#cccccc'
            ctx.lineWidth = 2
            ctx.strokeRect(x, y, size, size)

            ctx.fillStyle = '#cccccc'
            ctx.font = `${size * 0.15}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('QR', x + size / 2, y + size / 2)
        }
    }

    // Конвертируем в JPG blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Failed to convert canvas to blob'))
                }
            },
            'image/jpeg',
            0.85, // качество 85%
        )
    })
}
