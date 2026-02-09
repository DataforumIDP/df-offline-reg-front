import { useState, useEffect } from 'react'
import {
    Modal,
    Button,
    Text,
    Loader,
    Checkbox,
    TextInput,
} from '@gravity-ui/uikit'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import { fetchExportScans, ExportScansParams } from '@/services/api/participants'
import { saveAs } from 'file-saver'
import styles from './ExportScansModal.module.css'

interface ExportScansModalProps {
    open: boolean
    onClose: () => void
    projectId: number
    projectTitle: string
}

const ExportScansModal = ({ open, onClose, projectId, projectTitle }: ExportScansModalProps) => {
    // Выбранные ключи схемы
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])
    // Выбранные зоны
    const [selectedZones, setSelectedZones] = useState<number[]>([])
    // Временной диапазон (строки в формате YYYY-MM-DD)
    const [dateStart, setDateStart] = useState('')
    const [dateEnd, setDateEnd] = useState('')
    // Фильтры по полям
    const [filters, setFilters] = useState<Record<string, string[]>>({})
    // Включать печати
    const [addPrints, setAddPrints] = useState(true)
    // Состояние загрузки
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Запросы данных
    const { data: schemeData, isLoading: isLoadingScheme } = useSchemeQuery(String(projectId))
    const { data: zones, isLoading: isLoadingZones } = useZonesQuery(projectId)

    // При открытии выбираем все ключи по умолчанию
    useEffect(() => {
        if (schemeData?.fields && selectedKeys.length === 0) {
            setSelectedKeys(schemeData.fields.map((f) => f.key))
        }
    }, [schemeData?.fields])

    // Фильтруемые поля - только list
    const filterableFields =
        schemeData?.fields?.filter((field) => field.config.type === 'list') || []

    const handleKeyToggle = (key: string, checked: boolean) => {
        if (checked) {
            setSelectedKeys((prev) => [...prev, key])
        } else {
            setSelectedKeys((prev) => prev.filter((k) => k !== key))
        }
    }

    const handleZoneToggle = (zoneId: number, checked: boolean) => {
        if (checked) {
            setSelectedZones((prev) => [...prev, zoneId])
        } else {
            setSelectedZones((prev) => prev.filter((id) => id !== zoneId))
        }
    }

    const handleFilterChange = (key: string, values: string[]) => {
        setFilters((prev) => {
            const newFilters = { ...prev }
            if (values.length === 0) {
                delete newFilters[key]
            } else {
                newFilters[key] = values
            }
            return newFilters
        })
    }

    const handleExport = async () => {
        if (selectedKeys.length === 0) {
            setError('Выберите хотя бы одно поле для экспорта')
            return
        }

        setIsExporting(true)
        setError(null)

        try {
            const params: ExportScansParams = {
                keys: selectedKeys,
                addPrints,
            }

            // Зоны (если выбраны конкретные)
            if (selectedZones.length > 0) {
                params.zones = selectedZones
            }

            // Временной диапазон
            if (dateStart || dateEnd) {
                params.timeRange = [
                    dateStart ? new Date(dateStart).toISOString() : new Date(0).toISOString(),
                    dateEnd ? new Date(dateEnd + 'T23:59:59').toISOString() : new Date().toISOString(),
                ]
            }

            // Фильтры
            if (Object.keys(filters).length > 0) {
                params.filter = Object.entries(filters).map(([key, value]) => ({
                    [key]: value,
                }))
            }

            const blob = await fetchExportScans(projectId, params)
            const filename = `scans_${projectTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
            saveAs(blob, filename)
            onClose()
        } catch (err: any) {
            console.error('Export error:', err)
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Ошибка экспорта'
            setError(message)
        } finally {
            setIsExporting(false)
        }
    }

    const handleReset = () => {
        setSelectedKeys(schemeData?.fields?.map((f) => f.key) || [])
        setSelectedZones([])
        setDateStart('')
        setDateEnd('')
        setFilters({})
        setAddPrints(true)
        setError(null)
    }

    const isLoading = isLoadingScheme || isLoadingZones

    return (
        <Modal open={open} onClose={onClose}>
            <div className={styles.modal}>
                <Text variant="header-1" className={styles.title}>
                    Выгрузка статистики сканирований
                </Text>

                {isLoading ? (
                    <div className={styles.loader}>
                        <Loader size="m" />
                    </div>
                ) : (
                    <>
                        {/* Выбор полей схемы */}
                        <div className={styles.section}>
                            <Text variant="subheader-1">Поля для выгрузки</Text>
                            <div className={styles.checkboxGrid}>
                                {schemeData?.fields?.map((field) => (
                                    <Checkbox
                                        key={field.key}
                                        checked={selectedKeys.includes(field.key)}
                                        onUpdate={(checked) =>
                                            handleKeyToggle(field.key, checked)
                                        }
                                    >
                                        {field.label}
                                    </Checkbox>
                                ))}
                            </div>
                        </div>

                        {/* Выбор зон */}
                        {zones && zones.length > 1 && (
                            <div className={styles.section}>
                                <Text variant="subheader-1">
                                    Зоны (пусто = все)
                                </Text>
                                <div className={styles.checkboxGrid}>
                                    {zones.map((zone) => (
                                        <Checkbox
                                            key={zone.id}
                                            checked={selectedZones.includes(zone.id)}
                                            onUpdate={(checked) =>
                                                handleZoneToggle(zone.id, checked)
                                            }
                                        >
                                            {zone.name}
                                        </Checkbox>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Временной диапазон */}
                        <div className={styles.section}>
                            <Text variant="subheader-1">Период (пусто = всё время)</Text>
                            <div className={styles.dateRange}>
                                <TextInput
                                    value={dateStart}
                                    onUpdate={setDateStart}
                                    placeholder="ГГГГ-ММ-ДД"
                                    size="m"
                                />
                                <Text variant="body-1">—</Text>
                                <TextInput
                                    value={dateEnd}
                                    onUpdate={setDateEnd}
                                    placeholder="ГГГГ-ММ-ДД"
                                    size="m"
                                />
                            </div>
                        </div>

                        {/* Фильтры по полям */}
                        {filterableFields.length > 0 && (
                            <div className={styles.section}>
                                <Text variant="subheader-1">Фильтры по полям</Text>
                                <div className={styles.filtersList}>
                                    {filterableFields.map((field) => (
                                        <FilterField
                                            key={field.id}
                                            field={field}
                                            value={filters[field.key] || []}
                                            onChange={(vals) =>
                                                handleFilterChange(field.key, vals)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Опция печатей */}
                        <div className={styles.section}>
                            <Checkbox
                                checked={addPrints}
                                onUpdate={setAddPrints}
                                size="l"
                            >
                                Включить количество печатей бейджей
                            </Checkbox>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <Text variant="body-1" color="danger">
                                    {error}
                                </Text>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button view="flat" size="l" onClick={handleReset}>
                                Сбросить
                            </Button>
                            <Button view="flat" size="l" onClick={onClose}>
                                Отмена
                            </Button>
                            <Button
                                view="action"
                                size="l"
                                onClick={handleExport}
                                loading={isExporting}
                            >
                                Выгрузить
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}

interface FilterFieldProps {
    field: SchemeField
    value: string[]
    onChange: (values: string[]) => void
}

const FilterField = ({ field, value, onChange }: FilterFieldProps) => {
    const { config } = field

    if (config.type !== 'list' || !config.listSettings?.items) {
        return null
    }

    const items = config.listSettings.items

    return (
        <div className={styles.filterField}>
            <Text variant="body-2">{field.label}</Text>
            <div className={styles.checkboxGroup}>
                {items.map((item) => (
                    <Checkbox
                        key={item.value}
                        checked={value.includes(item.value)}
                        onUpdate={(checked) => {
                            if (checked) {
                                onChange([...value, item.value])
                            } else {
                                onChange(value.filter((v) => v !== item.value))
                            }
                        }}
                        size="m"
                    >
                        {item.value}
                    </Checkbox>
                ))}
            </div>
        </div>
    )
}

export default ExportScansModal
