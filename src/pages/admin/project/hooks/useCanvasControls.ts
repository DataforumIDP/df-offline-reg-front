import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    setCanvasWidth,
    setCanvasHeight,
    setZoom,
    setSizeUnit,
} from '@/store/slices/templateEditorSlice'
import { pxToMm, SCREEN_PX_PER_MM } from '../constants/templateEditor'

export const useCanvasControls = () => {
    const dispatch = useAppDispatch()
    const { canvas } = useAppSelector((state) => state.templateEditor)
    const { widthMm: canvasWidthMm, heightMm: canvasHeightMm, zoom, sizeUnit } = canvas

    // Значения для отображения в зависимости от единиц
    const displayWidth =
        sizeUnit === 'mm' ? canvasWidthMm : Math.round(canvasWidthMm * (300 / 25.4))
    const displayHeight =
        sizeUnit === 'mm' ? canvasHeightMm : Math.round(canvasHeightMm * (300 / 25.4))

    // Размер холста на экране (с учётом масштаба)
    const canvasDisplayWidth = canvasWidthMm * SCREEN_PX_PER_MM * (zoom / 100)
    const canvasDisplayHeight = canvasHeightMm * SCREEN_PX_PER_MM * (zoom / 100)

    const handleWidthChange = useCallback(
        (value: string) => {
            const numValue = parseFloat(value) || 0
            if (sizeUnit === 'mm') {
                dispatch(setCanvasWidth(numValue))
            } else {
                dispatch(setCanvasWidth(pxToMm(numValue)))
            }
        },
        [sizeUnit, dispatch],
    )

    const handleHeightChange = useCallback(
        (value: string) => {
            const numValue = parseFloat(value) || 0
            if (sizeUnit === 'mm') {
                dispatch(setCanvasHeight(numValue))
            } else {
                dispatch(setCanvasHeight(pxToMm(numValue)))
            }
        },
        [sizeUnit, dispatch],
    )

    const handleZoomChange = useCallback(
        (value: number) => {
            dispatch(setZoom(value))
        },
        [dispatch],
    )

    const handleSizeUnitChange = useCallback(
        (value: 'mm' | 'px') => {
            dispatch(setSizeUnit(value))
        },
        [dispatch],
    )

    return {
        canvasWidthMm,
        canvasHeightMm,
        zoom,
        sizeUnit,
        displayWidth,
        displayHeight,
        canvasDisplayWidth,
        canvasDisplayHeight,
        handleWidthChange,
        handleHeightChange,
        handleZoomChange,
        handleSizeUnitChange,
    }
}
