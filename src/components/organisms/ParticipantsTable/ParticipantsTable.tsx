import {
    Table,
    withTableSelection,
    withTableSorting,
    withTableSettings,
    Checkbox,
    Tooltip,
    Pagination,
    Select,
} from '@gravity-ui/uikit'
import type { TableColumnConfig, TableDataItem, TableSettingsData } from '@gravity-ui/uikit'
import { useMemo, useCallback, useState, useEffect } from 'react'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import type { Participant } from '@/services/api/participants'
import { ColumnFilter } from '@/components/molecules'
import { getMiniUrl } from '@/services/api/files'
import { formatPhone } from '@/utils/phoneUtils'
import styles from './ParticipantsTable.module.css'

// Тип для фильтров
export type FiltersState = Record<string, string | string[] | undefined>

// Композиция HOC
const SelectableTable = withTableSelection(Table)
const SortableSelectableTable = withTableSorting(SelectableTable)
const SettingsTable = withTableSettings(SortableSelectableTable)

export interface ParticipantsTableProps {
    participants: Participant[]
    scheme: SchemeField[]
    projectId: string
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
    onRowClick: (participant: Participant) => void
    sortColumn: string
    sortDirection: 'ASC' | 'DESC'
    onSortChange: (column: string, direction: 'ASC' | 'DESC') => void
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    totalRecords: number
    recordsPerPage: number
    onRecordsPerPageChange: (n: number) => void
    filters: FiltersState
    onFiltersChange: (filters: FiltersState) => void
    colorRow?: boolean // Красить всю строку по цвету типа
}

// Ключ для localStorage
const getStorageKey = (projectId: string) => `participants-columns-${projectId}`

// Ячейка с текстом и Tooltip
const TextCell = ({ value }: { value: string }) => {
    const displayValue = String(value ?? '')
    const needsTooltip = displayValue.length > 20

    const content = (
        <div
            style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                cursor: 'default',
            }}
        >
            {displayValue}
        </div>
    )

    if (needsTooltip) {
        return (
            <Tooltip content={displayValue} placement="top">
                {content}
            </Tooltip>
        )
    }

    return content
}

// Ячейка с изображением (показываем мини-версию для экономии трафика)
const ImageCell = ({ value }: { value: string }) => {
    if (!value) {
        return <span>—</span>
    }

    // Используем мини-версию для таблицы
    const miniSrc = getMiniUrl(value)

    return (
        <img
            src={miniSrc}
            alt=""
            style={{ maxWidth: '50px', maxHeight: '50px', objectFit: 'cover', borderRadius: '4px' }}
            // Fallback на оригинал если мини нет
            onError={(e) => {
                e.currentTarget.src = value
            }}
        />
    )
}

// Ячейка с чекбоксом
const BoolCell = ({ value }: { value: boolean }) => {
    return <Checkbox checked={!!value} disabled size="l" />
}

