import apiClient from '@/services/api'

export interface Session {
    id: number
    deviceName: string
    ipAddress: string | null
    lastActivity: string
    isCurrent: boolean
    createdAt: string
}

/**
 * Получить список своих сессий
 */
export const fetchSessions = (): Promise<Session[]> => {
    return apiClient.get<{ sessions: Session[] }>('/sessions').then((res) => res.data.sessions)
}

/**
 * Завершить конкретную сессию
 */
export const terminateSession = (id: number): Promise<void> => {
    return apiClient.delete(`/sessions/${id}`).then(() => undefined)
}

/**
 * Завершить все сессии кроме текущей
 */
export const terminateAllOtherSessions = (): Promise<{ count: number }> => {
    return apiClient.delete<{ count: number }>('/sessions').then((res) => res.data)
}

/**
 * Подтвердить QR авторизацию
 */
export const confirmQrAuth = (code: string): Promise<void> => {
    return apiClient.post('/qr-auth/confirm', { code }).then(() => undefined)
}
