import { useEffect, useState } from 'react'

export interface CameraDeviceOption {
    deviceId: string
    label: string
}

export function useCameraDevices(enabled: boolean): CameraDeviceOption[] {
    const [devices, setDevices] = useState<CameraDeviceOption[]>([])

    useEffect(() => {
        if (!enabled || !navigator.mediaDevices?.getUserMedia) {
            setDevices([])
            return
        }

        let cancelled = false
        let stream: MediaStream | undefined

        const loadDevices = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                stream.getTracks().forEach((track) => track.stop())

                const cameras = await navigator.mediaDevices.enumerateDevices()
                if (!cancelled) {
                    setDevices(
                        cameras
                            .filter((device) => device.kind === 'videoinput')
                            .map((device, index) => ({
                                deviceId: device.deviceId,
                                label: device.label || `Камера ${index + 1}`,
                            })),
                    )
                }
            } catch (error) {
                console.error('Не удалось получить список камер', error)
                if (!cancelled) {
                    setDevices([])
                }
            }
        }

        void loadDevices()

        const handleDeviceChange = () => {
            void navigator.mediaDevices
                .enumerateDevices()
                .then((cameras) => {
                    if (!cancelled) {
                        setDevices(
                            cameras
                                .filter((device) => device.kind === 'videoinput')
                                .map((device, index) => ({
                                    deviceId: device.deviceId,
                                    label: device.label || `Камера ${index + 1}`,
                                })),
                        )
                    }
                })
                .catch((error) => {
                    console.error('Не удалось обновить список камер', error)
                })
        }

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

        return () => {
            cancelled = true
            stream?.getTracks().forEach((track) => track.stop())
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
        }
    }, [enabled])

    return devices
}
