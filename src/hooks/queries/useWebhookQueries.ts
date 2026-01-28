import { useQuery } from '@tanstack/react-query'
import { fetchWebhooks, fetchWebhookBySlug, fetchWebhookLogs } from '@/services/api/webhooks'

/**
 * Запрос списка webhooks проекта
 */
export const useWebhooksQuery = (projectId: number) => {
  return useQuery({
    queryKey: ['webhooks', projectId],
    queryFn: () => fetchWebhooks(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 минуты
  })
}

/**
 * Запрос одного webhook по slug
 */
export const useWebhookQuery = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['webhook', slug],
    queryFn: () => fetchWebhookBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 минуты
  })
}

/**
 * Запрос логов webhook
 */
export const useWebhookLogsQuery = (slug: string | undefined, limit?: number) => {
  return useQuery({
    queryKey: ['webhook-logs', slug, limit],
    queryFn: () => fetchWebhookLogs(slug!, limit),
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 секунд
  })
}
