import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    TextInput,
    Text,
    Switch,
    TabProvider,
    TabList,
    Tab,
    TabPanel,
    Loader,
    Popover,
    Tooltip,
    Hotkey,
} from '@gravity-ui/uikit'
import QRCodeStyling from 'qr-code-styling'
import type { Zone } from '@/services/api/zones'
import { useZoneConfigQuery, useZoneScannersQuery } from '@/hooks/queries/useZoneQueries'
import styles from './ZoneEditModal.module.css'

// QR Preview component
const QrPreview = ({ value }: { value: string }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current) {
            return
        }
        ref.current.innerHTML = ''
        const qr = new QRCodeStyling({
            width: 200,
            height: 200,
            type: 'canvas',
            data: value || ' ',
            qrOptions: {
                errorCorrectionLevel: 'M',
            },
            dotsOptions: {
                color: '#000000',
                type: 'square',
            },
            backgroundOptions: {
                color: '#ffffff',
            },
            cornersSquareOptions: {
                color: '#000000',
                type: 'square',
            },
            cornersDotOptions: {
                color: '#000000',
                type: 'square',
            },
        })
        qr.append(ref.current)
    }, [value])

    return <div ref={ref} />
}

interface ZoneEditModalProps {
    open: boolean
    onClose: () => void
    zone: Zone | null
    onSave: (data: { name: string; free: boolean }) => void
    onDelete?: () => void
    isLoading?: boolean
    isCreate?: boolean
}

