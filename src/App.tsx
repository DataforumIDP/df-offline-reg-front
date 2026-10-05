import { useCallback, useEffect, useState } from 'react'
import { SnackbarProvider } from 'notistack'
import { useQueryClient } from '@tanstack/react-query'
import AppRouter from '@/router/AppRouter'
import { useAppDispatch } from '@/hooks'
import { setUser, setLoading } from '@/store/slices/authSlice'
import { resetApplicationState } from '@/store/store'
import apiClient from '@/services/api'
import { clearFontCache } from '@/services/printService'
import { useCloudFontsQuery } from '@/hooks/queries/useCloudFontsQueries'
import type { AuthUser } from '@/types/auth'
import { PingLayout } from '@/components/layouts'

function App() {
    const dispatch = useAppDispatch()
    const queryClient = useQueryClient()
    useCloudFontsQuery()
    const [resetGeneration, setResetGeneration] = useState(0)

    const resetApplicationCaches = useCallback(() => {
        queryClient.clear()
        clearFontCache()
        dispatch(resetApplicationState())
        setResetGeneration((generation) => generation + 1)

        const cacheTasks: Promise<unknown>[] = []

        if ('caches' in window) {
            cacheTasks.push(
                window.caches.keys().then((cacheNames) =>
                    Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName))),
                ),
            )
        }

        if (window.electronAPI?.clearAppCaches) {
            cacheTasks.push(window.electronAPI.clearAppCaches())
        }

        void Promise.all(cacheTasks).catch((error) => {
            console.error('Failed to clear application caches:', error)
        })
    }, [dispatch, queryClient])

    useEffect(() => {
        const handleCacheResetHotkey = (event: KeyboardEvent) => {
            if (!event.ctrlKey || !event.shiftKey || event.code !== 'KeyR') {
                return
            }

            event.preventDefault()
            event.stopPropagation()
            resetApplicationCaches()
        }

        window.addEventListener('keydown', handleCacheResetHotkey)
        return () => window.removeEventListener('keydown', handleCacheResetHotkey)
    }, [resetApplicationCaches])

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
            key={resetGeneration}
            maxSnack={3}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <PingLayout>
                <AppRouter />
            </PingLayout>
        </SnackbarProvider>
    )
}

export default App
