// Экспорты хуков из папки hooks для удобного импорта

export { useAppDispatch, useAppSelector } from '@store/hooks'
export { useApiQuery, useApiMutation } from './useApi'
export { useDebounce } from './useDebounce'

// Auth mutations
export { useLoginAdminMutation, useLoginOperatorMutation, useLogoutMutation } from './mutations/useAuthMutations'

// Project queries и mutations
export { useProjectsQuery, useProjectQuery } from './queries/useProjectQueries'
export { useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from './mutations/useProjectMutations'

// Participant queries и mutations
export { useParticipantsQuery, useParticipantQuery, useParticipantLogsQuery, useParticipantLogsStatsQuery } from './queries/useParticipantQueries'
export { useCreateParticipantMutation, useUpdateParticipantMutation, useDeleteParticipantMutation, usePrintParticipantMutation } from './mutations/useParticipantMutations'

// Template mutations
export { useCreatePrintTemplateMutation, useUpdatePrintTemplateMutation, useDeletePrintTemplateMutation, useAssignPrintTemplateMutation, useDeleteProjectPrintTemplateMutation } from './mutations/useTemplateMutations'
