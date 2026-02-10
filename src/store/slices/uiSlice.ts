import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
    sidebarCompact: boolean
    sidebarMobileOpen: boolean
}

const initialState: UIState = {
    sidebarCompact: false,
    sidebarMobileOpen: false,
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSidebarCompact: (state, action: PayloadAction<boolean>) => {
            state.sidebarCompact = action.payload
        },
        toggleSidebarCompact: (state) => {
            state.sidebarCompact = !state.sidebarCompact
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
