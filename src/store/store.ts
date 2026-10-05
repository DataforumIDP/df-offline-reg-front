import { combineReducers, configureStore, createAction } from '@reduxjs/toolkit'
import type { AnyAction } from 'redux'
import authReducer from './slices/authSlice'
import templateEditorReducer from './slices/templateEditorSlice'
import uiReducer from './slices/uiSlice'

export const resetApplicationState = createAction('application/reset')

const appReducer = combineReducers({
    auth: authReducer,
    templateEditor: templateEditorReducer,
    ui: uiReducer,
})

const rootReducer = (
    state: ReturnType<typeof appReducer> | undefined,
    action: AnyAction,
) => {
    if (resetApplicationState.match(action) && state) {
        return {
            auth: state.auth,
            templateEditor: templateEditorReducer(undefined, action),
            ui: uiReducer(undefined, action),
        }
    }

    return appReducer(state, action)
}

export const store = configureStore({ reducer: rootReducer })

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
