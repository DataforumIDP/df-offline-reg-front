import { useState, useCallback, useMemo } from 'react'
import {
    Text,
    Button,
    Loader,
    Table,
    Label,
    Select,
    Pagination,
    Card,
    withTableSorting,
} from '@gravity-ui/uikit'
import { ArrowUturnCcwLeft } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { PageWrapper, PageHeader, PageHeaderActions, SearchInput } from '@/components/atoms'
import {
    useJournalRecordsQuery,
    useJournalStatsQuery,
    useReturnJournalRecordMutation,
} from '@/hooks/queries/useJournalQueries'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import type { JournalRecord } from '@/services/api/journal'
import styles from './JournalPage.module.css'

const SortableTable = withTableSorting(Table)

const JournalPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()

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

    // Запросы данных
    const { data: recordsData, isLoading, isFetching } = useJournalRecordsQuery(
        Number(projectId),
        queryParams
    )
    const { data: stats } = useJournalStatsQuery(Number(projectId))
    const { data: zones } = useZonesQuery(Number(projectId))

    // Мутация возврата
    const returnMutation = useReturnJournalRecordMutation(Number(projectId))

    const records = recordsData?.records || []
    const totalPages = recordsData?.totalPages || 1
    const totalRecords = recordsData?.totalRecords || 0

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

    // Колонки таблицы
    const columns = useMemo(
        () => [
            {
                id: 'userCode',
                name: 'Код',
                template: (record: JournalRecord) => record.userCode,
                width: 150,
            },
            {
                id: 'userName',
                name: 'Имя',
                template: (record: JournalRecord) => record.userName || '—',
                width: 200,
            },
            {
                id: 'zoneName',
                name: 'Зона',
                template: (record: JournalRecord) => record.zoneName || '—',
                width: 150,
            },
            {
                id: 'scannerName',
                name: 'Сканер',
                template: (record: JournalRecord) => record.scannerName || '—',
                width: 150,
            },
            {
                id: 'checkoutAt',
                name: 'Выдано',
                template: (record: JournalRecord) =>
                    dayjs(record.checkoutAt).format('DD.MM.YYYY HH:mm'),
                width: 140,
            },
            {
                id: 'checkinAt',
                name: 'Возвращено',
                template: (record: JournalRecord) =>
                    record.checkinAt
                        ? dayjs(record.checkinAt).format('DD.MM.YYYY HH:mm')
                        : '—',
                width: 140,
            },
            {
                id: 'status',
                name: 'Статус',
                template: (record: JournalRecord) => (
                    <Label theme={record.isReturned ? 'success' : 'warning'}>
                        {record.isReturned
                            ? record.manualReturn
                                ? 'Возвращено (вручную)'
                                : 'Возвращено'
                            : 'На руках'}
                    </Label>
                ),
                width: 150,
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
        [handleManualReturn, returnMutation.isPending]
    )

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Журнал устройств</Text>
                <PageHeaderActions>
                    {isFetching && !isLoading && <Loader size="s" />}
                </PageHeaderActions>
            </PageHeader>

            {/* Статистика */}
            <div className={styles.stats}>
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
            </div>

            {/* Фильтры */}
            <div className={styles.filters}>
                <SearchInput
                    value={search}
                    onUpdate={handleSearchChange}
                    placeholder="Поиск по коду или имени..."
                    debounceMs={400}
                />
                <Select
                    placeholder="Статус"
                    options={statusOptions}
                    value={isReturnedFilter}
                    onUpdate={handleStatusChange}
                    width={150}
                    hasClear
                />
                {zoneOptions.length > 0 && (
                    <Select
                        placeholder="Зона"
                        options={zoneOptions}
                        value={zoneFilter}
                        onUpdate={handleZoneChange}
                        width={200}
                        hasClear
                    />
                )}
            </div>

            {/* Таблица */}
            {isLoading ? (
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
                            data={records}
                            columns={columns}
                            getRowId={(record) => String(record.id)}
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
            )}
        </PageWrapper>
    )
}

export default JournalPage
