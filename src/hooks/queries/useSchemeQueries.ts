import { useQuery } from '@tanstack/react-query'
import apiClient from '@/services/api'

export interface SchemeField {
    id: number
    label: string
    key: string
    scannerEditable?: boolean // только для bool - можно менять в сканере
    config: {
        type: 'text' | 'list' | 'bool' | 'id' | 'img' | 'code'
        uniq: boolean
        optional: boolean // true = необязательное, false = обязательное
        maxLength?: number
        isMark?: boolean // только для bool — поле-отметка для режима выдачи сканера
        listSettings?: {
            multiple: boolean
            items: Array<{ value: string; color?: string }>
        }
    }
}

export interface SchemeResponse {
    fields: SchemeField[]
}

// Время жизни кеша - 1 день
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const useSchemeQuery = (projectId: string) => {
    return useQuery({
        queryKey: ['scheme', projectId],
        queryFn: async () => {
            const response = await apiClient.get<SchemeResponse>(`/projects/${projectId}/scheme`)
            return response.data
        },
        enabled: !!projectId,
        staleTime: ONE_DAY_MS,
    })
}
