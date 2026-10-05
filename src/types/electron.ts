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
    // urlOrPath: либо относительный путь встроенного шрифта ('fonts/..'), либо полный http(s) URL облачного шрифта
    readFontFile: (urlOrPath: string) => Promise<string>
    getWindowsFonts: () => Promise<string[]>
    readWindowsFontFile: (
        family: string,
        variant: 'normal' | 'bold' | 'italic' | 'bolditalic',
    ) => Promise<string>
    // Предзагрузить и закэшировать список облачных шрифтов локально (вызывается при старте приложения)
    cacheCloudFonts: (urls: string[]) => Promise<Array<{ url: string; ok: boolean; error?: string }>>
    clearAppCaches: () => Promise<void>

    // App info
    getAppInfo: () => Promise<AppInfo>

    // Window controls
    minimize: () => void
    close: () => void
    toggleFullscreen: () => void

    // Updates
    checkForUpdates: () => Promise<{ checking: boolean; error?: string }>
    installUpdate: () => Promise<void>
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
    setUpdateServer: (url: string) => Promise<boolean>
    getUpdateServer: () => Promise<string>
    getUpdateChannel: () => Promise<string>
    setUpdateChannel: (channel: string) => Promise<boolean>

    // Network discovery
    scanNetwork: () => Promise<Array<{ url: string; name: string }>>
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI
    }
}

export {}
