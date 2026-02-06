import apiClient from '@/services/api'

export interface Webhook {
    id: number
    projectId: number
    slug: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateWebhookDTO {
    projectId: number
    name: string
    slug?: string // Опциональный slug, если не передан - генерируется автоматически
    isActive?: boolean
}

export interface UpdateWebhookDTO {
    name?: string
    isActive?: boolean
}

export interface WebhookLog {
    id: number
    webhookId: number
    requestBody: Record<string, any> | null
    requestHeaders: Record<string, any> | null
    responseStatus: number | null
    responseBody: Record<string, any> | null
    errorMessage: string | null
    ipAddress: string | null
    createdAt: string
}

/**
 * Получить список webhooks проекта
 */
export const fetchWebhooks = (projectId: number): Promise<Webhook[]> => {
    return apiClient.get<Webhook[]>(`/projects/${projectId}/webhooks`).then((res) => res.data)
}

/**
 * Получить webhook по slug
 */
export const fetchWebhookBySlug = (slug: string): Promise<Webhook> => {
    return apiClient.get<Webhook>(`/webhooks/${slug}`).then((res) => res.data)
}

/**
 * Создать webhook
 */
export const fetchCreateWebhook = (data: CreateWebhookDTO): Promise<Webhook> => {
    return apiClient.post<Webhook>('/webhooks', data).then((res) => res.data)
}

/**
 * Обновить webhook
 */
export const fetchUpdateWebhook = (slug: string, data: UpdateWebhookDTO): Promise<Webhook> => {
    return apiClient.put<Webhook>(`/webhooks/${slug}`, data).then((res) => res.data)
}

/**
 * Удалить webhook
 */
export const fetchDeleteWebhook = (slug: string): Promise<void> => {
    return apiClient.delete(`/webhooks/${slug}`).then(() => {})
}

/**
 * Получить логи webhook
 */
export const fetchWebhookLogs = (slug: string, limit?: number): Promise<WebhookLog[]> => {
    return apiClient
        .get<WebhookLog[]>(`/webhooks/${slug}/logs`, { params: { limit } })
        .then((res) => res.data)
}
