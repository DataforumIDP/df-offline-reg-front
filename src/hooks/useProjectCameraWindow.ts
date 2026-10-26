import { useCallback, useEffect } from 'react'
import {
    CAMERA_SETTINGS_KEY,
    closeCameraWindow,
    loadCameraSettings,
    openCameraWindow,
} from '@/services/cameraSettings'

export function useProjectCameraWindow(projectId: string, splitScreenCamera: boolean): void {
    const synchronizeWindow = useCallback(async () => {
        if (!projectId) {
            await closeCameraWindow()
            return
        }
        const settings = loadCameraSettings()
        if (splitScreenCamera && settings.enabled && settings.deviceId) {
            await openCameraWindow(settings.deviceId)
            return
        }
        await closeCameraWindow()
    }, [projectId, splitScreenCamera])

    useEffect(() => {
        const updateWindow = () => {
            void synchronizeWindow().catch((error) => {
                console.error('Не удалось синхронизировать окно камеры проекта', error)
            })
        }

        updateWindow()
        const handleStorage = (event: StorageEvent) => {
            if (event.key === CAMERA_SETTINGS_KEY) {
                updateWindow()
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => {
            window.removeEventListener('storage', handleStorage)
            void closeCameraWindow().catch((error) => {
                console.error('Не удалось закрыть окно камеры проекта', error)
            })
        }
    }, [synchronizeWindow])
}
