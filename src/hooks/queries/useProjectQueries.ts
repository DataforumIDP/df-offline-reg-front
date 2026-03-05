import { useQuery } from '@tanstack/react-query'
import { fetchProjects, fetchProjectById, fetchProjectDevices, type ProjectsQuery } from '@/services/api/projects'

/**
 * Запрос списка проектов
 */
export const useProjectsQuery = (params?: ProjectsQuery) => {
    return useQuery({
        queryKey: ['projects', params],
        queryFn: () => fetchProjects(params),
        staleTime: 5 * 60 * 1000, // 5 минут
    })
}

/**
 * Запрос одного проекта
 */
export const useProjectQuery = (id: string | number | undefined) => {
    return useQuery({
        queryKey: ['project', id],
        queryFn: () => fetchProjectById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 минут
    })
}

/**
 * Запрос списка устройств проекта
 */
export const useProjectDevicesQuery = (projectId: number | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['projectDevices', projectId],
        queryFn: () => fetchProjectDevices(projectId!),
        enabled: !!projectId && enabled,
        staleTime: 30 * 1000, // 30 секунд
    })
}
