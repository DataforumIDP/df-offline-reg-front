import { useState, useCallback, useRef } from 'react'
import { Button, Text, Popup, TextInput, Select } from '@gravity-ui/uikit'
import { Funnel } from '@gravity-ui/icons'
import dayjs, { Dayjs } from 'dayjs'
import { DatePicker } from '@gravity-ui/date-components'
import { dateTime } from '@gravity-ui/date-utils'
import type { DateTime } from '@gravity-ui/date-utils'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import type { FiltersState } from '@/hooks/useParticipantsState'

interface StatsFiltersPanelProps {
    dateStart: Dayjs | null
    dateEnd: Dayjs | null
    onDateStartChange: (v: Dayjs | null) => void
    onDateEndChange: (v: Dayjs | null) => void
    filters: FiltersState
    onFiltersChange: (filters: FiltersState) => void
    scheme: SchemeField[]
    onReset: () => void
}

export const StatsFiltersPanel = ({
    dateStart,
    dateEnd,
    onDateStartChange,
    onDateEndChange,
    filters,
    onFiltersChange,
    scheme,
    onReset,
}: StatsFiltersPanelProps) => {
    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Считаем активные фильтры для бейджа
    const activeDateCount = (dateStart ? 1 : 0) + (dateEnd ? 1 : 0)
    const activeFieldCount = Object.values(filters).filter(
        (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''),
    ).length
    const totalActive = activeDateCount + activeFieldCount

    const filterableFields = scheme.filter(
        (f) => f.config.type !== 'img' && f.config.type !== 'bool',
    )

    const handleFieldChange = useCallback(
        (key: string, value: string | string[] | undefined) => {
            onFiltersChange({ ...filters, [key]: value })
        },
        [filters, onFiltersChange],
    )

    return (
        <>
            <Button
                ref={buttonRef}
                view={totalActive > 0 ? 'action' : 'outlined'}
                onClick={() => setOpen((v) => !v)}
                selected={open}
            >
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Funnel style={{ display: 'block', flexShrink: 0 }} />
                    Фильтры
                    {totalActive > 0 && (
                        <span
                            style={{
                                background: 'rgba(255,255,255,0.25)',
                                borderRadius: 10,
                                padding: '0 6px',
                                fontSize: 12,
                                lineHeight: '18px',
                                display: 'inline-block',
                            }}
                        >
                            {totalActive}
                        </span>
                    )}
                </span>
            </Button>

            <Popup
                open={open}
                anchorRef={buttonRef}
                onClose={() => setOpen(false)}
                placement="bottom-end"
                style={{ zIndex: 1000 }}
            >
                <div
                    style={{
                        padding: 16,
                        minWidth: 280,
                        maxWidth: 360,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Даты */}
                    <Text variant="subheader-2">Период</Text>
                    <DatePicker
                        value={dateStart ? dateTime({ input: dateStart.valueOf() }) : null}
                        onUpdate={(v: DateTime | null) => onDateStartChange(v ? dayjs(v.valueOf()) : null)}
                        placeholder="Дата начала"
                        format="DD.MM.YYYY HH:mm"
                        maxValue={dateEnd ? dateTime({ input: dateEnd.valueOf() }) : undefined}
                        hasClear
                    />
                    <DatePicker
                        value={dateEnd ? dateTime({ input: dateEnd.valueOf() }) : null}
                        onUpdate={(v: DateTime | null) => onDateEndChange(v ? dayjs(v.valueOf()) : null)}
                        placeholder="Дата конца"
                        format="DD.MM.YYYY HH:mm"
                        minValue={dateStart ? dateTime({ input: dateStart.valueOf() }) : undefined}
                        hasClear
                    />

                    {/* Поля участников */}
                    {filterableFields.length > 0 && (
                        <>
                            <Text variant="subheader-2" style={{ marginTop: 4 }}>
                                Поля участника
                            </Text>
                            {filterableFields.map((field) => {
                                const value = filters[field.key]
                                const isListType = field.config.type === 'list'
                                const listItems = field.config.listSettings?.items || []
                                const isMultiple = field.config.listSettings?.multiple || false

                                if (isListType) {
                                    return (
                                        <div key={field.key}>
                                            <Text
                                                variant="body-1"
                                                color="secondary"
                                                style={{ marginBottom: 4, display: 'block' }}
                                            >
                                                {field.label}
                                            </Text>
                                            <Select
                                                multiple={isMultiple}
                                                value={
                                                    Array.isArray(value)
                                                        ? value
                                                        : value
                                                          ? [value as string]
                                                          : []
                                                }
                                                options={listItems.map((item) => ({
                                                    value: item.value,
                                                    content: item.value,
                                                }))}
                                                onUpdate={(vals) =>
                                                    handleFieldChange(
                                                        field.key,
                                                        vals.length > 0 ? vals : undefined,
                                                    )
                                                }
                                                placeholder="Все значения"
                                                width="max"
                                                filterable
                                            />
                                        </div>
                                    )
                                }

                                return (
                                    <div key={field.key}>
                                        <Text
                                            variant="body-1"
                                            color="secondary"
                                            style={{ marginBottom: 4, display: 'block' }}
                                        >
                                            {field.label}
                                        </Text>
                                        <TextInput
                                            value={typeof value === 'string' ? value : ''}
                                            onUpdate={(val) =>
                                                handleFieldChange(field.key, val || undefined)
                                            }
                                            placeholder="Любое значение"
                                        />
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {/* Сброс */}
                    {totalActive > 0 && (
                        <Button
                            view="outlined-danger"
                            onClick={() => {
                                onReset()
                                setOpen(false)
                            }}
                            width="max"
                            style={{ marginTop: 4 }}
                        >
                            Сбросить фильтры
                        </Button>
                    )}
                </div>
            </Popup>
        </>
    )
}
