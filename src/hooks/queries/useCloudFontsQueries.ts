import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCloudFonts, createCloudFont, deleteCloudFont, CreateCloudFontPayload } from '@/services/api/cloudFonts'
import { setCloudFonts } from '@/services/printService'
import { isElectron } from '@/hooks/useElectron'

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

            // В Electron заранее скачиваем и кэшируем файлы облачных шрифтов локально,
            // чтобы печать не зависела от сети и не упиралась в CORS при первом использовании.
            if (isElectron() && window.electronAPI?.cacheCloudFonts) {
                const urls = result.data.fonts.flatMap((f) => Object.values(f.variants))
                if (urls.length > 0) {
                    window.electronAPI.cacheCloudFonts(urls).catch((e) => {
                        console.error('Failed to pre-cache cloud fonts:', e)
                    })
                }
            }
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
