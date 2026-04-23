import axios from 'axios'
import { getActiveServerUrl } from './serverStorage'
import { dispatchNavigation } from '@/utils/navigation'
import { getDeviceId } from '@/utils/deviceId'

const API_BASE_URL = getActiveServerUrl()

// Создаем инстанс axios
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Интерсептор для добавления токена авторизации
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        config.headers['X-Device-Id'] = getDeviceId()
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Интерсептор для обработки ответов и обновления токена
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const errorCode = error.response?.data?.code
        const errorMessage = String(error.response?.data?.error || '')
        const isSessionTerminatedError =
            errorCode === 'SESSION_TERMINATED' ||
            errorMessage.toLowerCase().includes('сессия завершена')

        // Игнорируем 401 для auth-эндпоинтов (логин, регистрация)
        // Они должны обрабатываться в мутациях, а не в интерсепторе
        const isAuthEndpoint = originalRequest?.url?.includes('/accounts/auth/') ||
                               originalRequest?.url?.includes('/accounts/reg')

        if (isAuthEndpoint) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && isSessionTerminatedError) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            dispatchNavigation('/admin', true)
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = localStorage.getItem('refreshToken')

            // Если нет refresh токена - сразу редирект
            if (!refreshToken) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                dispatchNavigation('/admin', true)
                return Promise.reject(error)
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/accounts/auth/refresh`, {
                    refreshToken,
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data
                localStorage.setItem('accessToken', accessToken)
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken)
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return apiClient(originalRequest)
            } catch (refreshError) {
                // Если обновление токена не удалось, перенаправляем на логин
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                dispatchNavigation('/admin', true)
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

export default apiClient
