import apiClient from '@/services/api'

export interface LogRecord {
    id: number
    projectId: number
    participantId: number | null
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT'
    actor: 'USER' | 'WEBHOOK' | 'AUTO'
    userId: number | null
    user?: {
        id: number
        login: string
        name: string | null
    }
    participant?: {
        id: number
        data: Record<string, unknown>
    }
    createdAt: string
}

export interface LogResponse {
    records: LogRecord[]
    totalRecords: number
    recordsPerPage: number
    page: number
}

export interface StatsResponse {
    CREATE: number
    UPDATE: number
    DELETE: number
    PRINT: number
    uniqPrints: number
}

export interface LogsQuery {
    page?: number
    limit?: number
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT'
    actor?: 'USER' | 'WEBHOOK' | 'AUTO'
    search?: string
    participantId?: number
    userId?: number
    dateStart?: string
    dateEnd?: string
}

export interface StatsQuery {
    dateStart?: string
    dateEnd?: string
}

/**
 * Получить статистику по типам действий
 */
export const fetchStatsLogs = (projectId: number, params?: StatsQuery): Promise<StatsResponse> => {
    return apiClient.get(`/projects/${projectId}/participants/log/stats`, { params }).then((res) => res.data)
}

/**
 * Получить детальные логи по проекту
 */
export const fetchLogs = (projectId: number, params?: LogsQuery): Promise<LogResponse> => {
    return apiClient
        .get(`/projects/${projectId}/participants/log`, { params })
        .then((res) => res.data)
}

// Типы для статистики оператора
export interface OperatorParticipantStats {
    participantId: number
    currentData: Record<string, unknown>
    created: boolean
    updated: boolean
    printCount: number
}

export interface OperatorStatsResponse {
    participants: OperatorParticipantStats[]
    totalParticipants: number
}

/**
 * Получить статистику оператора по участникам
 */
export const fetchOperatorStats = (
    projectId: number,
    userId: number,
    params?: StatsQuery
): Promise<OperatorStatsResponse> => {
    return apiClient
        .get(`/projects/${projectId}/operator/${userId}`, { params })
        .then((res) => res.data)
}
