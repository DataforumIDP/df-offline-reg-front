import axios from 'axios'
import { getActiveServerUrl } from './serverStorage'

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

        if (error.response?.status === 401 && isSessionTerminatedError) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/admin'
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = localStorage.getItem('refreshToken')

            // Если нет refresh токена - сразу редирект
            if (!refreshToken) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/admin'
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
                window.location.href = '/admin'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

export default apiClient
