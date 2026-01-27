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
}

// Объединённый тип для всех элементов (в будущем добавим QR и др.)
export type TemplateElement = TextFieldElement

// Настройки холста
export interface CanvasSettings {
  widthMm: number
  heightMm: number
  zoom: number // в процентах, 50-150
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
}

const initialState: TemplateEditorState = {
  canvas: {
    widthMm: 90, // Стандартный бейдж 90x55 мм
    heightMm: 55,
    zoom: 100,
    sizeUnit: 'mm',
  },
  elements: [],
  selectedElementId: null,
  isDirty: false,
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
  fullWidth: false,
  fontFamily: 'Arial',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  adaptive: false,
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

    updateElement: (state, action: PayloadAction<{ id: string; updates: Partial<TemplateElement> }>) => {
      const { id, updates } = action.payload
      const index = state.elements.findIndex(el => el.id === id)
      if (index !== -1) {
        state.elements[index] = { ...state.elements[index], ...updates }
        state.isDirty = true
      }
    },

    removeElement: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.elements = state.elements.filter(el => el.id !== id)
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
      const element = state.elements.find(el => el.id === id)
      if (element) {
        // Если fullWidth, меняем только Y
        if (element.type === 'text' && element.fullWidth) {
          element.y = y
        } else {
          element.x = x
          element.y = y
        }
        state.isDirty = true
      }
    },

    // Изменение размера элемента
    resizeElement: (state, action: PayloadAction<{ id: string; width: number }>) => {
      const { id, width } = action.payload
      const element = state.elements.find(el => el.id === id)
      if (element && element.type === 'text' && !element.fullWidth) {
        element.width = width
        state.isDirty = true
      }
    },

    // === Массовые операции ===
    loadTemplate: (state, action: PayloadAction<{ canvas: CanvasSettings; elements: TemplateElement[] }>) => {
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
  },
})

export const {
  setCanvasWidth,
  setCanvasHeight,
  setCanvasSize,
  setZoom,
  setSizeUnit,
  addTextField,
  updateElement,
  removeElement,
  selectElement,
  moveElement,
  resizeElement,
  loadTemplate,
  resetEditor,
  markAsSaved,
} = templateEditorSlice.actions

export default templateEditorSlice.reducer
