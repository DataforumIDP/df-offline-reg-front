import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, AuthUser } from '@/types/auth'

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true, // true пока проверяем токен
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<AuthUser>) => {
            state.user = action.payload
            state.isAuthenticated = true
            state.isLoading = false
        },
        clearUser: (state) => {
            state.user = null
            state.isAuthenticated = false
            state.isLoading = false
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
    },
})

export const { setUser, clearUser, setLoading } = authSlice.actions
export default authSlice.reducer
