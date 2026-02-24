import { useState, useEffect, useCallback } from 'react'
import { Text, TextInput, Button, RadioGroup, Alert } from '@gravity-ui/uikit'
import styles from './PrintSettings.module.css'
import {
    loadPrintSettings,
    savePrintSettings,
    checkPrintServer,
    type PrintMode,
    type PrintSettingsData,
} from './printSettingsUtils'

interface PrintSettingsProps {
    onSave?: (settings: PrintSettingsData) => void
}

export const PrintSettings = ({ onSave }: PrintSettingsProps) => {
    const [settings, setSettings] = useState<PrintSettingsData>(loadPrintSettings)
    const [serverStatus, setServerStatus] = useState<'unknown' | 'ok' | 'error'>('unknown')
    const [checking, setChecking] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleModeChange = (mode: string) => {
        setSettings((prev) => ({ ...prev, mode: mode as PrintMode }))
        setServerStatus('unknown')
    }

    const handleAddressChange = (value: string) => {
        setSettings((prev) => ({
            ...prev,
            server: { ...prev.server, address: value },
        }))
        setServerStatus('unknown')
    }

    const handlePortChange = (value: string) => {
        const port = parseInt(value) || 4400
        setSettings((prev) => ({
            ...prev,
            server: { ...prev.server, port },
        }))
        setServerStatus('unknown')
    }

    const handleCheckServer = useCallback(async () => {
        setChecking(true)
        try {
            const isOk = await checkPrintServer(settings.server.address, settings.server.port)
            setServerStatus(isOk ? 'ok' : 'error')
        } catch {
            setServerStatus('error')
        } finally {
            setChecking(false)
        }
    }, [settings.server.address, settings.server.port])

    // Автопроверка при переключении на server mode
    useEffect(() => {
        if (settings.mode === 'server') {
            handleCheckServer()
        }
    }, [settings.mode])

    const handleSave = () => {
        savePrintSettings(settings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSave?.(settings)
    }

    return (
        <div className={styles.container}>
            {/* Режим печати */}
            <div className={styles.section}>
                <Text variant="subheader-2" className={styles.sectionTitle}>
                    Режим печати
                </Text>
                <RadioGroup
                    value={settings.mode}
                    onUpdate={handleModeChange}
                    options={[
                        { value: 'web', content: 'WEB — открывать PDF в браузере' },
                        { value: 'server', content: 'Сервер — отправлять на REGA Print' },
                    ]}
                    direction="vertical"
                    size="l"
                />
            </div>

            {/* Настройки сервера (только для server mode) */}
            {settings.mode === 'server' && (
                <div className={styles.serverFields}>
                    <Text variant="subheader-2" className={styles.sectionTitle}>
                        Настройки сервера печати
                    </Text>

                    <div className={styles.fieldGroup}>
                        <Text variant="body-2" color="secondary">
                            Адрес сервера
                        </Text>
                        <TextInput
                            value={settings.server.address}
                            onUpdate={handleAddressChange}
                            placeholder="localhost"
                            size="l"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <Text variant="body-2" color="secondary">
                            Порт
                        </Text>
                        <TextInput
                            value={String(settings.server.port)}
                            onUpdate={handlePortChange}
                            placeholder="4400"
                            type="number"
                            size="l"
                        />
                    </div>

                    <div className={styles.statusRow}>
                        <span
                            className={`${styles.statusDot} ${
                                serverStatus === 'ok'
                                    ? styles['statusDot--ok']
                                    : serverStatus === 'error'
                                      ? styles['statusDot--error']
                                      : ''
                            }`}
                        />
                        <Text variant="body-2" color="secondary">
                            {serverStatus === 'ok'
                                ? 'Сервер доступен'
                                : serverStatus === 'error'
                                  ? 'Сервер недоступен'
                                  : 'Не проверено'}
                        </Text>
                        <Button
                            view="flat"
                            size="s"
                            onClick={handleCheckServer}
                            loading={checking}
                            style={{ marginLeft: 8 }}
                        >
                            Проверить
                        </Button>
                    </div>
                </div>
            )}

            {/* Кнопка сохранения */}
            <Button view="action" size="l" onClick={handleSave}>
                Сохранить настройки
            </Button>

            {saved && <Alert theme="success" message="Настройки печати сохранены" />}
        </div>
    )
}
