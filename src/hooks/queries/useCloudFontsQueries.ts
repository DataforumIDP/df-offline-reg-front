import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCloudFonts, createCloudFont, deleteCloudFont, CreateCloudFontPayload } from '@/services/api/cloudFonts'
import { setCloudFonts } from '@/services/printService'

const QUERY_KEY = 'cloud-fonts'

export const useCloudFontsQuery = () => {
    const result = useQuery({
        queryKey: [QUERY_KEY],
        queryFn: fetchCloudFonts,
        staleTime: 5 * 60 * 1000,
    })

    useEffect(() => {
        if (result.data?.fonts) {
            setCloudFonts(result.data.fonts)
        }
    }, [result.data])

    return result
}

export const useCreateCloudFont = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateCloudFontPayload) => createCloudFont(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    })
}

export const useDeleteCloudFont = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => deleteCloudFont(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    })
}
