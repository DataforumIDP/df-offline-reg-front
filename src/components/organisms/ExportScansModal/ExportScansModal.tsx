import { useState, useEffect, useMemo } from 'react'
import {
    Modal,
    Button,
    Text,
    Loader,
    Checkbox,
    Select,
    type SelectOption,
} from '@gravity-ui/uikit'
import { Xmark } from '@gravity-ui/icons'
import { Dayjs } from 'dayjs'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import { fetchExportScans, ExportScansParams } from '@/services/api/participants'
import { DateTimePicker } from '@/components/atoms'
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
    const [selectedZones, setSelectedZones] = useState<string[]>([])
    // Временной диапазон
    const [dateStart, setDateStart] = useState<Dayjs | null>(null)
    const [dateEnd, setDateEnd] = useState<Dayjs | null>(null)
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

    // Опции для селекта полей
    const fieldOptions: SelectOption[] = useMemo(() => {
        return schemeData?.fields?.map((f) => ({
            value: f.key,
            content: f.label,
        })) || []
    }, [schemeData?.fields])

    // Опции для селекта зон
    const zoneOptions: SelectOption[] = useMemo(() => {
        return zones?.map((z) => ({
            value: String(z.id),
            content: z.name,
        })) || []
    }, [zones])

    // Фильтруемые поля - только list
    const filterableFields = useMemo(() => {
        return schemeData?.fields?.filter((field) => field.config.type === 'list') || []
    }, [schemeData?.fields])

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
                params.zones = selectedZones.map(Number)
            }

            // Временной диапазон
            if (dateStart || dateEnd) {
                params.timeRange = [
                    dateStart ? dateStart.toISOString() : new Date(0).toISOString(),
                    dateEnd ? dateEnd.toISOString() : new Date().toISOString(),
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
        setDateStart(null)
        setDateEnd(null)
        setFilters({})
        setAddPrints(true)
        setError(null)
    }

    const isLoading = isLoadingScheme || isLoadingZones

    return (
        <Modal open={open} onClose={onClose}>
            <div className={styles.modal}>
                {/* Шапка */}
                <div className={styles.header}>
                    <Text variant="header-1">Выгрузка статистики</Text>
                    <Button view="flat" size="m" onClick={onClose}>
                        <Button.Icon>
                            <Xmark />
                        </Button.Icon>
                    </Button>
                </div>

                {isLoading ? (
                    <div className={styles.loader}>
                        <Loader size="m" />
                    </div>
                ) : (
                    <>
                        <div className={styles.content}>
                            {/* Выбор полей схемы */}
                            <div className={styles.section}>
                                <Text variant="subheader-1">Поля для выгрузки</Text>
                                <Select
                                    multiple
                                    filterable
                                    value={selectedKeys}
                                    onUpdate={setSelectedKeys}
                                    options={fieldOptions}
                                    placeholder="Выберите поля"
                                    width="max"
                                />
                            </div>

                            {/* Выбор зон */}
                            {zones && zones.length > 1 && (
                                <div className={styles.section}>
                                    <Text variant="subheader-1">Зоны</Text>
                                    <Select
                                        multiple
                                        value={selectedZones}
                                        onUpdate={setSelectedZones}
                                        options={zoneOptions}
                                        placeholder="Все зоны"
                                        width="max"
                                    />
                                </div>
                            )}

                            {/* Временной диапазон */}
                            <div className={styles.section}>
                                <Text variant="subheader-1">Период</Text>
                                <div className={styles.dateRange}>
                                    <DateTimePicker
                                        value={dateStart}
                                        onChange={setDateStart}
                                        placeholder="Начало периода"
                                        maxDateTime={dateEnd || undefined}
                                    />
                                    <DateTimePicker
                                        value={dateEnd}
                                        onChange={setDateEnd}
                                        placeholder="Конец периода"
                                        minDateTime={dateStart || undefined}
                                    />
                                </div>
                            </div>

                            {/* Фильтры по полям */}
                            {filterableFields.length > 0 && (
                                <div className={styles.section}>
                                    <Text variant="subheader-1">Фильтры</Text>
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
                                    Включить количество печатей
                                </Checkbox>
                            </div>

                            {error && (
                                <div className={styles.error}>
                                    <Text variant="body-1" color="danger">
                                        {error}
                                    </Text>
                                </div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <Button view="flat" size="l" onClick={handleReset}>
                                Сбросить
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

    const options: SelectOption[] = config.listSettings.items.map((item) => ({
        value: item.value,
        content: item.value,
    }))

    return (
        <div className={styles.filterField}>
            <Text variant="body-2" color="secondary">{field.label}</Text>
            <Select
                multiple
                value={value}
                onUpdate={onChange}
                options={options}
                placeholder="Все значения"
                width="max"
            />
        </div>
    )
}

export default ExportScansModal
