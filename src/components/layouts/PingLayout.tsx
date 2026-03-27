    import { ReactNode, useEffect, useState } from 'react'
import usePingMonitor from '@/hooks/usePingMonitor'
import { getActiveServerUrl } from '@/services/serverStorage'

interface PingLayoutProps {
    children: ReactNode
    pingInterval?: number
    toastCooldown?: number
    timeout?: number
    showSuccessToasts?: boolean
    toastDuration?: number
}

/**
 * Layout-обёртка для мониторинга соединения с сервером.
 * URL для пинга получается динамически из getActiveServerUrl().
 */
const PingLayout = ({
    children,
    pingInterval = 30000,
    toastCooldown = 10000,
    timeout = 30000,
    showSuccessToasts = true,
    toastDuration = 5000,
}: PingLayoutProps) => {
    // Динамически получаем URL сервера
    const [serverUrl, setServerUrl] = useState(() => getActiveServerUrl())

    // Обновляем URL при изменении в localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            const newUrl = getActiveServerUrl()
            setServerUrl(newUrl)
        }

        // Слушаем события storage (изменения из других вкладок)
        window.addEventListener('storage', handleStorageChange)

        // Также проверяем периодически на случай изменений в той же вкладке
        const intervalId = setInterval(handleStorageChange, 5000)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            clearInterval(intervalId)
        }
    }, [])

    // Используем хук мониторинга с текущим URL
    usePingMonitor({
        url: serverUrl,
        pingInterval,
        toastCooldown,
        timeout,
        showSuccessToasts,
        toastDuration,
    })

    return <>{children}</>
}

export default PingLayout
