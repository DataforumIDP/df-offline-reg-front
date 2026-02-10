// Конвертация мм <-> px при 300 DPI (стандарт для печати)
export const MM_TO_PX_RATIO = 300 / 25.4 // ≈ 11.81 px на 1 мм

// DPI для отображения на экране
export const SCREEN_DPI = 96
export const SCREEN_PX_PER_MM = SCREEN_DPI / 25.4 // ≈ 3.78

// Дефолтные размеры холста (стандартный бейдж)
export const DEFAULT_CANVAS_WIDTH_MM = 70
export const DEFAULT_CANVAS_HEIGHT_MM = 50

// Настройки масштаба
export const ZOOM_MIN = 10
export const ZOOM_MAX = 300
export const ZOOM_STEP = 10
export const ZOOM_DEFAULT = 150

// Утилиты конвертации
export const mmToPx = (mm: number): number => Math.round(mm * MM_TO_PX_RATIO)
export const pxToMm = (px: number): number => Math.round((px / MM_TO_PX_RATIO) * 10) / 10
