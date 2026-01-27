import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectElement, moveElement, resizeElement, TextFieldElement } from '@/store/slices/templateEditorSlice'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import styles from './CanvasTextField.module.css'

interface CanvasTextFieldProps {
  element: TextFieldElement
  screenPxPerMm: number
  zoom: number
  canvasWidthMm: number
}

const CanvasTextField = ({ element, screenPxPerMm, zoom, canvasWidthMm }: CanvasTextFieldProps) => {
  const { id: projectId } = useParams()
  const dispatch = useAppDispatch()
  const selectedElementId = useAppSelector(state => state.templateEditor.selectedElementId)
  const { data: scheme } = useSchemeQuery(projectId || '')

  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, elementX: 0, elementY: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 })

  const isSelected = selectedElementId === element.id
  const scale = (zoom / 100) * screenPxPerMm

  // Получаем лейбл поля из схемы
  const fieldLabel = element.fieldKey
    ? scheme?.fields.find(f => f.key === element.fieldKey)?.label || element.fieldKey
    : 'Без привязки'

  // Вычисляем размеры в пикселях экрана
  const width = element.fullWidth ? canvasWidthMm * scale : element.width * scale
  const x = element.fullWidth ? 0 : element.x * scale
  const y = element.y * scale

  // Конвертация pt в px для экрана
  // 1pt = 1/72 дюйма = 25.4/72 мм ≈ 0.3528 мм
  const PT_TO_MM = 25.4 / 72
  const fontSizeInPx = element.fontSize * PT_TO_MM * screenPxPerMm * (zoom / 100)

  // Стили текста
  const textStyle: React.CSSProperties = {
    fontFamily: element.fontFamily,
    fontSize: fontSizeInPx,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textAlign: element.textAlign,
  }

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
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale

      let newX = dragStart.elementX + deltaX
      let newY = dragStart.elementY + deltaY

      // Ограничиваем перемещение границами холста
      newX = Math.max(0, Math.min(newX, canvasWidthMm - element.width))
      newY = Math.max(0, newY)

      dispatch(moveElement({ id: element.id, x: newX, y: newY }))
    }

    if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / scale
      let newWidth = resizeStart.width + deltaX
      
      // Минимальная ширина 5мм
      newWidth = Math.max(5, newWidth)
      // Максимальная - не выходить за холст
      newWidth = Math.min(newWidth, canvasWidthMm - element.x)

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

  return (
    <div
      ref={elementRef}
      className={`${styles.element} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        left: x,
        top: y,
        width,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.content} style={textStyle}>
        {fieldLabel}
      </div>

      {/* Resize handle - только если не fullWidth и выбран */}
      {isSelected && !element.fullWidth && (
        <div
          className={styles.resizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  )
}

export default CanvasTextField
