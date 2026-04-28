import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/services/api'
import type { SchemeField } from '../queries/useSchemeQueries'

interface CreateSchemeFieldPayload {
    label: string
    key: string
    config: {
        type: 'text' | 'list' | 'bool' | 'id' | 'img' | 'code'
        uniq: boolean
        maxLength?: number
        listSettings?: {
            multiple: boolean
            items: Array<{ value: string; color?: string; isHidden?: boolean }>
        }
    }
}

interface UpdateSchemeFieldPayload {
    label?: string
    key?: string
    scannerEditable?: boolean
    config: {
        type?: 'text' | 'list' | 'bool' | 'id' | 'img' | 'code'
        uniq?: boolean
        maxLength?: number
        isMark?: boolean
        isPhone?: boolean
        isHidden?: boolean
        listSettings?: {
            multiple: boolean
            items: Array<{ value: string; color?: string; isHidden?: boolean }>
        }
    }
}

export const useCreateSchemeMutation = (projectId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CreateSchemeFieldPayload) => {
            const response = await apiClient.post<SchemeField>(
                `/projects/${projectId}/scheme`,
                data,
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheme', projectId] })
        },
    })
}

export const useDeleteSchemeMutation = (projectId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (fieldId: number) => {
            await apiClient.delete(`/projects/${projectId}/scheme/${fieldId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheme', projectId] })
        },
    })
}

export const useUpdateSchemaMutation = (projectId: string, fieldId: number) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: UpdateSchemeFieldPayload) => {
            const response = await apiClient.put<SchemeField>(
                `/projects/${projectId}/scheme/${fieldId}`,
                data,
            )
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheme', projectId] })
        },
    })
}
