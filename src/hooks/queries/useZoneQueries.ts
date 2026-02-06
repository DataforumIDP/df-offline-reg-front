import { useQuery } from '@tanstack/react-query'
import { fetchZones, fetchZoneById, fetchZoneConfig, fetchZoneScanners } from '@/services/api/zones'

/**
 * Запрос списка зон проекта
 */
export const useZonesQuery = (projectId: number | undefined) => {
    return useQuery({
        queryKey: ['zones', projectId],
        queryFn: () => fetchZones(projectId!),
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // 2 минуты
    })
}

/**
 * Запрос одной зоны
 */
export const useZoneQuery = (zoneId: number | undefined) => {
    return useQuery({
        queryKey: ['zone', zoneId],
        queryFn: () => fetchZoneById(zoneId!),
        enabled: !!zoneId,
        staleTime: 2 * 60 * 1000, // 2 минуты
    })
}

/**
 * Запрос конфига зоны для QR кода
 */
export const useZoneConfigQuery = (zoneId: number | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['zoneConfig', zoneId],
        queryFn: () => fetchZoneConfig(zoneId!),
        enabled: !!zoneId && enabled,
        staleTime: 5 * 60 * 1000, // 5 минут
    })
}

/**
 * Запрос списка сканеров зоны
 */
export const useZoneScannersQuery = (zoneId: number | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['zoneScanners', zoneId],
        queryFn: () => fetchZoneScanners(zoneId!),
        enabled: !!zoneId && enabled,
        staleTime: 30 * 1000, // 30 секунд - обновляется чаще
    })
}
