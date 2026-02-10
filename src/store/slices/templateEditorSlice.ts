import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Типы для текстового поля
export type TextAlign = 'left' | 'center' | 'right'
export type FontWeight = 'normal' | 'bold'
export type FontStyle = 'normal' | 'italic'

export interface TextFieldElement {
    id: string
    type: 'text'
    // Ресурс - ключ поля из схемы проекта (откуда брать данные)
    fieldKey: string | undefined
    // Позиция (в мм)
    x: number
    y: number
    // Размеры (в мм)
    width: number
    // Полная ширина - растягивает по всей ширине холста
    fullWidth: boolean
    // Шрифт
    fontFamily: string
    fontSize: number // в pt
    fontWeight: FontWeight
    fontStyle: FontStyle
    // Выравнивание текста
    textAlign: TextAlign
    // Адаптивный размер - уменьшать шрифт если текст не помещается
    adaptive: boolean
    // Многострочный режим - ограничить количество строк с троеточием
    multiline?: boolean
    // Максимальное количество строк (1-10), используется при multiline: true
    maxLines?: number
}

export type ResourceType = 'field' | 'fixed'

export interface QrElement {
    id: string
    type: 'qr'
    // resource handling
    resourceType: ResourceType
    fieldKey?: string
    fixedValue?: string
    prefix?: string
    // position
    x: number
    y: number
    // width used as size in mm
    width: number
    // center flag: when true, element is centered on X and can be moved only on Y
    center: boolean
    // colors and styles
    fgColor: string
    bgColor: string
    moduleStyle: string
    eyeStyle: string
    eyeBorderStyle: string
    ecLevel: string // уровень коррекции (L, M, Q, H)
    /** URL логотипа для центра QR (опционально) */
    logoUrl?: string
}

// Объединённый тип для всех элементов (в будущем добавим QR и др.)
export type TemplateElement = TextFieldElement | QrElement

// Настройки холста
export interface CanvasSettings {
    widthMm: number
    heightMm: number
    zoom: number // в процентах, 10-300
    sizeUnit: 'mm' | 'px'
}

// Состояние редактора
export interface TemplateEditorState {
    // Настройки холста
    canvas: CanvasSettings
    // Элементы на холсте
    elements: TemplateElement[]
    // ID выбранного элемента
    selectedElementId: string | null
    // Флаг изменений (для предупреждения о несохранённых изменениях)
    isDirty: boolean
    // ID облачного шаблона (если назначен)
    templateId?: number
    // Название шаблона (если назначен)
    templateName?: string
}

const initialState: TemplateEditorState = {
    canvas: {
        widthMm: 70, // Стандартный бейдж 70х50 мм
        heightMm: 50,
        zoom: 150,
        sizeUnit: 'mm',
    },
    elements: [],
    selectedElementId: null,
    isDirty: false,
    templateId: undefined,
    templateName: undefined,
    // --- Cloud template integration ---
}

// Генератор уникального ID
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Значения по умолчанию для нового текстового поля
const defaultTextFieldProps: Omit<TextFieldElement, 'id'> = {
    type: 'text',
    fieldKey: undefined,
    x: 10,
    y: 10,
    width: 40,
    fullWidth: true,
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    adaptive: false,
    multiline: false,
    maxLines: 1,
}

const defaultQrProps: Omit<QrElement, 'id'> = {
    type: 'qr',
    resourceType: 'field',
    fieldKey: undefined,
    fixedValue: undefined,
    prefix: undefined,
    x: 35,
    y: 25,
    width: 20,
    center: true,
    fgColor: '#000000',
    bgColor: '#ffffff',
    moduleStyle: 'squares',
    eyeStyle: 'squares',
    eyeBorderStyle: 'squares',
    ecLevel: 'M',
}

