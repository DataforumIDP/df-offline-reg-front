import { contextBridge, ipcRenderer } from 'electron'

export interface PrintSettings {
    mode: 'native' | 'pdf-browser'
    printer: string
    labelWidth: number
    labelHeight: number
    orientation: 'portrait' | 'landscape'
}

export interface PrintResult {
    success: boolean
    mode?: 'native' | 'pdf-browser'
    message?: string
    error?: string
}

export interface Printer {
    name: string
    isDefault?: boolean
}

export interface AppInfo {
    version: string
    name: string
}

export interface UpdateStatus {
    status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
    version?: string
    percent?: number
    error?: string
}

export interface GhostscriptInfo {
    installed: boolean
    path: string | null
}

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Print
    getPrinters: (): Promise<Printer[]> => ipcRenderer.invoke('get-printers'),
    getPrintSettings: async (): Promise<PrintSettings> => {
        const raw = await ipcRenderer.invoke('get-print-settings');
        // Маппинг selectedPrinter -> printer
        return {
            mode: raw.printMode,
            printer: raw.selectedPrinter,
            labelWidth: raw.labelWidth,
            labelHeight: raw.labelHeight,
            orientation: raw.orientation,
        };
    },
    setPrintSettings: async (settings: Partial<PrintSettings>): Promise<boolean> => {
        // Маппинг printer -> selectedPrinter
        const mapped: any = { ...settings };
        if ('printer' in mapped) {
            mapped.selectedPrinter = mapped.printer;
            delete mapped.printer;
        }
        if ('mode' in mapped) {
            mapped.printMode = mapped.mode;
            delete mapped.mode;
        }
        return ipcRenderer.invoke('set-print-settings', mapped);
    },
    printPdf: (data: {
        pdfBase64: string
        copies?: number
        filename?: string
    }): Promise<PrintResult> => ipcRenderer.invoke('print-pdf', data),
    checkGhostscript: (): Promise<GhostscriptInfo> => ipcRenderer.invoke('check-ghostscript'),

    // App info
    getAppInfo: (): Promise<AppInfo> => ipcRenderer.invoke('get-app-info'),

    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    toggleFullscreen: () => ipcRenderer.send('window-toggle-fullscreen'),

    // Font loading for jsPDF (renderer can't fetch file:// fonts)
    readFontFile: (urlOrPath: string): Promise<string> =>
        ipcRenderer.invoke('read-font-file', urlOrPath),
    // Предзагрузить и закэшировать облачные шрифты локально
    cacheCloudFonts: (urls: string[]): Promise<Array<{ url: string; ok: boolean; error?: string }>> =>
        ipcRenderer.invoke('cache-cloud-fonts', urls),

    // Updates
    checkForUpdates: (): Promise<{ checking: boolean; error?: string }> =>
        ipcRenderer.invoke('check-for-updates'),
    installUpdate: (): Promise<void> =>
        ipcRenderer.invoke('install-update'),
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
        const handler = (_: any, status: UpdateStatus) => callback(status)
        ipcRenderer.on('update-status', handler)
        return () => ipcRenderer.removeListener('update-status', handler)
    },
    setUpdateServer: (url: string): Promise<boolean> =>
        ipcRenderer.invoke('set-update-server', url),
    getUpdateServer: (): Promise<string> => ipcRenderer.invoke('get-update-server'),
    getUpdateChannel: (): Promise<string> => ipcRenderer.invoke('get-update-channel'),
    setUpdateChannel: (channel: string): Promise<boolean> => ipcRenderer.invoke('set-update-channel', channel),

    // Network discovery
    scanNetwork: (): Promise<Array<{ url: string; name: string }>> => ipcRenderer.invoke('scan-network'),
})
