import { useCallback, useEffect, useState } from 'react'
import { Button, Dialog, Loader, Text } from '@gravity-ui/uikit'
import { uploadImageWithMini } from '@/services/api/files'
import { loadCameraSettings } from '@/services/cameraSettings'
import { useCameraStream } from '@/hooks/useCameraStream'

interface CameraImageCaptureProps {
    value: string
    label: string
    onChange: (url: string) => void
    disabled?: boolean
}

const CameraImageCapture = ({
    value,
    label,
    onChange,
    disabled = false,
}: CameraImageCaptureProps) => {
    const [video, setVideo] = useState<HTMLVideoElement | null>(null)
    const [open, setOpen] = useState(false)
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
    const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null)
    const [saving, setSaving] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [deviceId, setDeviceId] = useState('')
    const reportCameraError = useCallback((error: unknown) => {
        if (error instanceof Error && error.message === 'Истекло время ожидания доступа к камере.') {
            setCameraError('Ожидание камеры затянулось. Проверьте разрешение на использование камеры и повторите попытку.')
            return
        }
        if (error instanceof Error && error.message === 'Браузер не поддерживает доступ к камере.') {
            setCameraError(error.message)
            return
        }
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setCameraError('Нет доступа к камере. Разрешите приложению использовать камеру в настройках системы.')
            return
        }
        if (error instanceof DOMException && error.name === 'NotFoundError') {
            setCameraError('Камера не найдена. Проверьте подключение устройства в настройках.')
            return
        }
        setCameraError('Не удалось запустить камеру. Проверьте разрешение и подключение устройства.')
    }, [])
    const streamReady = useCameraStream(
        video,
        deviceId,
        open && !snapshotBlob,
        reportCameraError,
    )

    useEffect(
        () => () => {
            if (snapshotUrl) {
                URL.revokeObjectURL(snapshotUrl)
            }
        },
        [snapshotUrl],
    )

    const close = (force = false) => {
        if (saving && !force) {
            return
        }
        setOpen(false)
        setSnapshotBlob(null)
        setSnapshotUrl(null)
        setCameraError('')
    }

    const takeSnapshot = () => {
        if (!video || !video.videoWidth || !video.videoHeight) {
            setCameraError('Не удалось получить кадр с камеры.')
            return
        }

        const outputHeight = video.videoHeight
        const outputWidth = Math.round(outputHeight * 0.75)
        const cropWidth = outputWidth / 1.15
        const cropHeight = outputHeight / 1.15
        const sourceX = Math.max(0, (video.videoWidth - cropWidth) / 2)
        const sourceY = Math.max(0, (video.videoHeight - cropHeight) / 2)
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = outputHeight
        const context = canvas.getContext('2d')
        if (!context) {
            setCameraError('Не удалось обработать кадр с камеры.')
            return
        }

        context.translate(outputWidth, 0)
        context.scale(-1, 1)
        context.drawImage(
            video,
            sourceX,
            sourceY,
            Math.min(cropWidth, video.videoWidth),
            Math.min(cropHeight, video.videoHeight),
            0,
            0,
            outputWidth,
            outputHeight,
        )
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setCameraError('Не удалось подготовить снимок.')
                    return
                }
                setSnapshotBlob(blob)
                setSnapshotUrl(URL.createObjectURL(blob))
                setCameraError('')
            },
            'image/jpeg',
            0.95,
        )
    }

    const retake = () => {
        if (snapshotUrl) {
            URL.revokeObjectURL(snapshotUrl)
        }
        setSnapshotBlob(null)
        setSnapshotUrl(null)
        setCameraError('')
    }

    const saveSnapshot = async () => {
        if (!snapshotBlob) {
            return
        }

        setSaving(true)
        setCameraError('')
        try {
            const file = new File([snapshotBlob], `camera-${Date.now()}.jpg`, {
                type: 'image/jpeg',
            })
            const result = await uploadImageWithMini(file)
            onChange(result.url)
            close(true)
        } catch (error) {
            console.error('Не удалось сохранить снимок с камеры', error)
            setCameraError(error instanceof Error ? error.message : 'Не удалось загрузить снимок.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div>
                <label
                    style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: 'var(--g-color-text-secondary)',
                    }}
                >
                    {label}
                </label>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        setDeviceId(loadCameraSettings().deviceId)
                        setCameraError(
                            navigator.mediaDevices
                                ? ''
                                : 'Браузер не поддерживает доступ к камере.',
                        )
                        setOpen(true)
                    }}
                    style={{
                        display: 'flex',
                        width: '100%',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: '1px dashed var(--g-color-line-generic)',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: 'var(--g-color-text-primary)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                    }}
                >
                    {value ? (
                        <img
                            src={value}
                            alt={label}
                            style={{
                                width: '65%',
                                maxHeight: '280px',
                                objectFit: 'contain',
                                borderRadius: '8px',
                            }}
                        />
                    ) : (
                        <Text variant="body-1" color="secondary">
                            Нажмите, чтобы сделать снимок
                        </Text>
                    )}
                    {value && (
                        <Text variant="body-2" color="secondary">
                            Сделать снимок
                        </Text>
                    )}
                </button>
            </div>

            <Dialog open={open} onClose={() => close()} aria-labelledby="camera-capture-title">
                <Dialog.Header caption={`Снимок: ${label}`} id="camera-capture-title" />
                <Dialog.Body>
                    <div
                        style={{
                            position: 'relative',
                            width: 'min(60vw, 420px)',
                            minWidth: '280px',
                            aspectRatio: '3 / 4',
                            overflow: 'hidden',
                            borderRadius: '8px',
                            background: '#111',
                        }}
                    >
                        {snapshotUrl ? (
                            <img
                                src={snapshotUrl}
                                alt="Предпросмотр снимка"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <video
                                ref={setVideo}
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1) scale(1.15)',
                                }}
                            />
                        )}
                        {!streamReady && !snapshotUrl && !cameraError && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <Loader size="l" />
                            </div>
                        )}
                    </div>
                    {cameraError && (
                        <Text
                            variant="body-2"
                            color="danger"
                            style={{ display: 'block', marginTop: 8 }}
                        >
                            {cameraError}
                        </Text>
                    )}
                    {snapshotBlob && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 12,
                            }}
                        >
                            <Button view="outlined" onClick={() => {}}>
                                Редактировать
                            </Button>
                            <Button view="outlined" onClick={retake} disabled={saving}>
                                Переснять
                            </Button>
                        </div>
                    )}
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => close()}
                    textButtonCancel="Отмена"
                    onClickButtonApply={snapshotBlob ? saveSnapshot : takeSnapshot}
                    textButtonApply={snapshotBlob ? 'Сохранить' : 'Снимок'}
                    propsButtonApply={{
                        loading: saving,
                        disabled: snapshotBlob ? saving : !streamReady,
                    }}
                />
            </Dialog>
        </>
    )
}

export default CameraImageCapture