const ZoneEditModal = ({
    open,
    onClose,
    zone,
    onSave,
    onDelete,
    isLoading,
    isCreate = false,
}: ZoneEditModalProps) => {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('edit')
    const [name, setName] = useState('')
    const [free, setFree] = useState(true)

    // Fetch zone config for QR
    const isDevicesTabActive = open && !!zone && activeTab === 'devices'
    const { data: config, isLoading: configLoading } = useZoneConfigQuery(
        zone?.id,
        isDevicesTabActive,
    )

    // Fetch zone scanners
    const { data: scanners, isLoading: scannersLoading } = useZoneScannersQuery(
        zone?.id,
        isDevicesTabActive,
    )

    useEffect(() => {
        if (open) {
            setActiveTab('edit')
            if (zone) {
                setName(zone.name)
                setFree(zone.free)
            } else {
                setName('')
                setFree(true)
            }
        }
    }, [open, zone])

    // Hotkey handler for tab switching
    const handleTabHotkey = useCallback(
        (e: KeyboardEvent) => {
            if (!open || isCreate) {
                return
            }
            if (e.ctrlKey && (e.code === 'KeyE' || (e as any).keyCode === 69)) {
                e.preventDefault()
                setActiveTab('edit')
            } else if (e.ctrlKey && (e.code === 'KeyD' || (e as any).keyCode === 68)) {
                e.preventDefault()
                setActiveTab('devices')
                // Инвалидируем кеш сканеров при переключении на вкладку устройств
                if (zone?.id) {
                    queryClient.invalidateQueries({ queryKey: ['zoneScanners', zone.id] })
                }
            }
        },
        [open, isCreate, zone?.id, queryClient],
    )

    useEffect(() => {
        window.addEventListener('keydown', handleTabHotkey)
        return () => window.removeEventListener('keydown', handleTabHotkey)
    }, [handleTabHotkey])

    const handleSave = () => {
        if (!name.trim()) {
            return
        }
        onSave({ name: name.trim(), free })
    }

    const qrValue = config ? `config_${JSON.stringify(config)}` : ''

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) {
            return 'Нет данных'
        }
        return new Date(dateStr).toLocaleString('ru-RU')
    }

    return (
        <Dialog open={open} onClose={onClose} onEnterKeyDown={handleSave}>
            <Dialog.Header caption={isCreate ? 'Создать зону' : 'Редактировать зону'} />
            <Dialog.Body>
                {isCreate ? (
                    // Create mode - no tabs
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <Text variant="body-2">Название зоны</Text>
                            <TextInput
                                value={name}
                                onUpdate={setName}
                                placeholder="Например: VIP-ложа"
                                autoFocus
                                size="l"
                            />
                        </div>

                        <div className={styles.field}>
                            <div className={styles.switchRow}>
                                <div>
                                    <Popover content="Если включено, доступ в зону имеют все участники">
                                        <Text variant="body-2">Свободный вход</Text>
                                    </Popover>
                                </div>
                                <Switch checked={free} onUpdate={setFree} size="l" />
                            </div>
                        </div>
                    </div>
                ) : (
                    // Edit mode - with tabs
                    <TabProvider value={activeTab} onUpdate={setActiveTab}>
                        <TabList>
                            <Tooltip
                                content={<Hotkey view="dark" value="ctrl+e" />}
                                placement="top"
                            >
                                <Tab value="edit">Редактирование</Tab>
                            </Tooltip>
                            <Tooltip
                                content={<Hotkey view="dark" value="ctrl+d" />}
                                placement="top"
                            >
                                <Tab value="devices">Устройства</Tab>
                            </Tooltip>
                        </TabList>

                        <TabPanel value="edit">
                            <div className={styles.form} style={{ marginTop: 16 }}>
                                <div className={styles.field}>
                                    <Text variant="body-2">Название зоны</Text>
                                    <TextInput
                                        value={name}
                                        onUpdate={setName}
                                        placeholder="Например: VIP-ложа"
                                        autoFocus
                                        size="l"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <div className={styles.switchRow}>
                                        <div>
                                            <Popover
                                                placement="bottom-start"
                                                content="Если включено, доступ в зону имеют все участники"
                                            >
                                                <Text variant="body-2">Свободный вход</Text>
                                            </Popover>
                                        </div>
                                        <Switch checked={free} onUpdate={setFree} size="l" />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel value="devices">
                            <div className={styles.devicesTab} style={{ marginTop: 16 }}>
                                {/* QR Section */}
                                <div className={styles.qrSection}>
                                    {configLoading ? (
                                        <Loader size="m" />
                                    ) : config ? (
                                        <>
                                            <QrPreview value={qrValue} />
                                            <Text variant="caption-2" className={styles.qrCaption}>
                                                Отсканируйте для подключения устройства
                                            </Text>
                                        </>
                                    ) : (
                                        <Text variant="body-1" color="secondary">
                                            Не удалось загрузить конфиг
                                        </Text>
                                    )}
                                </div>

                                {/* Scanners List */}
                                <div className={styles.scannersList}>
                                    <Text variant="subheader-2" className={styles.scannersHeader}>
                                        Подключенные устройства
                                    </Text>

                                    {scannersLoading ? (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                padding: 24,
                                            }}
                                        >
                                            <Loader size="m" />
                                        </div>
                                    ) : scanners && scanners.length > 0 ? (
                                        scanners.map((scanner) => (
                                            <div key={scanner.id} className={styles.scannerItem}>
                                                <div className={styles.scannerName}>
                                                    <span className={styles.scannerNameRow}>
                                                        <span
                                                            className={styles.statusDot}
                                                            style={{
                                                                backgroundColor:
                                                                    scanner.isCurrentZone
                                                                        ? 'var(--g-color-text-positive)'
                                                                        : 'var(--g-color-text-secondary)',
                                                            }}
                                                            title={
                                                                scanner.isCurrentZone
                                                                    ? 'Прикреплен к этой зоне'
                                                                    : 'Работал в этой зоне'
                                                            }
                                                        />
                                                        {scanner.name || scanner.scannerId}
                                                    </span>
                                                    <span>
                                                        Активность: {formatDate(scanner.lastSeenAt)}
                                                    </span>
                                                </div>
                                                <div className={styles.scannerLogs}>
                                                    {scanner.logsCount}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <Text variant="body-1" color="secondary">
                                                Нет подключенных устройств
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabPanel>
                    </TabProvider>
                )}
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                onClickButtonApply={handleSave}
                textButtonApply={isCreate ? 'Создать' : 'Сохранить'}
                textButtonCancel="Отмена"
                loading={isLoading}
                renderButtons={(buttonApply, buttonCancel) => (
                    <div className={styles.footer}>
                        {!isCreate && onDelete && (
                            <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={onDelete}
                            >
                                Удалить зону
                            </button>
                        )}
                        <div className={styles.mainButtons}>
                            {buttonCancel}
                            {buttonApply}
                        </div>
                    </div>
                )}
            />
        </Dialog>
    )
}

export default ZoneEditModal
