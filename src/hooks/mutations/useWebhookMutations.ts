import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchCreateWebhook,
    fetchUpdateWebhook,
    fetchDeleteWebhook,
    type CreateWebhookDTO,
    type UpdateWebhookDTO,
} from '@/services/api/webhooks'

/**
 * Мутация для создания webhook
 */
export const useCreateWebhookMutation = (projectId: number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Omit<CreateWebhookDTO, 'projectId'>) =>
            fetchCreateWebhook({ ...data, projectId }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['webhooks', projectId],
            })
        },
    })
}

/**
 * Мутация для обновления webhook
 */
export const useUpdateWebhookMutation = (projectId: number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: UpdateWebhookDTO }) =>
            fetchUpdateWebhook(slug, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['webhooks', projectId],
            })
            queryClient.invalidateQueries({
                queryKey: ['webhook', data.slug],
            })
        },
    })
}

/**
 * Мутация для удаления webhook
 */
export const useDeleteWebhookMutation = (projectId: number) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (slug: string) => fetchDeleteWebhook(slug),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['webhooks', projectId],
            })
        },
    })
}
