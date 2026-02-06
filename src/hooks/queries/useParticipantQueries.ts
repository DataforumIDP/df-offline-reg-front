import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
    fetchParticipants,
    fetchParticipantById,
    fetchParticipantLogs,
    fetchParticipantLogsStats,
    type ParticipantsQuery,
} from '@/services/api/participants'

/**
 * Запрос списка участников проекта
 * placeholderData: keepPreviousData - показывать старые данные пока загружаются новые
 */
export const useParticipantsQuery = (projectId: number, params?: ParticipantsQuery) => {
    return useQuery({
        queryKey: ['participants', projectId, params],
        queryFn: () => fetchParticipants(projectId, params),
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // 2 минуты
        placeholderData: keepPreviousData, // Показывать предыдущие данные во время загрузки
    })
}

/**
 * Запрос одного участника
 */
export const useParticipantQuery = (
    projectId: number | undefined,
    participantId: number | undefined,
) => {
    return useQuery({
        queryKey: ['participant', projectId, participantId],
        queryFn: () => fetchParticipantById(projectId!, participantId!),
        enabled: !!projectId && !!participantId,
        staleTime: 2 * 60 * 1000, // 2 минуты
    })
}

/**
 * Запрос логов участника
 */
export const useParticipantLogsQuery = (
    projectId: number | undefined,
    participantId: number | undefined,
) => {
    return useQuery({
        queryKey: ['participant-logs', projectId, participantId],
        queryFn: () => fetchParticipantLogs(projectId!, participantId!),
        enabled: !!projectId && !!participantId,
    })
}

/**
 * Запрос статистики логов
 */
export const useParticipantLogsStatsQuery = (projectId: number | undefined) => {
    return useQuery({
        queryKey: ['participant-logs-stats', projectId],
        queryFn: () => fetchParticipantLogsStats(projectId!),
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000, // 10 минут
    })
}
