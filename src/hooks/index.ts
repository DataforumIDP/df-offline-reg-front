// Экспорты хуков из папки hooks для удобного импорта

export { useAppDispatch, useAppSelector } from '@store/hooks'
export { useApiQuery, useApiMutation } from './useApi'
export { useDebounce } from './useDebounce'

// Participants page hooks
export { useParticipantsState } from './useParticipantsState'
export type { SearchHistoryEntry, FiltersState } from './useParticipantsState'
export { useParticipantsHotkeys } from './useParticipantsHotkeys'
export { useMassPrint } from './useMassPrint'

// Auth mutations
export {
    useLoginAdminMutation,
    useLoginOperatorMutation,
    useRegisterOperatorMutation,
    useLogoutMutation,
} from './mutations/useAuthMutations'

// Project queries и mutations
export { useProjectsQuery, useProjectQuery } from './queries/useProjectQueries'
export {
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation,
} from './mutations/useProjectMutations'

// Participant queries и mutations
export {
    useParticipantsQuery,
    useParticipantQuery,
    useParticipantLogsQuery,
    useParticipantLogsStatsQuery,
} from './queries/useParticipantQueries'
export {
    useCreateParticipantMutation,
    useUpdateParticipantMutation,
    useDeleteParticipantMutation,
    usePrintParticipantMutation,
} from './mutations/useParticipantMutations'

// Template mutations
export {
    useCreatePrintTemplateMutation,
    useUpdatePrintTemplateMutation,
    useDeletePrintTemplateMutation,
    useAssignPrintTemplateMutation,
    useDeleteProjectPrintTemplateMutation,
} from './mutations/useTemplateMutations'
