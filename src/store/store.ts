import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import templateEditorReducer from './slices/templateEditorSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        templateEditor: templateEditorReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
