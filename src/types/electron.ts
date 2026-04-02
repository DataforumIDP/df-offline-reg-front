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

export interface ElectronAPI {
    // Print
    getPrinters: () => Promise<Printer[]>
    getPrintSettings: () => Promise<PrintSettings>
    setPrintSettings: (settings: Partial<PrintSettings>) => Promise<boolean>
    printPdf: (data: {
        pdfBase64: string
        copies?: number
        filename?: string
    }) => Promise<PrintResult>
    checkGhostscript: () => Promise<GhostscriptInfo>

    // Font loading (for jsPDF in renderer)
    readFontFile: (relativePath: string) => Promise<string>

    // App info
    getAppInfo: () => Promise<AppInfo>

    // Window controls
    minimize: () => void
    close: () => void
    toggleFullscreen: () => void

    // Updates
    checkForUpdates: () => Promise<{ checking: boolean; info?: any; error?: string }>
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
    setUpdateServer: (url: string) => Promise<boolean>
    getUpdateServer: () => Promise<string>
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
}

export {}
