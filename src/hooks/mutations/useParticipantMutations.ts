import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCreateParticipant, fetchUpdateParticipant, fetchDeleteParticipant, fetchPrintParticipant, type ParticipantFieldValue } from '@/services/api/participants'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return 'Произошла ошибка. Попробуйте позже'
}

/**
 * Мутация для создания участника
 */
export const useCreateParticipantMutation = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ParticipantFieldValue) =>
      fetchCreateParticipant(projectId, data),
    onSuccess: () => {
      // Инвалидируем список участников
      queryClient.invalidateQueries({
        queryKey: ['participants', projectId],
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      throw new Error(message)
    },
  })
}

/**
 * Мутация для обновления участника
 */
export const useUpdateParticipantMutation = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ participantId, data }: { participantId: number; data: ParticipantFieldValue }) =>
      fetchUpdateParticipant(projectId, participantId, data),
    onSuccess: (data) => {
      // Инвалидируем список участников и отдельный участника
      queryClient.invalidateQueries({
        queryKey: ['participants', projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ['participant', projectId, data.id],
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      throw new Error(message)
    },
  })
}

/**
 * Мутация для удаления участника
 */
export const useDeleteParticipantMutation = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (participantId: number) =>
      fetchDeleteParticipant(projectId, participantId),
    onSuccess: () => {
      // Инвалидируем список участников и статистику
      queryClient.invalidateQueries({
        queryKey: ['participants', projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ['participant-logs-stats', projectId],
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      throw new Error(message)
    },
  })
}

/**
 * Мутация для печати участника
 */
export const usePrintParticipantMutation = (projectId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (participantId: number) =>
      fetchPrintParticipant(projectId, participantId),
    onSuccess: () => {
      // Инвалидируем статистику логов
      queryClient.invalidateQueries({
        queryKey: ['participant-logs-stats', projectId],
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      throw new Error(message)
    },
  })
}
