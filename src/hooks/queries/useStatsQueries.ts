import { useQuery } from '@tanstack/react-query'
import { fetchStatsLogs, fetchLogs, type LogsQuery } from '@/services/statsService'

/**
 * Запрос статистики по типам действий
 */
export const useStatsLogsQuery = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['stats-logs', projectId],
    queryFn: () => fetchStatsLogs(projectId!),
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
