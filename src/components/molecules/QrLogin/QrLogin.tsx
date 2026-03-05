import { Text, Spin, Alert } from '@gravity-ui/uikit'
import { useQrAuth } from '@/hooks/useQrAuth'
import { useQrCodeRenderer } from '@/hooks/useQrCodeRenderer'
import { useCountdown } from '@/hooks/useCountdown'
import { getActiveServerUrl } from '@/services/serverStorage'
import styles from './QrLogin.module.css'

export const QrLogin = () => {
    const { code, ttl, status, error, retry } = useQrAuth(getActiveServerUrl())
    const qrRef = useQrCodeRenderer(code ? `REGA_AUTH:${code}` : null)
    const { formatted: timeFormatted } = useCountdown(ttl)

    return (
        <div className={styles.container}>
            <Text variant="subheader-2" className={styles.title}>
                Вход по QR-коду
            </Text>
            <Text variant="body-2" color="secondary" className={styles.description}>
                Отсканируйте QR-код с авторизованного устройства
            </Text>

            <div className={styles.qrContainer}>
                {status === 'connecting' && (
                    <div className={styles.loading}>
                        <Spin size="l" />
                        <Text variant="body-2" color="secondary">
                            Подключение...
                        </Text>
                    </div>
                )}

                {status === 'waiting' && code && (
                    <>
                        <div ref={qrRef} className={styles.qrCode} />
                        <Text variant="body-2" color="secondary">
                            Код действителен: {timeFormatted}
                        </Text>
                    </>
                )}

                {status === 'expired' && (
                    <div className={styles.expired}>
                        <Text variant="body-2" color="secondary">
                            Код истёк
                        </Text>
                        <button onClick={retry} className={styles.retryLink}>
                            Получить новый код
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <Alert
                        theme="danger"
                        message={error || 'Ошибка подключения'}
                        actions={
                            <button onClick={retry} className={styles.retryLink}>
                                Повторить
                            </button>
                        }
                    />
                )}
            </div>
        </div>
    )
}
