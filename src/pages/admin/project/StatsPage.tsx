'use client'

import { useMemo, useState } from 'react'
import { Text, Card, Skeleton, Alert, Table, Tooltip } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import ChartKit, { settings } from '@gravity-ui/chartkit'
import { YagrPlugin } from '@gravity-ui/chartkit/yagr'
import type { YagrWidgetData } from '@gravity-ui/chartkit/yagr'
import { Dayjs } from 'dayjs'
import { PageWrapper, PageHeader, PageHeaderActions, DateTimePicker } from '@/components/atoms'
import { useStatsLogsQuery, useLogsQuery } from '../../../hooks/queries/useStatsQueries'
import type { LogRecord } from '../../../services/api/statsService'
import OperatorStatsModal from './components/OperatorStatsModal'

import '@gravity-ui/yagr/dist/index.css'
import './StatsPage.css'

settings.set({ plugins: [YagrPlugin] })

interface SelectedOperator {
    userId: number
    userName: string
    userLogin: string
}

const ProjectStatsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const [dateStart, setDateStart] = useState<Dayjs | null>(null)
    const [dateEnd, setDateEnd] = useState<Dayjs | null>(null)
    const [selectedOperator, setSelectedOperator] = useState<SelectedOperator | null>(null)

    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined

    // Преобразуем даты в ISO строки для запросов
    const dateParams = useMemo(() => ({
        dateStart: dateStart?.toISOString(),
        dateEnd: dateEnd?.toISOString(),
    }), [dateStart, dateEnd])

    // Загружаем статистику по типам действий
    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError,
    } = useStatsLogsQuery(projectIdNum, dateParams)

    // Загружаем логи для графика
    const {
        data: logsResponse,
        isLoading: logsLoading,
        error: logsError,
    } = useLogsQuery(projectIdNum, {
        limit: 100,
        ...dateParams,
    })

    // Подготовка данных для графика
    const chartData = useMemo(() => {
        if (!logsResponse?.records || logsResponse.records.length === 0) {
            return null
        }

        // Группируем логи по 15-минутным интервалам
        const dataByTimestamp: Record<number, Record<string, number>> = {}
        const INTERVAL_MS = 15 * 60 * 1000 // 15 минут

        logsResponse.records.forEach((log) => {
            const date = new Date(log.createdAt)
            // Округляем до 15-минутного интервала
            const intervalStart = Math.floor(date.getTime() / INTERVAL_MS) * INTERVAL_MS

            if (!dataByTimestamp[intervalStart]) {
                dataByTimestamp[intervalStart] = { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0 }
            }
            dataByTimestamp[intervalStart][log.action]++
        })

        // Сортируем по timestamp
        const sortedTimestamps = Object.keys(dataByTimestamp)
            .map(Number)
            .sort((a, b) => a - b)

        // Timeline в миллисекундах
        const timeline = sortedTimestamps

        const graphs = [
            {
                id: '0',
                name: 'Создано',
                color: '#52c41a',
                data: sortedTimestamps.map((ts) => dataByTimestamp[ts].CREATE),
            },
            {
                id: '1',
                name: 'Обновлено',
                color: '#1890ff',
                data: sortedTimestamps.map((ts) => dataByTimestamp[ts].UPDATE),
            },
            {
                id: '2',
                name: 'Удалено',
                color: '#ff4d4f',
                data: sortedTimestamps.map((ts) => dataByTimestamp[ts].DELETE),
            },
            {
                id: '3',
                name: 'Напечатано',
                color: '#faad14',
                data: sortedTimestamps.map((ts) => dataByTimestamp[ts].PRINT),
            },
        ]

        const chartConfig: YagrWidgetData = {
            data: {
                timeline,
                graphs,
            },
            libraryConfig: {
                chart: {
                    series: {
                        type: 'line',
                    },
                    select: {
                        zoom: false,
                    },
                    size: {
                        adaptive: true,
                    }
                },
                title: {
                    text: 'События',
                },
                axes: {
                    x: {},
                },
                scales: {
                    x: {},
                    y: {
                        type: 'linear',
                        range: 'nice',
                    },
                },
                tooltip: {
                    show: true,
                    tracking: 'sticky',
                },
                legend: {
                    show: true,
                },
            },
        }

        return chartConfig
    }, [logsResponse])

    // Статистика по пользователям
    const userStats = useMemo(() => {
        if (!logsResponse?.records) {
            return []
        }

        const statsByUser: Record<
            number,
            {
                userId: number
                userName: string
                userLogin: string
                CREATE: number
                UPDATE: number
                DELETE: number
                PRINT: number
                total: number
            }
        > = {}

        logsResponse.records.forEach((log: LogRecord) => {
            if (!log.userId || !log.user) {
                return
            }

            if (!statsByUser[log.userId]) {
                statsByUser[log.userId] = {
                    userId: log.userId,
                    userName: log.user.name || 'Без имени',
                    userLogin: log.user.login,
                    CREATE: 0,
                    UPDATE: 0,
                    DELETE: 0,
                    PRINT: 0,
                    total: 0,
                }
            }

            statsByUser[log.userId][log.action]++
            statsByUser[log.userId].total++
        })

        return Object.values(statsByUser).sort((a, b) => b.total - a.total)
    }, [logsResponse])

    const userStatsColumns = [
        { id: 'userName', name: 'Пользователь' },
        { id: 'CREATE', name: 'Создано' },
        { id: 'UPDATE', name: 'Обновлено' },
        { id: 'DELETE', name: 'Удалено' },
        { id: 'PRINT', name: 'Напечатано' },
    ]

    const statsMap = stats || { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0, uniqPrints: 0 }

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Статистика</Text>
                <PageHeaderActions>
                    <DateTimePicker
                        value={dateStart}
                        onChange={setDateStart}
                        placeholder="Дата начала"
                        maxDateTime={dateEnd || undefined}
                    />
                    <DateTimePicker
                        value={dateEnd}
                        onChange={setDateEnd}
                        placeholder="Дата конца"
                        minDateTime={dateStart || undefined}
                    />
                </PageHeaderActions>
            </PageHeader>

            {statsError && (
                <Alert
                    theme="danger"
                    title={`Ошибка: ${(statsError as Error).message}`}
                />
            )}

            {logsError && (
                <Alert
                    theme="warning"
                    title={`Ошибка: ${(logsError as Error).message}`}
                />
            )}

            {/* Карточки со статистикой */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Card
                    style={{
                        flex: '1 1 140px',
                        minWidth: '140px',
                        padding: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {statsLoading ? (
                        <Skeleton />
                    ) : (
                        <>
                            <Text variant="display-2" color="positive">
                                {statsMap.CREATE}
                            </Text>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginTop: '8px', display: 'block' }}
                            >
                                Создано
                            </Text>
                        </>
                    )}
                </Card>

                <Card
                    style={{
                        flex: '1 1 140px',
                        minWidth: '140px',
                        padding: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {statsLoading ? (
                        <Skeleton />
                    ) : (
                        <>
                            <Text variant="display-2" color="info">
                                {statsMap.UPDATE}
                            </Text>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginTop: '8px', display: 'block' }}
                            >
                                Обновлено
                            </Text>
                        </>
                    )}
                </Card>

                <Card
                    style={{
                        flex: '1 1 140px',
                        minWidth: '140px',
                        padding: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    {statsLoading ? (
                        <Skeleton />
                    ) : (
                        <>
                            <Text variant="display-2" color="danger">
                                {statsMap.DELETE}
                            </Text>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginTop: '8px', display: 'block' }}
                            >
                                Удалено
                            </Text>
                        </>
                    )}
                </Card>

                <Tooltip content={`Всего печатей: ${statsMap.PRINT}`} placement="bottom">
                    <Card
                        style={{
                            flex: '1 1 140px',
                            minWidth: '140px',
                            padding: '20px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        {statsLoading ? (
                            <Skeleton />
                        ) : (
                            <>
                                <Text variant="display-2" color="warning">
                                    {statsMap.uniqPrints}
                                </Text>
                                <Text
                                    variant="body-2"
                                    color="secondary"
                                    style={{ marginTop: '8px', display: 'block' }}
                                >
                                    Напечатано
                                </Text>
                            </>
                        )}
                    </Card>
                </Tooltip>
            </div>

            {/* График */}
            <Card style={{ padding: '20px' }}>
                {logsLoading ? (
                    <Skeleton />
                ) : chartData ? (
                    <div style={{ height: '400px', width: '100%' }}>
                        <ChartKit type="yagr" data={chartData} />
                    </div>
                ) : (
                    <Text color="secondary">Нет данных для отображения графика</Text>
                )}
            </Card>

            {/* Статистика по пользователям */}
            <Card style={{ padding: '20px' }}>
                <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
                    Статистика по пользователям
                </Text>
                {logsLoading ? (
                    <Skeleton />
                ) : userStats.length > 0 ? (
                    <Table
                        data={userStats}
                        columns={userStatsColumns}
                        className="stats-table-large"
                        onRowClick={(row) => {
                                setSelectedOperator({
                                    userId: row.userId,
                                    userName: row.userName,
                                    userLogin: row.userLogin,
                                })
                            }}
                        getRowDescriptor={() => ({ interactive: true })}
                    />
                ) : (
                    <Text color="secondary">Нет данных о действиях пользователей</Text>
                )}
            </Card>

            {/* Модалка статистики оператора */}
            <OperatorStatsModal
                open={!!selectedOperator}
                onClose={() => setSelectedOperator(null)}
                projectId={projectId || ''}
                operator={selectedOperator}
                dateParams={dateParams}
            />
        </PageWrapper>
    )
}

export default ProjectStatsPage
