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
    runId: number
}

export interface RuntimeScriptLogEntry {
    participantId: number
    text: string
}

export interface RuntimeScriptRun {
    id: number
    status: 'running' | 'succeeded' | 'failed'
    result: {
        success: boolean
        processed: number
        updated: number
        participantId?: number
        error?: string
    } | null
    logs: RuntimeScriptLogEntry[]
    startedAt: string
    completedAt: string | null
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

export const fetchProjectRuntimeRuns = (
    projectId: number,
    search: string,
): Promise<RuntimeScriptRun[]> =>
    apiClient
        .get(`/projects/${projectId}/scripts/runtime/runs`, {
            params: search ? { search } : undefined,
        })
        .then((r) => r.data)

export const clearProjectRuntimeRuns = (
    projectId: number,
): Promise<{ success: boolean; deleted: number }> =>
    apiClient
        .delete(`/projects/${projectId}/scripts/runtime/runs`)
        .then((r) => r.data)
