import { useState, useEffect, useCallback } from 'react'
import type {
    PrintSettings,
    Printer,
    PrintResult,
    UpdateStatus,
    GhostscriptInfo,
    AppInfo,
} from '@/types/electron'

/**
 * Check if running in Electron
 */
export const isElectron = (): boolean => {
    // Prefer runtime detection: check exposed preload API or Electron userAgent.
    // Fallback to build-time Vite env flag if explicitly set.
    try {
        if (typeof window !== 'undefined' && typeof (window as any).electronAPI === 'object') return true
        if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Electron')) return true
    } catch {
        // ignore
    }
    return import.meta.env.VITE_IS_ELECTRON === 'true'
}

/**
 * Hook for Electron print functionality
 */
export const useElectronPrint = () => {
    const [printers, setPrinters] = useState<Printer[]>([])
    const [settings, setSettings] = useState<PrintSettings | null>(null)
    const [ghostscript, setGhostscript] = useState<GhostscriptInfo | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isElectron()) {
            setLoading(false)
            return
        }

        const load = async () => {
            try {
                const [printerList, printSettings, gsInfo] = await Promise.all([
                    window.electronAPI!.getPrinters(),
                    window.electronAPI!.getPrintSettings(),
                    window.electronAPI!.checkGhostscript(),
                ])
                setPrinters(printerList)
                setSettings(printSettings)
                setGhostscript(gsInfo)
            } catch (err) {
                console.error('Failed to load electron print settings:', err)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const updateSettings = useCallback(async (newSettings: Partial<PrintSettings>) => {
        if (!isElectron()) return false

        try {
            await window.electronAPI!.setPrintSettings(newSettings)
            setSettings((prev) => (prev ? { ...prev, ...newSettings } : null))
            return true
        } catch {
            return false
        }
    }, [])

    const print = useCallback(
        async (pdfBase64: string, copies = 1, filename?: string): Promise<PrintResult> => {
            if (!isElectron()) {
                return { success: false, error: 'Not running in Electron' }
            }

            return window.electronAPI!.printPdf({ pdfBase64, copies, filename })
        },
        [],
    )

    return {
        isElectron: isElectron(),
        printers,
        settings,
        ghostscript,
        loading,
        updateSettings,
        print,
    }
}

/**
 * Hook for Electron auto-updater
 */
export const useElectronUpdater = () => {
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
    const [updateServer, setUpdateServer] = useState<string>('')

    useEffect(() => {
        if (!isElectron()) return

        // Get current update server
        window.electronAPI!.getUpdateServer().then(setUpdateServer)

        // Subscribe to update status
        const unsubscribe = window.electronAPI!.onUpdateStatus(setUpdateStatus)
        return unsubscribe
    }, [])

    const checkForUpdates = useCallback(async () => {
        if (!isElectron()) return null
        return window.electronAPI!.checkForUpdates()
    }, [])

    const setServer = useCallback(async (url: string) => {
        if (!isElectron()) return false
        const result = await window.electronAPI!.setUpdateServer(url)
        if (result) setUpdateServer(url)
        return result
    }, [])

    return {
        isElectron: isElectron(),
        updateStatus,
        updateServer,
        checkForUpdates,
        setUpdateServer: setServer,
    }
}

/**
 * Hook for Electron window controls
 */
export const useElectronWindow = () => {
    const minimize = useCallback(() => {
        window.electronAPI?.minimize()
    }, [])

    const close = useCallback(() => {
        window.electronAPI?.close()
    }, [])

    const toggleFullscreen = useCallback(() => {
        window.electronAPI?.toggleFullscreen()
    }, [])

    return {
        isElectron: isElectron(),
        minimize,
        close,
        toggleFullscreen,
    }
}

/**
 * Hook for app info
 */
export const useElectronAppInfo = () => {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

    useEffect(() => {
        if (!isElectron()) return
        if (typeof window.electronAPI?.getAppInfo !== 'function') return
        window.electronAPI.getAppInfo().then(setAppInfo)
    }, [])

    return {
        isElectron: isElectron(),
        appInfo,
    }
}
