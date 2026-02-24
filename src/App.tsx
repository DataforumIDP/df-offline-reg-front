import { useEffect } from 'react'
import { SnackbarProvider } from 'notistack'
import AppRouter from '@/router/AppRouter'
import { useAppDispatch } from '@/hooks'
import { setUser, setLoading } from '@/store/slices/authSlice'
import apiClient from '@/services/api'
import type { AuthUser } from '@/types/auth'

function App() {
    const dispatch = useAppDispatch()

    // При загрузке приложения восстанавливаем сессию из токена
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('accessToken')

            if (!token) {
                // Нет токена - завершаем загрузку
                dispatch(setLoading(false))
                return
            }

            try {
                // Есть токен - получаем данные пользователя
                const response = await apiClient.get<AuthUser>('/accounts/self')
                dispatch(setUser(response.data))
            } catch (error) {
                // Токен невалидный - очищаем
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                dispatch(setLoading(false))
            }
        }

        checkAuthStatus()
    }, [dispatch])

    return (
        <SnackbarProvider
            maxSnack={3}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <AppRouter />
        </SnackbarProvider>
    )
}

export default App
