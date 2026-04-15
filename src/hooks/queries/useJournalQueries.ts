import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchJournalRecords,
    fetchJournalStats,
    returnJournalRecord,
    JournalQueryParams,
} from '@/services/api/journal'

/**
 * Ключи запросов журнала
 */
export const journalKeys = {
    all: ['journal'] as const,
    records: (projectId: number, params?: JournalQueryParams) =>
        [...journalKeys.all, 'records', projectId, params] as const,
    stats: (projectId: number) => [...journalKeys.all, 'stats', projectId] as const,
}

/**
 * Запрос записей журнала
 */
export const useJournalRecordsQuery = (
    projectId: number | undefined,
    params: JournalQueryParams = {},
    enabled = true
) => {
    return useQuery({
        queryKey: journalKeys.records(projectId!, params),
        queryFn: () => fetchJournalRecords(projectId!, params),
        enabled: !!projectId && enabled,
        staleTime: 30 * 1000, // 30 секунд
    })
}

/**
 * Запрос статистики журнала
 */
export const useJournalStatsQuery = (projectId: number | undefined, enabled = true) => {
    return useQuery({
        queryKey: journalKeys.stats(projectId!),
        queryFn: () => fetchJournalStats(projectId!),
        enabled: !!projectId && enabled,
        staleTime: 30 * 1000, // 30 секунд
    })
}

/**
 * Мутация ручного возврата устройства
 */
export const useReturnJournalRecordMutation = (projectId: number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (recordId: number) => returnJournalRecord(projectId, recordId),
        onSuccess: () => {
            // Инвалидируем записи и статистику журнала
            queryClient.invalidateQueries({ queryKey: journalKeys.records(projectId) })
            queryClient.invalidateQueries({ queryKey: journalKeys.stats(projectId) })
        },
    })
}
