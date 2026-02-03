import { useState, useEffect, useRef } from 'react'
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
} from '@gravity-ui/uikit'
import QRCodeStyling from 'qr-code-styling'
import { useQuery } from '@tanstack/react-query'
import type { Zone } from '@/services/api/zones'
import { fetchZoneConfig, fetchZoneScanners, type ZoneConfig, type ZoneScanner } from '@/services/api/zones'
import styles from './ZoneEditModal.module.css'

// QR Preview component
const QrPreview = ({ value }: { value: string }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
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
  const [activeTab, setActiveTab] = useState('edit')
  const [name, setName] = useState('')
  const [free, setFree] = useState(true)

  // Fetch zone config for QR
  const { data: config, isLoading: configLoading } = useQuery<ZoneConfig>({
    queryKey: ['zoneConfig', zone?.id],
    queryFn: () => fetchZoneConfig(zone!.id),
    enabled: open && !!zone && activeTab === 'devices',
  })

  // Fetch zone scanners
  const { data: scanners, isLoading: scannersLoading } = useQuery<ZoneScanner[]>({
    queryKey: ['zoneScanners', zone?.id],
    queryFn: () => fetchZoneScanners(zone!.id),
    enabled: open && !!zone && activeTab === 'devices',
  })

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

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), free })
  }

  const qrValue = config ? `config_${JSON.stringify(config)}` : ''

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Нет данных'
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
                  <Text variant="body-2">Свободный вход</Text>
                  <Text variant="caption-1" color="secondary">
                    Если включено, доступ в зону имеют все участники
                  </Text>
                </div>
                <Switch checked={free} onUpdate={setFree} size="l" />
              </div>
            </div>
          </div>
        ) : (
          // Edit mode - with tabs
          <TabProvider value={activeTab} onUpdate={setActiveTab}>
            <TabList>
              <Tab value="edit">Редактирование</Tab>
              <Tab value="devices">Устройства</Tab>
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
                      <Text variant="body-2">Свободный вход</Text>
                      <Text variant="caption-1" color="secondary">
                        Если включено, доступ в зону имеют все участники
                      </Text>
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
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                      <Loader size="m" />
                    </div>
                  ) : scanners && scanners.length > 0 ? (
                    scanners.map((scanner) => (
                      <div key={scanner.id} className={styles.scannerItem}>
                        <div className={styles.scannerName}>
                          <span>{scanner.name || scanner.scannerId}</span>
                          <span>Активность: {formatDate(scanner.lastSeenAt)}</span>
                        </div>
                        <div className={styles.scannerLogs}>{scanner.logsCount}</div>
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
              <button type="button" className={styles.deleteButton} onClick={onDelete}>
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
