import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Text } from '@gravity-ui/uikit'
import { Xmark } from '@gravity-ui/icons'
import { useCameraStream } from '@/hooks/useCameraStream'
import { CAMERA_PREVIEW_ZOOM, useFacePhotoGuidance } from '@/hooks/useFacePhotoGuidance'
import { CAMERA_SETTINGS_KEY, loadCameraSettings } from '@/services/cameraSettings'
import styles from './CameraWindowPage.module.css'

const CameraWindowPage = () => {
    const [searchParams] = useSearchParams()
    const [settings, setSettings] = useState(loadCameraSettings)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [video, setVideo] = useState<HTMLVideoElement | null>(null)
    const deviceId = settings.deviceId || searchParams.get('deviceId') || ''
    const streamReady = useCameraStream(video, deviceId, settings.enabled && !!deviceId)
    const recommendations = useFacePhotoGuidance(videoRef, streamReady)

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === CAMERA_SETTINGS_KEY) {
                setSettings(loadCameraSettings())
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Text variant="header-1">Фото на документ</Text>
                    <Text variant="body-2" color="secondary">
                        Расположитесь перед камерой
                    </Text>
                </div>
                <Button
                    view="flat"
                    size="l"
                    aria-label="Закрыть окно камеры"
                    onClick={() => window.close()}
                >
                    <Xmark />
                </Button>
            </header>

            <div className={styles.preview}>
                <video
                    ref={(element) => {
                        videoRef.current = element
                        setVideo(element)
                    }}
                    className={styles.video}
                    style={{ '--preview-zoom': CAMERA_PREVIEW_ZOOM } as CSSProperties}
                    playsInline
                    muted
                />
                <div className={styles.frame} aria-hidden="true" />
            </div>

            <section className={styles.guidance} aria-live="polite">
                {recommendations.length > 0 ? (
                    recommendations.map((recommendation) => (
                        <Text
                            key={recommendation}
                            variant="body-1"
                            className={styles.recommendation}
                        >
                            {recommendation}
                        </Text>
                    ))
                ) : (
                    <Text variant="body-1" color="secondary" className={styles.recommendation}>
                        {streamReady ? 'Проверяем положение и качество кадра…' : ' '}
                    </Text>
                )}
            </section>
        </main>
    )
}

export default CameraWindowPage
