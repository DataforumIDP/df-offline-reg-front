import apiClient from '@/services/api'
import type { LoginRequest, LoginResponse, RegisterOperatorRequest } from '@/types/auth'

// Хелпер для маппинга account -> user
const mapAccountToUser = (data: any): LoginResponse => {
    const { account, ...rest } = data
    return { ...rest, user: account }
}

/**
 * Авторизация администратора
 */
export const fetchLoginAdmin = (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient
        .post('/accounts/auth/admin', credentials)
        .then((res) => mapAccountToUser(res.data))
}

/**
 * Авторизация оператора
 */
export const fetchLoginOperator = (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient
        .post('/accounts/auth/operator', credentials)
        .then((res) => mapAccountToUser(res.data))
}

/**
 * Регистрация оператора (вход по коду мероприятия и ФИО)
 */
export const fetchRegisterOperator = (data: RegisterOperatorRequest): Promise<LoginResponse> => {
    return apiClient
        .post('/accounts/reg', data)
        .then((res) => mapAccountToUser(res.data))
}

/**
 * Обновление токена
 */
export const fetchRefreshToken = (refreshToken: string): Promise<LoginResponse> => {
    return apiClient
        .post('/accounts/auth/refresh', { refreshToken })
        .then((res) => mapAccountToUser(res.data))
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
