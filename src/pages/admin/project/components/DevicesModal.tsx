import { useMemo } from 'react'
import { Dialog, Text, Loader, Card, Label } from '@gravity-ui/uikit'
import { useProjectDevicesQuery } from '@/hooks/queries/useProjectQueries'
import type { Device } from '@/services/api/projects'
import './DevicesModal.css'

interface DevicesModalProps {
    open: boolean
    onClose: () => void
    projectId: number | undefined
}

const formatLastSeen = (dateStr: string | null): string => {
    if (!dateStr) return 'Нет данных'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} ч. назад`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays} дн. назад`
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const DeviceCard = ({ device }: { device: Device }) => {
    const displayName = device.name || device.scannerId

    return (
        <Card className="device-card">
            <div className="device-card-header">
                <Text variant="subheader-2" ellipsis title={displayName}>
                    {displayName}
                </Text>
                <Label
                    theme={device.isCheckedOut ? 'success' : 'normal'}
                    size="xs"
                >
                    {device.isCheckedOut ? 'Выдан' : 'Сдан'}
                </Label>
            </div>
            <div className="device-card-body">
                <div className="device-card-row">
                    <Text variant="caption-2" color="secondary">Зона:</Text>
                    <Text variant="body-1">{device.zoneName}</Text>
                </div>
                <div className="device-card-row">
                    <Text variant="caption-2" color="secondary">Активность:</Text>
                    <Text variant="body-1">{formatLastSeen(device.lastSeenAt)}</Text>
                </div>
            </div>
        </Card>
    )
}

const DevicesModal = ({ open, onClose, projectId }: DevicesModalProps) => {
    const { data: devices, isLoading } = useProjectDevicesQuery(projectId, open)

    // Группировка по зонам
    const groupedByZone = useMemo(() => {
        if (!devices) return {}
        return devices.reduce((acc: Record<string, Device[]>, device) => {
            const zoneName = device.zoneName || 'Без зоны'
            if (!acc[zoneName]) {
                acc[zoneName] = []
            }
            acc[zoneName].push(device)
            return acc
        }, {})
    }, [devices])

    const zoneNames = Object.keys(groupedByZone).sort()

    // Статистика
    const stats = useMemo(() => {
        if (!devices) return { total: 0, checkedOut: 0, checkedIn: 0 }
        return {
            total: devices.length,
            checkedOut: devices.filter(d => d.isCheckedOut).length,
            checkedIn: devices.filter(d => !d.isCheckedOut).length,
        }
    }, [devices])

    return (
        <Dialog open={open} onClose={onClose} size="l">
            <Dialog.Header caption="Устройства проекта" />
            <Dialog.Body>
                {isLoading ? (
                    <div className="devices-loading">
                        <Loader size="l" />
                    </div>
                ) : !devices || devices.length === 0 ? (
                    <div className="devices-empty">
                        <Text color="secondary">Нет подключённых устройств</Text>
                    </div>
                ) : (
                    <>
                        {/* Статистика */}
                        <div className="devices-stats">
                            <div className="devices-stat">
                                <Text variant="display-1">{stats.total}</Text>
                                <Text variant="caption-2" color="secondary">всего</Text>
                            </div>
                            <div className="devices-stat">
                                <Text variant="display-1" color="positive">{stats.checkedOut}</Text>
                                <Text variant="caption-2" color="secondary">выдано</Text>
                            </div>
                            <div className="devices-stat">
                                <Text variant="display-1" color="secondary">{stats.checkedIn}</Text>
                                <Text variant="caption-2" color="secondary">сдано</Text>
                            </div>
                        </div>

                        {/* Карточки устройств по зонам */}
                        {zoneNames.map(zoneName => (
                            <div key={zoneName} className="devices-zone-section">
                                <Text variant="subheader-3" className="devices-zone-title">
                                    {zoneName}
                                </Text>
                                <div className="devices-grid">
                                    {groupedByZone[zoneName].map(device => (
                                        <DeviceCard key={device.id} device={device} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                textButtonCancel="Закрыть"
            />
        </Dialog>
    )
}

export default DevicesModal
