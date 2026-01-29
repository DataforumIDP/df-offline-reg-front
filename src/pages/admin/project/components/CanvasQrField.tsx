import { useRef, useState, useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectElement, moveElement, resizeElement, QrElement } from '@/store/slices/templateEditorSlice'
import styles from './CanvasQrField.module.css'
import { QRCode } from 'react-qrcode-logo'

interface CanvasQrFieldProps {
  element: QrElement
  screenPxPerMm: number
  zoom: number
  canvasWidthMm: number
}

const CanvasQrField = ({ element, screenPxPerMm, zoom, canvasWidthMm }: CanvasQrFieldProps) => {
  const dispatch = useAppDispatch()
  const selectedElementId = useAppSelector(state => state.templateEditor.selectedElementId)
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 })

  const isSelected = selectedElementId === element.id
  const scale = (zoom / 100) * screenPxPerMm

  // Центрирование по X если center=true
  const x = element.center ? (canvasWidthMm - element.width) / 2 : element.x
  const y = element.y
  const px = x * scale
  const py = y * scale
  const sizePx = element.width * scale

  // Обработчик клика - выбор элемента
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(selectElement(element.id))
  }

  // === Drag handlers ===
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains(styles.resizeHandle)) {
      return // Не начинаем перетаскивание если кликнули на ресайз-хэндл
    }
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
    })
    dispatch(selectElement(element.id))
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !element.center) {
      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale
      let newX = dragStart.elementX + deltaX
      let newY = dragStart.elementY + deltaY
      // Ограничиваем перемещение границами холста
      newX = Math.max(0, Math.min(newX, canvasWidthMm - element.width))
      newY = Math.max(0, newY)
      dispatch(moveElement({ id: element.id, x: newX, y: newY }))
    }
    if (isDragging && element.center) {
      // Только Y можно менять
      const deltaY = (e.clientY - dragStart.y) / scale
      let newY = dragStart.elementY + deltaY
      newY = Math.max(0, newY)
      dispatch(moveElement({ id: element.id, x: element.x, y: newY }))
    }
    if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / scale
      let newWidth = resizeStart.width + deltaX
      // Минимальная ширина 10мм
      newWidth = Math.max(10, newWidth)
      // Максимальная - не выходить за холст
      newWidth = Math.min(newWidth, canvasWidthMm - (element.center ? 0 : element.x))
      dispatch(resizeElement({ id: element.id, width: newWidth }))
    }
  }, [isDragging, isResizing, dragStart, resizeStart, scale, canvasWidthMm, element, dispatch])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // === Resize handlers ===
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      width: element.width,
    })
  }

  // Глобальные обработчики для drag & resize
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Значение для QR
  const value = element.resourceType === 'field'
    ? (element.prefix || '') + (element.fieldKey || '')
    : element.fixedValue || ''

  return (
    <div
      ref={elementRef}
      className={`${styles.element} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: px,
        top: py,
        width: sizePx,
        height: sizePx,
        zIndex: isSelected ? 2 : 1,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <QRCode
        value={value || ' '}
        size={sizePx}
        ecLevel={element.ecLevel as any}
        fgColor={element.fgColor}
        bgColor={element.bgColor}
        qrStyle={element.moduleStyle as any}
        eyeRadius={element.eyeBorderStyle === 'round' ? 6 : 0}
      />
      {/* Resize handle - только если выбран */}
      {isSelected && (
        <div
          className={styles.resizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  )
}

export default CanvasQrField
