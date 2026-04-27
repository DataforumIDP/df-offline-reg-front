import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
    Text,
    Button,
    Loader,
    Table,
    Label,
    Select,
    Pagination,
    Card,
    Switch,
    withTableSorting,
    Popup,
    Icon,
} from '@gravity-ui/uikit'
import { ArrowUturnCcwLeft, Funnel } from '@gravity-ui/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { useUpdateProjectMutation } from '@/hooks/mutations/useProjectMutations'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import dayjs from 'dayjs'
import { PageWrapper, PageHeader, PageHeaderActions, SearchInput } from '@/components/atoms'
import {
    useJournalRecordsQuery,
    useJournalStatsQuery,
    useReturnJournalRecordMutation,
} from '@/hooks/queries/useJournalQueries'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import { fetchParticipantById } from '@/services/api/participants'
import type { JournalRecord } from '@/services/api/journal'
import styles from './JournalPage.module.css'

const SortableTable = withTableSorting<JournalRecord>(Table)

interface InlineSelectFilterProps {
    label: string
    options: { value: string; content: string }[]
    value: string[]
    onChange: (v: string[]) => void
}
const InlineSelectFilter = ({ label, options, value, onChange }: InlineSelectFilterProps) => {
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const isActive = value.length > 0
    return (
        <>
            <Button
                ref={btnRef}
                view="flat"
                size="xs"
                onClick={(e) => { e.stopPropagation(); setOpen(true) }}
                style={{ marginLeft: 4, position: 'relative' }}
            >
                <Icon data={Funnel} size={14} />
                {isActive && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 6, height: 6,
                        backgroundColor: 'var(--g-color-base-info)',
                        borderRadius: '50%',
                    }} />
                )}
            </Button>
            <Popup open={open} anchorRef={btnRef} onClose={() => setOpen(false)} placement="bottom-start">
                <div
                    style={{ padding: 12, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>Фильтр: {label}</div>
                    <Select
                        options={options}
                        value={value}
                        onUpdate={onChange}
                        placeholder="Все"
                        width="max"
                        hasClear
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button view="flat" size="s" onClick={(e) => { e.stopPropagation(); onChange([]); setOpen(false) }}>
                            Сбросить
                        </Button>
                        <Button view="action" size="s" onClick={() => setOpen(false)}>
                            Применить
                        </Button>
                    </div>
                </div>
            </Popup>
        </>
    )
}

const JournalPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const { data: project } = useProjectQuery(Number(projectId))
    const updateProjectMutation = useUpdateProjectMutation()

    const handleJournalEnabledChange = useCallback(
        (checked: boolean) => {
            updateProjectMutation.mutate(
                { id: Number(projectId), data: { journalEnabled: checked } },
                { onSuccess: () => enqueueSnackbar(checked ? 'Журнал включён' : 'Журнал отключён', { variant: 'success' }) }
            )
        },
        [projectId, updateProjectMutation, enqueueSnackbar]
    )

    // Фильтры
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [isReturnedFilter, setIsReturnedFilter] = useState<string[]>([])
    const [zoneFilter, setZoneFilter] = useState<string[]>([])

    const limit = 50

    // Параметры запроса
    const queryParams = useMemo(
        () => ({
            page,
            limit,
            search: search || undefined,
            isReturned:
                isReturnedFilter.length === 1
                    ? isReturnedFilter[0] === 'true'
                    : undefined,
            zoneId: zoneFilter.length === 1 ? Number(zoneFilter[0]) : undefined,
        }),
        [page, search, isReturnedFilter, zoneFilter]
    )

    const journalEnabled = project?.journalEnabled ?? true

    // Запросы данных
    const { data: recordsData, isLoading, isFetching } = useJournalRecordsQuery(
        Number(projectId),
        queryParams,
        journalEnabled
    )
    const { data: stats } = useJournalStatsQuery(Number(projectId), journalEnabled)
    const { data: zones } = useZonesQuery(Number(projectId))
    const { data: schemeData } = useSchemeQuery(projectId || '')

    // Мутация возврата
    const returnMutation = useReturnJournalRecordMutation(Number(projectId))

    const records = recordsData?.records || []
    const totalRecords = recordsData?.totalRecords || 0

    const scheme = schemeData?.fields || []

    // Опции для селекта статуса
    const statusOptions = [
        { value: 'false', content: 'На руках' },
        { value: 'true', content: 'Возвращено' },
    ]

    // Опции зон
    const zoneOptions = useMemo(() => {
        return (zones || []).map((zone) => ({
            value: String(zone.id),
            content: zone.name,
        }))
    }, [zones])

    // Ручной возврат
    const handleManualReturn = useCallback(
        async (recordId: number) => {
            try {
                await returnMutation.mutateAsync(recordId)
                enqueueSnackbar('Устройство возвращено', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar('Ошибка возврата', { variant: 'error' })
            }
        },
        [returnMutation, enqueueSnackbar]
    )

    // Обработчик изменения поиска
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value)
        setPage(1) // Сброс страницы при поиске
    }, [])

    // Обработчик изменения фильтра статуса
    const handleStatusChange = useCallback((values: string[]) => {
        setIsReturnedFilter(values)
        setPage(1)
    }, [])

    // Обработчик изменения фильтра зоны
    const handleZoneChange = useCallback((values: string[]) => {
        setZoneFilter(values)
        setPage(1)
    }, [])

    // Переход на страницу участника
    const handleRowClick = useCallback(
        (record: JournalRecord) => {
            if (!record.participantId) return
            navigate(
                `/admin/projects/${projectId}/participants?modalId=${record.participantId}`
            )
        },
        [navigate, projectId]
    )

    // Ctrl+C — копировать текущие записи таблицы
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (!e.ctrlKey || e.code !== 'KeyC') return
            if (window.getSelection()?.toString()) return // есть выделенный текст — не перехватываем
            if (records.length === 0) return

            e.preventDefault()

            try {
                // Получаем данные участников для текущих записей
                const participantIds = records
                    .filter((r) => r.participantId !== null)
                    .map((r) => r.participantId as number)

                const uniqueIds = [...new Set(participantIds)]
                const participantMap = new Map<number, Record<string, unknown>>()

                await Promise.all(
                    uniqueIds.map(async (pid) => {
                        try {
                            const p = await fetchParticipantById(Number(projectId), pid)
                            participantMap.set(pid, p.data || {})
                        } catch {
                            // участник недоступен — пропускаем
                        }
                    })
                )

                const sep = '='.repeat(16)
                const lines: string[] = []

                records.forEach((record) => {
                    lines.push(sep)
                    const statusText = record.isReturned
                        ? record.manualReturn
                            ? 'Возвращено (вручную)'
                            : 'Возвращено'
                        : 'На руках'
                    lines.push(`Статус: ${statusText}`)
                    lines.push(
                        `Выдано: ${dayjs(record.checkoutAt).format('DD.MM.YYYY HH:mm')}`
                    )
                    lines.push(`Зона: ${record.zoneName || '—'}`)
                    lines.push('Данные пользователя:')

                    if (record.participantId && participantMap.has(record.participantId)) {
                        const data = participantMap.get(record.participantId)!
                        scheme.forEach((field) => {
                            const value = data[field.key]
                            if (value !== undefined && value !== null && value !== '') {
                                lines.push(`  ${field.label}: ${value}`)
                            }
                        })
                    } else {
                        lines.push(`  Код: ${record.userCode}`)
                    }
                })
                lines.push(sep)

                await navigator.clipboard.writeText(lines.join('\n'))
                enqueueSnackbar('Данные скопированы', { variant: 'success' })
            } catch {
                enqueueSnackbar('Ошибка копирования', { variant: 'error' })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [records, projectId, scheme, enqueueSnackbar])

    // Колонки таблицы
    const columns = useMemo(
        () => [
            {
                id: 'userCode',
                name: 'Код',
                template: (record: JournalRecord) => record.userCode,
                width: 180,
            },
            {
                id: 'zoneName',
                name: () => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Зона</span>
                        {zoneOptions.length > 0 && (
                            <InlineSelectFilter
                                label="Зона"
                                options={zoneOptions}
                                value={zoneFilter}
                                onChange={handleZoneChange}
                            />
                        )}
                    </div>
                ),
                template: (record: JournalRecord) => record.zoneName || '—',
            },
            {
                id: 'scannerName',
                name: 'Сканер',
                template: (record: JournalRecord) => record.scannerName || '—',
                width: 180,
            },
            {
                id: 'checkoutAt',
                name: 'Выдано',
                template: (record: JournalRecord) =>
                    dayjs(record.checkoutAt).format('DD.MM.YYYY HH:mm'),
                width: 150,
            },
            {
                id: 'checkinAt',
                name: 'Возвращено',
                template: (record: JournalRecord) =>
                    record.checkinAt
                        ? dayjs(record.checkinAt).format('DD.MM.YYYY HH:mm')
                        : '—',
                width: 150,
            },
            {
                id: 'status',
                name: () => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Статус</span>
                        <InlineSelectFilter
                            label="Статус"
                            options={statusOptions}
                            value={isReturnedFilter}
                            onChange={handleStatusChange}
                        />
                    </div>
                ),
                template: (record: JournalRecord) => (
                    <Label theme={record.isReturned ? 'success' : 'warning'}>
                        {record.isReturned
                            ? record.manualReturn
                                ? 'Возвращено (вручную)'
                                : 'Возвращено'
                            : 'На руках'}
                    </Label>
                ),
                width: 200,
            },
            {
                id: 'actions',
                name: '',
                template: (record: JournalRecord) =>
                    !record.isReturned && (
                        <Button
                            view="flat"
                            size="s"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleManualReturn(record.id)
                            }}
                            loading={returnMutation.isPending}
                        >
                            <Button.Icon>
                                <ArrowUturnCcwLeft />
                            </Button.Icon>
                            Вернуть
                        </Button>
                    ),
                width: 120,
            },
        ],
        [handleManualReturn, returnMutation.isPending, zoneOptions, zoneFilter, handleZoneChange, isReturnedFilter, handleStatusChange, statusOptions]
    )

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Журнал устройств</Text>
                <PageHeaderActions>
                    {isFetching && !isLoading && <Loader size="s" />}
                    <Switch
                        checked={project?.journalEnabled ?? false}
                        onUpdate={handleJournalEnabledChange}
                        disabled={updateProjectMutation.isPending}
                    >
                        Включён
                    </Switch>
                </PageHeaderActions>
            </PageHeader>

            {!journalEnabled && (
                <div className={styles.disabledPlaceholder}>
                    <Text variant="body-2" color="secondary">
                        Журнал устройств отключён. Включите журнал, чтобы начать отслеживать выдачу и возврат устройств.
                    </Text>
                </div>
            )}

            {/* Статистика */}
            {journalEnabled && <div className={styles.stats}>
                <Card className={styles.statCard}>
                    <Text variant="body-2" color="secondary">
                        Всего записей
                    </Text>
                    <Text variant="display-2">{stats?.total || 0}</Text>
                </Card>
                <Card className={styles.statCard}>
                    <Text variant="body-2" color="secondary">
                        На руках
                    </Text>
                    <Text variant="display-2" color="warning">
                        {stats?.onHands || 0}
                    </Text>
                </Card>
                <Card className={styles.statCard}>
                    <Text variant="body-2" color="secondary">
                        Возвращено
                    </Text>
                    <Text variant="display-2" color="positive">
                        {stats?.returned || 0}
                    </Text>
                </Card>
            </div>}

            {/* Фильтры */}
            {journalEnabled && <div className={styles.filters}>
                <SearchInput
                    value={search}
                    onUpdate={handleSearchChange}
                    placeholder="Поиск по коду..."
                    fullWidth
                    debounceMs={400}
                />
            </div>}

            {/* Таблица */}
            {journalEnabled && (isLoading ? (
                <div className={styles.loaderContainer}>
                    <Loader size="l" />
                </div>
            ) : records.length === 0 ? (
                <div className={styles.emptyState}>
                    <Text variant="body-2" color="secondary">
                        {search || isReturnedFilter.length || zoneFilter.length
                            ? 'Записи не найдены'
                            : 'Журнал пуст'}
                    </Text>
                </div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <SortableTable
                            className={styles.table}
                            data={records}
                            columns={columns}
                            getRowId={(record) => String(record.id)}
                            onRowClick={(record) => handleRowClick(record)}
                        />
                    </div>

                    {/* Пагинация */}
                    <div className={styles.pagination}>
                        <Text variant="body-2" color="secondary">
                            Записей: {totalRecords}
                        </Text>
                        <Pagination
                            page={page}
                            pageSize={limit}
                            total={totalRecords}
                            onUpdate={(newPage) => setPage(newPage)}
                        />
                    </div>
                </>
            ))}
        </PageWrapper>
    )
}

export default JournalPage
