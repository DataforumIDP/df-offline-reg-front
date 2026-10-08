import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchProjectScripts,
    updateProjectScripts,
    runProjectRuntimeScript,
    fetchProjectRuntimeRuns,
    clearProjectRuntimeRuns,
    ProjectScripts,
} from '@/services/api/projectScripts'

const queryKey = (projectId: number) => ['project-scripts', projectId]

export const useProjectScriptsQuery = (projectId: number) =>
    useQuery({
        queryKey: queryKey(projectId),
        queryFn: () => fetchProjectScripts(projectId),
        enabled: !!projectId,
        staleTime: 60_000,
    })

export const useUpdateProjectScripts = (projectId: number) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: ProjectScripts) => updateProjectScripts(projectId, data),
        onSuccess: (updated) => {
            qc.setQueryData(queryKey(projectId), updated)
        },
    })
}

export const useRunProjectRuntimeScript = (projectId: number) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => runProjectRuntimeScript(projectId),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['participants', projectId] })
            qc.invalidateQueries({ queryKey: ['participant', projectId] })
            qc.invalidateQueries({ queryKey: ['project-runtime-runs', projectId] })
        },
    })
}

export const useProjectRuntimeRunsQuery = (
    projectId: number,
    search: string,
    enabled: boolean,
) =>
    useQuery({
        queryKey: ['project-runtime-runs', projectId, search],
        queryFn: () => fetchProjectRuntimeRuns(projectId, search),
        enabled: !!projectId && enabled,
        staleTime: 0,
        refetchInterval: enabled ? 3000 : false,
    })

export const useClearProjectRuntimeRuns = (projectId: number) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: () => clearProjectRuntimeRuns(projectId),
        onSuccess: () =>
            qc.invalidateQueries({
                queryKey: ['project-runtime-runs', projectId],
            }),
    })
}
