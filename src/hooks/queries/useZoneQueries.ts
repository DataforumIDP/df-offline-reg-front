import { useQuery } from '@tanstack/react-query'
import { fetchZones, fetchZoneById } from '@/services/api/zones'

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
