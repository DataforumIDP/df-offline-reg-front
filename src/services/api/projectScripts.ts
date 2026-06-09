import apiClient from '@/services/api'

export interface ProjectScripts {
    preScript: string | null
    postScript: string | null
}

export const fetchProjectScripts = (projectId: number): Promise<ProjectScripts> =>
    apiClient.get(`/projects/${projectId}/scripts`).then((r) => r.data)

export const updateProjectScripts = (projectId: number, data: ProjectScripts): Promise<ProjectScripts> =>
    apiClient.put(`/projects/${projectId}/scripts`, data).then((r) => r.data)
