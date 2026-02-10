import { useQuery } from '@tanstack/react-query'
import {
    fetchPrintTemplateById,
    fetchPrintTemplates,
    fetchProjectPrintTemplate,
} from '@/services/api/templates'

// Время жизни кеша - 1 день
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Запрос шаблона печати по ID
 */
export const usePrintTemplate = (templateId: number | undefined) => {
    return useQuery({
        queryKey: ['print-template', templateId],
        queryFn: () => fetchPrintTemplateById(templateId!),
        enabled: !!templateId,
        staleTime: ONE_DAY_MS,
    })
}

/**
 * Запрос всех шаблонов печати
 */
export const usePrintTemplates = (search?: string) => {
    return useQuery({
        queryKey: ['print-templates', search ?? ''],
        queryFn: () => fetchPrintTemplates(search),
        staleTime: ONE_DAY_MS,
    })
}

/**
 * Запрос шаблона печати проекта
 */
export const useProjectPrintTemplate = (projectId: number | undefined) => {
    return useQuery({
        queryKey: ['project-print-template', projectId],
        queryFn: () => fetchProjectPrintTemplate(projectId!),
        enabled: !!projectId,
        staleTime: ONE_DAY_MS,
    })
}
