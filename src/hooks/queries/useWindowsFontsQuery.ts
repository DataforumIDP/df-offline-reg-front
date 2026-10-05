import { useQuery } from '@tanstack/react-query'
import { isElectron } from '@/hooks/useElectron'

export const useWindowsFontsQuery = () =>
    useQuery({
        queryKey: ['windows-fonts'],
        queryFn: () => window.electronAPI!.getWindowsFonts(),
        enabled: isElectron() && typeof window.electronAPI?.getWindowsFonts === 'function',
        staleTime: 5 * 60 * 1000,
    })
