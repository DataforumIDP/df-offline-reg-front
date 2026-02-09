export type PrintMode = 'web' | 'server'

export interface PrintServerConfig {
    address: string
    port: number
}

export interface PrintSettingsData {
    mode: PrintMode
    server: PrintServerConfig
}

const LOCAL_STORAGE_KEY = 'rega_print_settings'

const DEFAULT_SETTINGS: PrintSettingsData = {
    mode: 'server',
    server: {
        address: 'localhost',
        port: 4400,
    },
}

export function loadPrintSettings(): PrintSettingsData {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            return {
                mode: parsed.mode || DEFAULT_SETTINGS.mode,
                server: {
                    address: parsed.server?.address || DEFAULT_SETTINGS.server.address,
                    port: parsed.server?.port || DEFAULT_SETTINGS.server.port,
                },
            }
        }
    } catch {
        // ignore
    }
    return { ...DEFAULT_SETTINGS }
}

export function savePrintSettings(settings: PrintSettingsData): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
}

/**
 * Проверить доступность сервера печати
 */
export async function checkPrintServer(address: string, port: number): Promise<boolean> {
    try {
        const url = `http://${address}:${port}/status`
        const resp = await fetch(url, { signal: AbortSignal.timeout(3000) })
        if (resp.ok) {
            const data = await resp.json()
            return data.status === 'running'
        }
        return false
    } catch {
        return false
    }
}

/**
 * Отправить PDF blob на сервер печати
 */
export async function sendPdfToPrintServer(
    blob: Blob,
    address: string,
    port: number,
    copies: number = 1,
): Promise<{ success: boolean; message: string }> {
    const url = `http://${address}:${port}/print`
    const formData = new FormData()
    formData.append('file', blob, 'badge.pdf')
    formData.append('copies', String(copies))

    const resp = await fetch(url, {
        method: 'POST',
        body: formData,
    })

    const data = await resp.json()

    if (!resp.ok) {
        throw new Error(data.error || 'Ошибка отправки на сервер печати')
    }

    return { success: true, message: data.message || 'Отправлено на печать' }
}
