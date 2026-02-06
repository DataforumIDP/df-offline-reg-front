import apiClient from '@/services/api'
import type { LoginRequest, LoginResponse } from '@/types/auth'

/**
 * Авторизация администратора
 */
export const fetchLoginAdmin = (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient
        .post<LoginResponse>('/accounts/auth/admin', credentials)
        .then((res) => res.data)
}

/**
 * Авторизация оператора
 */
export const fetchLoginOperator = (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient
        .post<LoginResponse>('/accounts/auth/operator', credentials)
        .then((res) => res.data)
}

/**
 * Обновление токена
 */
export const fetchRefreshToken = (refreshToken: string): Promise<LoginResponse> => {
    return apiClient
        .post<LoginResponse>('/accounts/auth/refresh', { refreshToken })
        .then((res) => res.data)
}

/**
 * Получить информацию о текущем пользователе
 */
export const fetchCurrentUser = (): Promise<any> => {
    return apiClient.get('/accounts/self').then((res) => res.data)
}

/**
 * Выход из системы
 */
export const fetchLogout = (): Promise<void> => {
    return apiClient.post('/accounts/logout').then(() => {})
}
