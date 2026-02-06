import { useQuery } from '@tanstack/react-query'
import {
    fetchPrintTemplateById,
    fetchPrintTemplates,
    fetchProjectPrintTemplate,
} from '@/services/api/templates'

/**
 * Запрос шаблона печати по ID
 */
export const usePrintTemplate = (templateId: number | undefined) => {
    return useQuery({
        queryKey: ['print-template', templateId],
        queryFn: () => fetchPrintTemplateById(templateId!),
        enabled: !!templateId,
        staleTime: 10 * 60 * 1000, // 10 минут
    })
}

/**
 * Запрос всех шаблонов печати
 */
export const usePrintTemplates = (search?: string) => {
    return useQuery({
        queryKey: ['print-templates', search ?? ''],
        queryFn: () => fetchPrintTemplates(search),
        staleTime: 10 * 60 * 1000, // 10 минут
    })
}

/**
 * Запрос шаблона печати проекта
 */
export const useProjectPrintTemplate = (templateId: number | undefined) => {
    return useQuery({
        queryKey: ['print-template', templateId],
        queryFn: () => fetchProjectPrintTemplate(templateId!),
        enabled: !!templateId,
        staleTime: 60 * 60 * 1000, // 1 час
    })
}
