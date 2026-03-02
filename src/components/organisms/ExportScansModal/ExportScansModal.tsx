import { useState, useEffect, useMemo, useRef } from 'react'
import {
    Modal,
    Button,
    Text,
    Loader,
    Checkbox,
    Select,
    type SelectOption,
    TextInput,
    TabProvider,
    TabList,
    Tab,
    TabPanel,
} from '@gravity-ui/uikit'
import { Xmark, FileArrowUp } from '@gravity-ui/icons'
import { Dayjs } from 'dayjs'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import { DateTimePicker } from '@/components/atoms'
import { useExcelUpload } from './useExcelUpload'
import { useExportScans } from './useExportScans'
import styles from './ExportScansModal.module.css'

interface ExportScansModalProps {
    open: boolean
    onClose: () => void
    projectId: number
    projectTitle: string
}

const ExportScansModal = ({ open, onClose, projectId, projectTitle }: ExportScansModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Активный таб
    const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual')
    
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

    // Хуки для логики
    const excelUpload = useExcelUpload()
    const exportScans = useExportScans(onClose)

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            excelUpload.handleExcelUpload(file)
        }
        // Сбрасываем input для повторной загрузки того же файла
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleManualExport = () => {
        exportScans.handleManualExport({
            projectId,
            projectTitle,
            selectedKeys,
            selectedZones,
            dateStart,
            dateEnd,
            filters,
            addPrints,
        })
    }

    const handleExcelExport = () => {
        exportScans.handleExcelExport(
            projectId,
            projectTitle,
            excelUpload.excelRows,
            selectedKeys,
            addPrints,
            excelUpload.allRowsValid
        )
    }

    const handleReset = () => {
        setSelectedKeys(schemeData?.fields?.map((f) => f.key) || [])
        setSelectedZones([])
        setDateStart(null)
        setDateEnd(null)
        setFilters({})
        setAddPrints(true)
        exportScans.setError(null)
        excelUpload.reset()
        setActiveTab('manual')
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value as 'manual' | 'excel')
    }

    const isLoading = isLoadingScheme || isLoadingZones
    const error = exportScans.error || excelUpload.error

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
                        {/* Табы */}
                        <TabProvider value={activeTab} onUpdate={handleTabChange}>
                            <div className={styles.tabs}>
                                <TabList>
                                    <Tab value="manual">Ручная настройка</Tab>
                                    <Tab value="excel">Excel</Tab>
                                </TabList>
                            </div>

                            <TabPanel value="manual">
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
                                </div>
                            </TabPanel>

                            <TabPanel value="excel">
                                <div className={styles.content}>
                                    {!excelUpload.showPreview ? (
                                        <>
                                            <div className={styles.section}>
                                                <Text variant="subheader-1">
                                                    Загрузите Excel файл
                                                </Text>
                                                <Text variant="body-2" color="secondary">
                                                    Файл должен содержать колонки: Дата, Время, Зал,
                                                    Название
                                                </Text>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".xlsx,.xls"
                                                    onChange={handleFileSelect}
                                                    style={{ display: 'none' }}
                                                />
                                                <Button 
                                                    view="outlined" 
                                                    size="l"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    style={{ marginTop: 12 }}
                                                >
                                                    <Button.Icon>
                                                        <FileArrowUp />
                                                    </Button.Icon>
                                                    Выбрать файл
                                                </Button>
                                            </div>

                                            <div className={styles.section}>
                                                <Text variant="subheader-1">
                                                    Поля для выгрузки
                                                </Text>
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

                                            <div className={styles.section}>
                                                <Checkbox
                                                    checked={addPrints}
                                                    onUpdate={setAddPrints}
                                                    size="l"
                                                >
                                                    Включить количество печатей
                                                </Checkbox>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.section}>
                                                <Text variant="subheader-1">
                                                    Предпросмотр данных
                                                </Text>
                                                <Text variant="body-2" color="secondary">
                                                    Проверьте данные и при необходимости отредактируйте
                                                    названия листов
                                                </Text>
                                                <div className={styles.tableContainer}>
                                                    {excelUpload.excelRows.map((row, index) => (
                                                        <div
                                                            key={index}
                                                            className={`${styles.previewRow} ${
                                                                !row.isValid
                                                                    ? styles.invalidRow
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className={styles.previewField}>
                                                                <Text
                                                                    variant="caption-2"
                                                                    color="secondary"
                                                                >
                                                                    Дата
                                                                </Text>
                                                                <Text variant="body-1">
                                                                    {row.date}
                                                                </Text>
                                                            </div>
                                                            <div className={styles.previewField}>
                                                                <Text
                                                                    variant="caption-2"
                                                                    color="secondary"
                                                                >
                                                                    Время
                                                                </Text>
                                                                <Text variant="body-1">
                                                                    {row.time}
                                                                </Text>
                                                            </div>
                                                            <div className={styles.previewField}>
                                                                <Text
                                                                    variant="caption-2"
                                                                    color="secondary"
                                                                >
                                                                    Зал
                                                                </Text>
                                                                <Text variant="body-1">
                                                                    {row.zone}
                                                                </Text>
                                                            </div>
                                                            <div className={styles.previewField}>
                                                                <Text
                                                                    variant="caption-2"
                                                                    color="secondary"
                                                                >
                                                                    Название листа
                                                                </Text>
                                                                <TextInput
                                                                    value={row.title}
                                                                    onUpdate={(val) =>
                                                                        excelUpload.handleTitleChange(index, val)
                                                                    }
                                                                    validationState={
                                                                        row.isValid
                                                                            ? undefined
                                                                            : 'invalid'
                                                                    }
                                                                    errorMessage={row.error}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    view="flat"
                                                    onClick={() => excelUpload.setShowPreview(false)}
                                                >
                                                    Загрузить другой файл
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TabPanel>
                        </TabProvider>

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
                            {activeTab === 'manual' ? (
                                <Button
                                    view="action"
                                    size="l"
                                    onClick={handleManualExport}
                                    loading={exportScans.isExporting}
                                >
                                    Выгрузить
                                </Button>
                            ) : (
                                <Button
                                    view="action"
                                    size="l"
                                    onClick={handleExcelExport}
                                    loading={exportScans.isExporting}
                                    disabled={!excelUpload.showPreview || !excelUpload.allRowsValid}
                                >
                                    Скачать
                                </Button>
                            )}
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
