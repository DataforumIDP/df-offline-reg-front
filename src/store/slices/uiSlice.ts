import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
    sidebarCompact: boolean
    sidebarMobileOpen: boolean
}

// Загружаем состояние сайдбара из localStorage
const loadSidebarState = (): boolean => {
    try {
        const saved = localStorage.getItem('rega_sidebar_compact')
        return saved === 'true'
    } catch {
        return false
    }
}

const initialState: UIState = {
    sidebarCompact: loadSidebarState(),
    sidebarMobileOpen: false,
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSidebarCompact: (state, action: PayloadAction<boolean>) => {
            state.sidebarCompact = action.payload
            // Сохраняем в localStorage
            try {
                localStorage.setItem('rega_sidebar_compact', String(action.payload))
            } catch {
                // ignore
            }
        },
        toggleSidebarCompact: (state) => {
            state.sidebarCompact = !state.sidebarCompact
            // Сохраняем в localStorage
            try {
                localStorage.setItem('rega_sidebar_compact', String(state.sidebarCompact))
            } catch {
                // ignore
            }
        },
        setSidebarMobileOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarMobileOpen = action.payload
        },
        toggleSidebarMobileOpen: (state) => {
            state.sidebarMobileOpen = !state.sidebarMobileOpen
        },
    },
})

export const {
    setSidebarCompact,
    toggleSidebarCompact,
    setSidebarMobileOpen,
    toggleSidebarMobileOpen,
} = uiSlice.actions

export default uiSlice.reducer
