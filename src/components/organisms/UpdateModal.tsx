import { useState, useEffect, useCallback } from 'react'
import { Dialog, Button, Text, RadioGroup, Progress } from '@gravity-ui/uikit'
import { ArrowRotateRight, CircleCheck, ArrowDown as CloudArrowDownIn, TriangleExclamation } from '@gravity-ui/icons'
import type { UpdateStatus } from '@/types/electron'
import styles from './UpdateModal.module.css'

interface Props {
    open: boolean
    onClose: () => void
    currentVersion: string
}

type Channel = 'r' | 'a'

const CHANNEL_LABELS: Record<Channel, string> = {
    r: 'Стабильный (r)',
    a: 'Альфа (a)',
}

const UpdateModal = ({ open, onClose, currentVersion }: Props) => {
    const api = (window as any).electronAPI

    const [status, setStatus] = useState<UpdateStatus | null>(null)
    const [channel, setChannel] = useState<Channel>('r')
    const [channelLoading, setChannelLoading] = useState(false)
    const [checking, setChecking] = useState(false)

    // Подписка на update-status events
    useEffect(() => {
        if (!open || !api?.onUpdateStatus) return
        const unsub = api.onUpdateStatus((s: UpdateStatus) => {
            setStatus(s)
            if (s.status === 'checking') setChecking(true)
            else setChecking(false)
        })
        return unsub
    }, [open, api])

    // Загрузить текущий канал при открытии
    useEffect(() => {
        if (!open || !api?.getUpdateChannel) return
        api.getUpdateChannel().then((ch: string) => {
            if (ch === 'r' || ch === 'a') setChannel(ch)
        })
    }, [open, api])

    const handleCheck = useCallback(async () => {
        if (!api?.checkForUpdates) return
        setStatus(null)
        setChecking(true)
        try {
            await api.checkForUpdates()
        } catch (e: any) {
            setStatus({ status: 'error', error: e?.message ?? 'Ошибка связи с main process' })
            setChecking(false)
        }
    }, [api])

    const handleInstall = useCallback(() => {
        api?.installUpdate?.()
    }, [api])

    const handleChannelChange = useCallback(async (ch: string) => {
        if (!api?.setUpdateChannel) return
        setChannelLoading(true)
        try {
            await api.setUpdateChannel(ch)
            setChannel(ch as Channel)
            setStatus(null)
        } catch (e: any) {
            setStatus({ status: 'error', error: e?.message ?? 'Не удалось сменить канал' })
        } finally {
            setChannelLoading(false)
        }
    }, [api])

    // ── Рендер текущего статуса ──────────────────────────────────────────────

    const renderStatus = () => {
        if (!status) return null

        if (status.status === 'checking') {
            return (
                <div className={styles.statusRow}>
                    <ArrowRotateRight className={styles.iconSpin} />
                    <Text>Проверяем обновления...</Text>
                </div>
            )
        }

        if (status.status === 'not-available') {
            return (
                <div className={styles.statusRow}>
                    <CircleCheck className={styles.iconOk} />
                    <Text>Установлена последняя версия</Text>
                </div>
            )
        }

        if (status.status === 'available') {
            return (
                <div className={styles.statusRow}>
                    <CloudArrowDownIn className={styles.iconInfo} />
                    <Text>
                        Найдена версия <strong>{status.version}</strong> — загрузка началась
                    </Text>
                </div>
            )
        }

        if (status.status === 'downloading') {
            return (
                <div className={styles.progressBlock}>
                    <div className={styles.statusRow}>
                        <CloudArrowDownIn className={styles.iconInfo} />
                        <Text>Загрузка обновления... {Math.round(status.percent ?? 0)}%</Text>
                    </div>
                    <Progress value={Math.round(status.percent ?? 0)} className={styles.progress} />
                </div>
            )
        }

        if (status.status === 'downloaded') {
            return (
                <div className={styles.statusRow}>
                    <CircleCheck className={styles.iconOk} />
                    <Text>
                        Версия <strong>{status.version}</strong> загружена и готова к установке
                    </Text>
                </div>
            )
        }

        if (status.status === 'error') {
            return (
                <div className={styles.statusRow}>
                    <TriangleExclamation className={styles.iconError} />
                    <Text color="danger">Ошибка: {status.error}</Text>
                </div>
            )
        }

        return null
    }

    return (
        <Dialog open={open} onClose={onClose} size="s">
            <Dialog.Header caption="Обновление приложения" />
            <Dialog.Body>
                <div className={styles.body}>
                    {/* Версии */}
                    <div className={styles.versions}>
                        <div className={styles.versionItem}>
                            <Text variant="caption-1" color="secondary">
                                Установлена
                            </Text>
                            <Text variant="subheader-2">{currentVersion}</Text>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    {/* Канал */}
                    <div className={styles.section}>
                        <Text variant="subheader-2">Канал обновлений</Text>
                        <RadioGroup
                            value={channel}
                            onUpdate={handleChannelChange}
                            disabled={channelLoading || checking || status?.status === 'downloading'}
                            options={[
                                { value: 'r', content: CHANNEL_LABELS.r },
                                { value: 'a', content: CHANNEL_LABELS.a },
                            ]}
                        />
                    </div>

                    <div className={styles.divider} />

                    {/* Статус */}
                    <div className={styles.section}>
                        {renderStatus()}
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <div className={styles.footer}>
                    <Button view="normal" size="m" onClick={onClose}>
                        Закрыть
                    </Button>
                    {status?.status === 'downloaded' ? (
                        <Button view="action" size="m" onClick={handleInstall}>
                            Установить и перезапустить
                        </Button>
                    ) : (
                        <Button
                            view="action"
                            size="m"
                            onClick={handleCheck}
                            loading={checking || status?.status === 'downloading'}
                            disabled={status?.status === 'downloading'}
                        >
                            <Button.Icon>
                                <ArrowRotateRight />
                            </Button.Icon>
                            Проверить обновления
                        </Button>
                    )}
                </div>
            </Dialog.Footer>
        </Dialog>
    )
}

export default UpdateModal
