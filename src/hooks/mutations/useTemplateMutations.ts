import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchCreatePrintTemplate,
    fetchUpdatePrintTemplate,
    fetchDeletePrintTemplate,
    fetchAssignPrintTemplateToProject,
    fetchDeleteProjectPrintTemplate,
} from '@/services/api/templates'

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    return 'Произошла ошибка. Попробуйте позже'
}

/**
 * Мутация для создания шаблона печати
 */
export const useCreatePrintTemplateMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: any) => fetchCreatePrintTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['print-templates'],
            })
        },
        onError: (error) => {
            const message = getErrorMessage(error)
            throw new Error(message)
        },
    })
}

/**
 * Мутация для обновления шаблона печати
 */
export const useUpdatePrintTemplateMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => fetchUpdatePrintTemplate(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['print-templates'],
            })
            queryClient.invalidateQueries({
                queryKey: ['print-template', data.id],
            })
            queryClient.invalidateQueries({
                queryKey: ['project-print-template'],
            })
        },
        onError: (error) => {
            const message = getErrorMessage(error)
            throw new Error(message)
        },
    })
}

/**
 * Мутация для удаления шаблона печати
 */
export const useDeletePrintTemplateMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => fetchDeletePrintTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['print-templates'],
            })
        },
        onError: (error) => {
            const message = getErrorMessage(error)
            throw new Error(message)
        },
    })
}

/**
 * Мутация для назначения шаблона проекту
 */
export const useAssignPrintTemplateMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ projectId, templateId }: { projectId: number; templateId: number }) =>
            fetchAssignPrintTemplateToProject(projectId, templateId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['project-print-template', variables.projectId],
            })
            queryClient.invalidateQueries({
                queryKey: ['print-templates'],
            })
        },
        onError: (error) => {
            const message = getErrorMessage(error)
            throw new Error(message)
        },
    })
}

/**
 * Мутация для удаления шаблона у проекта
 */
export const useDeleteProjectPrintTemplateMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (projectId: number) => fetchDeleteProjectPrintTemplate(projectId),
        onSuccess: (_, projectId) => {
            queryClient.invalidateQueries({
                queryKey: ['project-print-template', projectId],
            })
        },
        onError: (error) => {
            const message = getErrorMessage(error)
            throw new Error(message)
        },
    })
}
