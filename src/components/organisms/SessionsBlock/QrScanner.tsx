import { useState, useEffect, useRef } from 'react'
import { Text, Button, Alert, Spin } from '@gravity-ui/uikit'
import { Xmark } from '@gravity-ui/icons'
import styles from './SessionsBlock.module.css'

interface QrScannerProps {
    onScan: (code: string) => void
    onClose: () => void
    isLoading?: boolean
    error?: string
}

export const QrScanner = ({ onScan, onClose, isLoading, error }: QrScannerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [scanning, setScanning] = useState(false)
    const scanIntervalRef = useRef<number | null>(null)

    useEffect(() => {
        let stream: MediaStream | null = null

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                })

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                    setScanning(true)
                    startScanning()
                }
            } catch (err) {
                console.error('Camera error:', err)
                setCameraError('Не удалось получить доступ к камере')
            }
        }

        startCamera()

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop())
            }
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current)
            }
        }
    }, [])

    const startScanning = () => {
        // Используем jsQR для сканирования QR кодов
        // Динамический импорт для уменьшения bundle size
        import('jsqr')
            .then((jsQR) => {
                scanIntervalRef.current = window.setInterval(() => {
                    if (!videoRef.current || !canvasRef.current) return

                    const canvas = canvasRef.current
                    const video = videoRef.current
                    const ctx = canvas.getContext('2d')

                    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const code = jsQR.default(imageData.data, imageData.width, imageData.height)

                    if (code?.data) {
                        // Ожидаем код в формате "REGA_AUTH:XXXXXXXX"
                        const match = code.data.match(/^REGA_AUTH:([A-Z0-9]{8})$/)
                        if (match) {
                            if (scanIntervalRef.current) {
                                clearInterval(scanIntervalRef.current)
                            }
                            onScan(match[1])
                        }
                    }
                }, 250)
            })
            .catch((err) => {
                console.error('Failed to load jsQR:', err)
                setCameraError('Ошибка загрузки сканера')
            })
    }

    return (
        <div className={styles.qrScannerContainer}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                }}
            >
                <Text variant="header-1">Сканировать QR код</Text>
                <Button view="flat" size="l" onClick={onClose}>
                    <Xmark />
                </Button>
            </div>

            <Text variant="body-2" color="secondary">
                Наведите камеру на QR код для авторизации устройства
            </Text>

            {cameraError ? (
                <Alert theme="danger" message={cameraError} />
            ) : (
                <div className={styles.qrScanner}>
                    <video
                        ref={videoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            )}

            {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Spin size="s" />
                    <Text variant="body-2">Подтверждение...</Text>
                </div>
            )}

            {error && <Alert theme="danger" message={error} />}

            {scanning && !isLoading && !error && (
                <Text variant="body-2" color="secondary">
                    Сканирование...
                </Text>
            )}
        </div>
    )
}
