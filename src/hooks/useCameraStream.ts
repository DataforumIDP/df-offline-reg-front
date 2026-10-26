import { useEffect, useState } from 'react'

export function useCameraStream(
    video: HTMLVideoElement | null,
    deviceId: string,
    enabled: boolean,
    onError?: (error: unknown) => void,
): boolean {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!enabled) {
            setReady(false)
            return
        }

        if (!video) {
            return
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setReady(false)
            onError?.(new Error('Браузер не поддерживает доступ к камере.'))
            return
        }

        let active = true
        let timedOut = false
        let stream: MediaStream | undefined
        const timeoutId = window.setTimeout(() => {
            timedOut = true
            if (active) {
                setReady(false)
                onError?.(new Error('Истекло время ожидания доступа к камере.'))
            }
        }, 20000)

        const startStream = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
                        width: { ideal: 1600 },
                        height: { ideal: 1200 },
                        aspectRatio: { ideal: 0.75 },
                        frameRate: { ideal: 30, max: 30 },
                    },
                })
                if (!active || timedOut) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                video.srcObject = stream
                await video.play()
                if (active && !timedOut) {
                    window.clearTimeout(timeoutId)
                    setReady(true)
                }
            } catch (error) {
                window.clearTimeout(timeoutId)
                console.error('Не удалось запустить поток камеры', error)
                if (active) {
                    setReady(false)
                    onError?.(error)
                }
            }
        }

        void startStream()

        return () => {
            active = false
            window.clearTimeout(timeoutId)
            setReady(false)
            if (video.srcObject === stream) {
                video.srcObject = null
            }
            stream?.getTracks().forEach((track) => track.stop())
        }
    }, [deviceId, enabled, onError, video])

    return ready
}
