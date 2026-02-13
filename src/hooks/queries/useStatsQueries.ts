import { useQuery } from '@tanstack/react-query'
import { fetchStatsLogs, fetchLogs, fetchOperatorStats, type LogsQuery, type StatsQuery } from '@/services/api/statsService'

/**
 * Запрос статистики по типам действий
 */
export const useStatsLogsQuery = (projectId: number | undefined, params?: StatsQuery) => {
    return useQuery({
        queryKey: ['stats-logs', projectId, params],
        queryFn: () => fetchStatsLogs(projectId!, params),
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000, // 10 минут
    })
}

/**
 * Запрос детальных логов проекта
 */
export const useLogsQuery = (projectId: number | undefined, params?: LogsQuery) => {
    return useQuery({
        queryKey: ['logs', projectId, params],
        queryFn: () => fetchLogs(projectId!, params),
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // 2 минуты
    })
}

/**
 * Запрос статистики оператора
 */
export const useOperatorStatsQuery = (
    projectId: number | undefined,
    userId: number | undefined,
    params?: StatsQuery
) => {
    return useQuery({
        queryKey: ['operator-stats', projectId, userId, params],
        queryFn: () => fetchOperatorStats(projectId!, userId!, params),
        enabled: !!projectId && !!userId,
        staleTime: 2 * 60 * 1000, // 2 минуты
    })
}
