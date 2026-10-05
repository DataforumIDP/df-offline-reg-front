import apiClient from '@/services/api'

export interface ProjectScripts {
    preScript: string | null
    postScript: string | null
    runtimeScript: string | null
}

export interface RuntimeScriptResult {
    success: boolean
    processed: number
    updated: number
}

export const fetchProjectScripts = (projectId: number): Promise<ProjectScripts> =>
    apiClient.get(`/projects/${projectId}/scripts`).then((r) => r.data)

export const updateProjectScripts = (
    projectId: number,
    data: ProjectScripts,
): Promise<ProjectScripts> =>
    apiClient.put(`/projects/${projectId}/scripts`, data).then((r) => r.data)

export const runProjectRuntimeScript = (projectId: number): Promise<RuntimeScriptResult> =>
    apiClient.post(`/projects/${projectId}/scripts/runtime/run`).then((r) => r.data)
