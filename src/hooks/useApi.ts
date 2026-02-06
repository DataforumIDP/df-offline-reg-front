// Пример пользовательского хука для работы с React Query

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import apiService from '@services/api'

interface UseApiQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {}

interface UseApiMutationOptions<T, E> extends Omit<UseMutationOptions<T, E>, 'mutationFn'> {}

export const useApiQuery = <T>(key: string[], url: string, options?: UseApiQueryOptions<T>) => {
    return useQuery<T>({
        queryKey: key,
        queryFn: async () => {
            const response = await apiService.get<T>(url)
            return response.data
        },
        ...options,
    })
}

export const useApiMutation = <T, E = unknown>(
    mutationFn: (data: unknown) => Promise<T>,
    options?: UseApiMutationOptions<T, E>,
) => {
    return useMutation<T, E>({
        mutationFn,
        ...options,
    })
}
