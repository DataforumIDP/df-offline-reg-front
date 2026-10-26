import { useEffect, useState } from 'react'
import { Button, Select, Switch, Text } from '@gravity-ui/uikit'
import { useCameraDevices } from '@/hooks/useCameraDevices'
import {
    CAMERA_SETTINGS_KEY,
    loadCameraSettings,
    openCameraWindow,
    saveCameraSettings,
} from '@/services/cameraSettings'
import styles from './CameraSettings.module.css'

export const CameraSettings = () => {
    const [settings, setSettings] = useState(loadCameraSettings)
    const devices = useCameraDevices(settings.enabled)

    useEffect(() => {
        const syncSettings = (event: StorageEvent) => {
            if (event.key === CAMERA_SETTINGS_KEY || event.key === null) {
                setSettings(loadCameraSettings())
            }
        }
        window.addEventListener('storage', syncSettings)
        return () => window.removeEventListener('storage', syncSettings)
    }, [])

    const updateSettings = (nextSettings: typeof settings) => {
        setSettings(nextSettings)
        saveCameraSettings(nextSettings)
    }

    const handleEnabledChange = (enabled: boolean) => {
        const nextSettings = { ...settings, enabled }
        updateSettings(nextSettings)
        if (enabled && nextSettings.deviceId) {
            void openCameraWindow(nextSettings.deviceId).catch((error) => {
                console.error('Не удалось открыть окно камеры', error)
            })
        }
    }

    const handleDeviceChange = (values: string[]) => {
        const deviceId = values[0] || ''
        const nextSettings = { ...settings, deviceId }
        updateSettings(nextSettings)
        if (nextSettings.enabled && deviceId) {
            void openCameraWindow(deviceId).catch((error) => {
                console.error('Не удалось открыть окно камеры', error)
            })
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.row}>
                <div className={styles.description}>
                    <Text variant="subheader-2">Использовать камеру</Text>
                    <Text variant="body-2" color="secondary">
                        Сейчас доступен режим отдельного окна; тип режима оставлен расширяемым для
                        других режимов мероприятия. Оценка качества кадра выполняется на устройстве.
                    </Text>
                </div>
                <Switch
                    checked={settings.enabled}
                    onUpdate={handleEnabledChange}
                    size="l"
                    aria-label="Использовать камеру"
                />
            </div>

            {settings.enabled && (
                <div className={styles.deviceField}>
                    <Text variant="body-2" color="secondary">
                        Устройство камеры
                    </Text>
                    <Select
                        value={settings.deviceId ? [settings.deviceId] : []}
                        onUpdate={handleDeviceChange}
                        options={devices.map(({ deviceId, label }) => ({
                            value: deviceId,
                            content: label,
                        }))}
                        placeholder="Выберите камеру"
                        width="max"
                        size="l"
                    />
                    {settings.deviceId && (
                        <Button
                            view="outlined"
                            size="l"
                            onClick={() => {
                                void openCameraWindow(settings.deviceId).catch((error) => {
                                    console.error('Не удалось открыть окно камеры', error)
                                })
                            }}
                        >
                            Открыть окно камеры
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
