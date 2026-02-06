import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    createZone,
    updateZone,
    deleteZone,
    createZoneRule,
    deleteZoneRule,
} from '@/services/api/zones'
import type { CreateZoneDTO, UpdateZoneDTO } from '@/services/api/zones'

/**
 * Мутация для создания зоны
 */
export const useCreateZoneMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CreateZoneDTO) => createZone(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['zones', variables.projectId],
            })
        },
    })
}

/**
 * Мутация для обновления зоны
 */
export const useUpdateZoneMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            zoneId,
            data,
        }: {
            zoneId: number
            data: UpdateZoneDTO
            projectId: number
        }) => updateZone(zoneId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['zones', variables.projectId],
            })
            queryClient.invalidateQueries({
                queryKey: ['zone', variables.zoneId],
            })
        },
    })
}

/**
 * Мутация для удаления зоны
 */
export const useDeleteZoneMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ zoneId }: { zoneId: number; projectId: number }) => deleteZone(zoneId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['zones', variables.projectId],
            })
        },
    })
}

/**
 * Мутация для создания правила доступа
 */
export const useCreateZoneRuleMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            zoneId,
            listItem,
        }: {
            zoneId: number
            listItem: string
            projectId: number
        }) => createZoneRule(zoneId, listItem),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['zones', variables.projectId],
            })
        },
    })
}

/**
 * Мутация для удаления правила доступа
 */
export const useDeleteZoneRuleMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ zoneId, ruleId }: { zoneId: number; ruleId: number; projectId: number }) =>
            deleteZoneRule(zoneId, ruleId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['zones', variables.projectId],
            })
        },
    })
}
