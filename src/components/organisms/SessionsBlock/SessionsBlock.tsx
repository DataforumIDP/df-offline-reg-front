import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Text, Button, Spin, Label, Modal, Icon } from '@gravity-ui/uikit'
import { TrashBin, QrCode } from '@gravity-ui/icons'
import {
    fetchSessions,
    terminateSession,
    terminateAllOtherSessions,
    confirmQrAuth,
    type Session,
} from '@/services/api/sessions'
import { QrScanner } from './QrScanner'
import styles from './SessionsBlock.module.css'
import { formatDateTime } from '@/utils/helpers'

export const SessionsBlock = () => {
    const queryClient = useQueryClient()
    const [qrModalOpen, setQrModalOpen] = useState(false)

    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: fetchSessions,
    })

    // Убеждаемся, что sessions всегда массив
    const sessions = Array.isArray(sessionsData) ? sessionsData : []

    const terminateMutation = useMutation({
        mutationFn: terminateSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    const terminateAllMutation = useMutation({
        mutationFn: terminateAllOtherSessions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    const confirmQrMutation = useMutation({
        mutationFn: confirmQrAuth,
        onSuccess: () => {
            setQrModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
        },
    })

    const handleTerminate = (id: number) => {
        terminateMutation.mutate(id)
    }

    const handleTerminateAll = () => {
        terminateAllMutation.mutate()
    }

    const handleQrScan = (code: string) => {
        confirmQrMutation.mutate(code)
    }

    const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

    if (isLoading) {
        return (
            <div className={styles.container}>
                <Spin size="m" />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.actions}>
                <Button view="outlined" size="m" onClick={() => setQrModalOpen(true)}>
                    <Icon data={QrCode} />
                    Сканировать QR
                </Button>

                {otherSessionsCount > 0 && (
                    <Button
                        view="outlined-danger"
                        size="m"
                        className={styles.terminateAllBtn}
                        onClick={handleTerminateAll}
                        loading={terminateAllMutation.isPending}
                    >
                        Завершить все другие ({otherSessionsCount})
                    </Button>
                )}
            </div>

            {sessions.length === 0 ? (
                <div className={styles.emptyState}>
                    <Text variant="body-2" color="secondary">
                        Нет активных сессий
                    </Text>
                </div>
            ) : (
                <div className={styles.sessionsList}>
                    {sessions.map((session: Session) => (
                        <div
                            key={session.id}
                            className={`${styles.sessionItem} ${session.isCurrent ? styles.current : ''}`}
                        >
                            <div className={styles.sessionInfo}>
                                <div className={styles.sessionHeader}>
                                    <Text variant="subheader-2">{session.deviceName}</Text>
                                    {session.isCurrent && (
                                        <Label theme="success" size="s">
                                            Текущая
                                        </Label>
                                    )}
                                </div>
                                <div className={styles.sessionDetails}>
                                    {session.ipAddress && (
                                        <Text variant="body-1" color="secondary">
                                            IP: {session.ipAddress}
                                        </Text>
                                    )}
                                    <Text variant="body-1" color="secondary">
                                        Последняя активность: {formatDateTime(session.lastActivity)}
                                    </Text>
                                </div>
                            </div>
                            {!session.isCurrent && (
                                <Button
                                    view="flat-danger"
                                    size="s"
                                    onClick={() => handleTerminate(session.id)}
                                    loading={terminateMutation.isPending}
                                >
                                    <TrashBin />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)}>
                <QrScanner
                    onScan={handleQrScan}
                    onClose={() => setQrModalOpen(false)}
                    isLoading={confirmQrMutation.isPending}
                    error={confirmQrMutation.error?.message}
                />
            </Modal>
        </div>
    )
}