// Ячейка со списком (без мультивыбора - окрашиваем фон)
const ListCell = ({
    value,
    items,
}: {
    value: string
    items: Array<{ value: string; color?: string }>
}) => {
    const item = items.find((i) => i.value === value)
    const bgColor = item?.color

    return (
        <div
            style={{
                backgroundColor: bgColor || 'transparent',
                padding: '4px 8px',
                borderRadius: '4px',
                color: bgColor ? '#fff' : 'inherit',
                textShadow: bgColor ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
        >
            <TextCell value={value} />
        </div>
    )
}

// Ячейка с мультивыбором
const MultiListCell = ({ value }: { value: string[] }) => {
    const displayValue = Array.isArray(value) ? value.join('; ') : String(value ?? '')
    return <TextCell value={displayValue} />
}

export const ParticipantsTable = ({
    participants,
    scheme,
    projectId,
    selectedIds,
    onSelectionChange,
    onRowClick,
    sortColumn,
    sortDirection,
    onSortChange,
    page,
    totalPages,
    onPageChange,
    totalRecords,
    recordsPerPage,
    onRecordsPerPageChange,
    filters,
    onFiltersChange,
    colorRow = false,
}: ParticipantsTableProps) => {
    // Обработчик изменения фильтра
    const handleFilterChange = useCallback(
        (key: string, value: string | string[] | undefined) => {
            onFiltersChange({
                ...filters,
                [key]: value,
            })
        },
        [filters, onFiltersChange],
    )

    // Загружаем сохранённые настройки столбцов
    const [tableSettings, setTableSettings] = useState<TableSettingsData>(() => {
        const saved = localStorage.getItem(getStorageKey(projectId))
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                return []
            }
        }
        return []
    })

    // Сохраняем настройки при изменении
    useEffect(() => {
        if (tableSettings.length > 0) {
            localStorage.setItem(getStorageKey(projectId), JSON.stringify(tableSettings))
        }
    }, [tableSettings, projectId])

    // Обработчик изменения настроек таблицы
    const handleSettingsUpdate = useCallback((newSettings: TableSettingsData) => {
        setTableSettings(newSettings)
    }, [])

    // Находим первое поле типа list (без multiple) для покраски строк
    const colorField = useMemo(() => {
        if (!colorRow) return null
        return (
            scheme.find((f) => f.config.type === 'list' && !f.config.listSettings?.multiple) || null
        )
    }, [colorRow, scheme])

    // Карта: participantId -> цвет строки
    const rowColorMap = useMemo(() => {
        const map = new Map<string, string | undefined>()
        if (!colorRow || !colorField) return map

        const items = colorField.config.listSettings?.items || []
        const otherItem = items.find((i) => i.value === '_')

        participants.forEach((p) => {
            const value = p.data?.[colorField.key]
            if (value) {
                const item = items.find((i) => i.value === value)
                if (item?.color) {
                    map.set(String(p.id), item.color)
                } else if (otherItem?.color) {
                    // Произвольное значение - берём цвет от "_"
                    map.set(String(p.id), otherItem.color)
                }
            }
        })

        return map
    }, [colorRow, colorField, participants])

    // Формируем столбцы из схемы (без ID)
    const columns: TableColumnConfig<TableDataItem>[] = useMemo(() => {
        const schemeColumns: TableColumnConfig<TableDataItem>[] = scheme.map((field) => {
            // Проверяем, можно ли фильтровать это поле (не фильтруем изображения и bool)
            const isFilterable = field.config.type !== 'img' && field.config.type !== 'bool'
            // Это поле определяющее цвет строки?
            const isColorField = colorRow && colorField?.key === field.key

            const column: TableColumnConfig<TableDataItem> = {
                id: field.key,
                name: () => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{field.label}</span>
                        {isFilterable && (
                            <ColumnFilter
                                field={field}
                                value={filters[field.key]}
                                onChange={handleFilterChange}
                            />
                        )}
                    </div>
                ),
                meta: { sort: true },
                template: (item) => {
                    const value = item.data?.[field.key]
                    const rowColor = colorRow ? rowColorMap.get(String(item.id)) : undefined

                    // Обёртка для применения цвета к ячейке
                    const CellWrapper = ({ children }: { children: React.ReactNode }) => {
                        if (!rowColor) return <>{children}</>
                        return (
                            <div
                                style={{
                                    backgroundColor: rowColor,
                                    margin: '-8px -12px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                }}
                            >
                                {children}
                            </div>
                        )
                    }

                    switch (field.config.type) {
                        case 'img':
                            // Изображения не окрашиваем
                            return <ImageCell value={value} />

                        case 'bool':
                            return (
                                <CellWrapper>
                                    <BoolCell value={value} />
                                </CellWrapper>
                            )

                        case 'list':
                            if (field.config.listSettings?.multiple) {
                                return (
                                    <CellWrapper>
                                        <MultiListCell value={value} />
                                    </CellWrapper>
                                )
                            }
                            // Если это color field и colorRow=true, просто показываем текст
                            if (isColorField && colorRow) {
                                return (
                                    <CellWrapper>
                                        <TextCell value={String(value ?? '')} />
                                    </CellWrapper>
                                )
                            }
                            return (
                                <CellWrapper>
                                    <ListCell
                                        value={value}
                                        items={field.config.listSettings?.items || []}
                                    />
                                </CellWrapper>
                            )

                        default:
                            // Для текстовых полей с isPhone форматируем номер телефона
                            const displayValue =
                                field.config.type === 'text' && field.config.isPhone
                                    ? formatPhone(value)
                                    : String(value ?? '')
                            return (
                                <CellWrapper>
                                    <TextCell value={displayValue} />
                                </CellWrapper>
                            )
                    }
                },
            }

            return column
        })

        // Добавляем колонку "Печатей" в конец
        const printCountColumn: TableColumnConfig<TableDataItem> = {
            id: '_printCount',
            name: 'Печатей',
            meta: { sort: false },
            template: (item) => {
                const count = item.printCount ?? 0
                return <TextCell value={String(count)} />
            },
        }

        return [...schemeColumns, printCountColumn]
    }, [scheme, filters, handleFilterChange, colorRow, colorField, rowColorMap])

    // Данные таблицы
    const tableData = useMemo(() => {
        return participants.map((p) => ({
            ...p,
            id: String(p.id),
        }))
    }, [participants])

    // Обработчик сортировки
    const handleSort = useCallback(
        (columnId: string) => {
            if (sortColumn === columnId) {
                onSortChange(columnId, sortDirection === 'ASC' ? 'DESC' : 'ASC')
            } else {
                onSortChange(columnId, 'ASC')
            }
        },
        [sortColumn, sortDirection, onSortChange],
    )

    // Состояние сортировки для таблицы
    const sortState = useMemo(() => {
        if (!sortColumn) {
            return undefined
        }
        return [
            {
                column: sortColumn,
                order: sortDirection.toLowerCase() as 'asc' | 'desc',
            },
        ]
    }, [sortColumn, sortDirection])

    return (
        <div className={styles.wrapper}>
            <div className={styles.tableContainer}>
                <SettingsTable
                    className={styles.table}
                    data={tableData}
                    columns={columns}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    sortState={sortState}
                    onSortStateChange={(state) => {
                        if (state && state.length > 0) {
                            handleSort(state[0].column)
                        }
                    }}
                    onRowClick={(row) => {
                        const participant = participants.find((p) => String(p.id) === row.id)
                        if (participant) {
                            onRowClick(participant)
                        }
                    }}
                    getRowDescriptor={(row) => ({
                        id: row.id,
                        disabled: false,
                    })}
                    settings={tableSettings}
                    updateSettings={handleSettingsUpdate}
                    wordWrap={false}
                />
            </div>

            {totalPages > 1 && (
                <div
                    className={styles.pagination}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                    <Pagination
                        page={page}
                        pageSize={recordsPerPage}
                        total={totalRecords}
                        onUpdate={(newPage) => onPageChange(newPage)}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--g-color-text-secondary)', fontSize: 13 }}>
                            Записей на странице
                        </span>
                        <Select
                            value={[String(recordsPerPage)]}
                            onUpdate={(v) => {
                                if (v && v.length > 0) {
                                    const n = Number(v[0])
                                    onRecordsPerPageChange(n)
                                    onPageChange(1)
                                }
                            }}
                            options={[
                                { value: '15', content: '15' },
                                { value: '30', content: '30' },
                                { value: '50', content: '50' },
                                { value: '100', content: '100' },
                            ]}
                            width={120}
                            size="m"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ParticipantsTable
