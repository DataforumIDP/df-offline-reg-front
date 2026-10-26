export type CameraMode = 'separate-window'

export interface CameraSettings {
    enabled: boolean
    deviceId: string
    mode: CameraMode
}

export const CAMERA_SETTINGS_KEY = 'rega_camera_settings'

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
    enabled: false,
    deviceId: '',
    mode: 'separate-window',
}

let browserCameraWindow: Window | null = null

export function loadCameraSettings(): CameraSettings {
    try {
        const raw = localStorage.getItem(CAMERA_SETTINGS_KEY)
        if (!raw) {
            return { ...DEFAULT_CAMERA_SETTINGS }
        }

        const parsed = JSON.parse(raw) as Partial<CameraSettings>
        return {
            enabled: parsed.enabled === true,
            deviceId: typeof parsed.deviceId === 'string' ? parsed.deviceId : '',
            mode: 'separate-window',
        }
    } catch (error) {
        console.error('Не удалось загрузить настройки камеры', error)
        return { ...DEFAULT_CAMERA_SETTINGS }
    }
}

export function saveCameraSettings(settings: CameraSettings): void {
    localStorage.setItem(CAMERA_SETTINGS_KEY, JSON.stringify(settings))
}

export async function openCameraWindow(deviceId: string): Promise<void> {
    if (window.electronAPI?.openCameraWindow) {
        const opened = await window.electronAPI.openCameraWindow(deviceId)
        if (!opened) {
            throw new Error('Не удалось открыть отдельное окно камеры')
        }
        return
    }

    const url = new URL(`${import.meta.env.BASE_URL}camera`, window.location.origin)
    url.searchParams.set('deviceId', deviceId)
    browserCameraWindow = window.open(url.toString(), 'rega-camera', 'popup,width=720,height=960')
    if (!browserCameraWindow) {
        throw new Error('Браузер заблокировал отдельное окно камеры')
    }
}

export async function closeCameraWindow(): Promise<void> {
    if (window.electronAPI?.closeCameraWindow) {
        const closed = await window.electronAPI.closeCameraWindow()
        if (!closed) {
            throw new Error('Не удалось закрыть отдельное окно камеры')
        }
        return
    }

    browserCameraWindow?.close()
    browserCameraWindow = null
}