const templateEditorSlice = createSlice({
    name: 'templateEditor',
    initialState,
    reducers: {
        // === Управление холстом ===
        setCanvasWidth: (state, action: PayloadAction<number>) => {
            state.canvas.widthMm = action.payload
            state.isDirty = true
        },
        setCanvasHeight: (state, action: PayloadAction<number>) => {
            state.canvas.heightMm = action.payload
            state.isDirty = true
        },
        setCanvasSize: (state, action: PayloadAction<{ widthMm: number; heightMm: number }>) => {
            state.canvas.widthMm = action.payload.widthMm
            state.canvas.heightMm = action.payload.heightMm
            state.isDirty = true
        },
        setZoom: (state, action: PayloadAction<number>) => {
            state.canvas.zoom = action.payload
        },
        setSizeUnit: (state, action: PayloadAction<'mm' | 'px'>) => {
            state.canvas.sizeUnit = action.payload
        },

        // === Управление элементами ===
        addTextField: (state, action: PayloadAction<Partial<TextFieldElement> | undefined>) => {
            const newField: TextFieldElement = {
                ...defaultTextFieldProps,
                ...action.payload,
                id: generateId(),
                type: 'text',
            }
            state.elements.push(newField)
            state.selectedElementId = newField.id
            state.isDirty = true
        },
        addQrField: (state, action: PayloadAction<Partial<QrElement> | undefined>) => {
            const newField: QrElement = {
                ...defaultQrProps,
                ...action.payload,
                id: generateId(),
            }
            state.elements.push(newField)
            state.selectedElementId = newField.id
            state.isDirty = true
        },

        updateElement: (
            state,
            action: PayloadAction<{ id: string; updates: Partial<TemplateElement> }>,
        ) => {
            const { id, updates } = action.payload
            const index = state.elements.findIndex((el) => el.id === id)
            if (index === -1) {
                return
            }

            const existing = state.elements[index]
            if (existing.type === 'text') {
                state.elements[index] = {
                    ...existing,
                    ...(updates as Partial<TextFieldElement>),
                } as TextFieldElement
            } else if (existing.type === 'qr') {
                state.elements[index] = {
                    ...existing,
                    ...(updates as Partial<QrElement>),
                } as QrElement
            }
            state.isDirty = true
        },

        removeElement: (state, action: PayloadAction<string>) => {
            const id = action.payload
            state.elements = state.elements.filter((el) => el.id !== id)
            if (state.selectedElementId === id) {
                state.selectedElementId = null
            }
            state.isDirty = true
        },

        selectElement: (state, action: PayloadAction<string | null>) => {
            state.selectedElementId = action.payload
        },

        // Перемещение элемента
        moveElement: (state, action: PayloadAction<{ id: string; x: number; y: number }>) => {
            const { id, x, y } = action.payload
            const element = state.elements.find((el) => el.id === id)
            if (element) {
                // Для текстового поля с fullWidth меняем только Y
                if (element.type === 'text') {
                    if (element.fullWidth) {
                        element.y = y
                    } else {
                        element.x = x
                        element.y = y
                    }
                } else if (element.type === 'qr') {
                    // Если центрирован, только Y можно менять
                    if (element.center) {
                        element.y = y
                    } else {
                        element.x = x
                        element.y = y
                    }
                }
                state.isDirty = true
            }
        },

        // Изменение размера элемента
        resizeElement: (state, action: PayloadAction<{ id: string; width: number }>) => {
            const { id, width } = action.payload
            const element = state.elements.find((el) => el.id === id)
            if (!element) {
                return
            }
            if (element.type === 'text' && !element.fullWidth) {
                element.width = width
                state.isDirty = true
            }
            if (element.type === 'qr') {
                // resize controls size (width) for QR
                element.width = width
                state.isDirty = true
            }
        },

        // === Массовые операции ===
        loadTemplate: (
            state,
            action: PayloadAction<{ canvas: CanvasSettings; elements: TemplateElement[] }>,
        ) => {
            state.canvas = action.payload.canvas
            state.elements = action.payload.elements
            state.selectedElementId = null
            state.isDirty = false
        },

        resetEditor: (state) => {
            state.canvas = initialState.canvas
            state.elements = []
            state.selectedElementId = null
            state.isDirty = false
        },

        markAsSaved: (state) => {
            state.isDirty = false
        },
        setElements: (state, action: PayloadAction<TemplateElement[]>) => {
            state.elements = action.payload
            state.isDirty = true
        },
        setTemplateId: (state, action: PayloadAction<number | undefined>) => {
            state.templateId = action.payload
        },
        setTemplateName: (state, action: PayloadAction<string | undefined>) => {
            state.templateName = action.payload
        },
    },
})

export const {
    setCanvasWidth,
    setCanvasHeight,
    setCanvasSize,
    setZoom,
    setSizeUnit,
    addTextField,
    addQrField,
    updateElement,
    removeElement,
    selectElement,
    moveElement,
    resizeElement,
    loadTemplate,
    resetEditor,
    markAsSaved,
    setElements,
    setTemplateId,
    setTemplateName,
} = templateEditorSlice.actions

export default templateEditorSlice.reducer
