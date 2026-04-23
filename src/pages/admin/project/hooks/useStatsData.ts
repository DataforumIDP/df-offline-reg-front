import { useMemo } from 'react'
import { useStatsLogsQuery, useLogsQuery } from '@/hooks/queries/useStatsQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import type { LogRecord } from '@/services/api/statsService'
import type { FiltersState } from '@/hooks/useParticipantsState'
import type { StatsDateParams, UserStatRow, StatsCounts } from '../types/stats'
import type { YagrWidgetData } from '@gravity-ui/chartkit/yagr'

const INTERVAL_MS = 15 * 60 * 1000 // 15 минут

const ACTION_COLORS: Record<string, string> = {
    CREATE: '#52c41a',
    UPDATE: '#1890ff',
    DELETE: '#ff4d4f',
    PRINT: '#faad14',
}

const ACTION_LABELS: Record<string, string> = {
    CREATE: 'Создано',
    UPDATE: 'Обновлено',
    DELETE: 'Удалено',
    PRINT: 'Напечатано',
}

function buildChartData(records: LogRecord[]): YagrWidgetData | null {
    if (records.length === 0) return null

    const byInterval: Record<number, Record<string, number>> = {}

    for (const log of records) {
        const ts = Math.floor(new Date(log.createdAt).getTime() / INTERVAL_MS) * INTERVAL_MS
        if (!byInterval[ts]) {
            byInterval[ts] = { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0 }
        }
        byInterval[ts][log.action]++
    }

    const sortedTs = Object.keys(byInterval).map(Number).sort((a, b) => a - b)
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'PRINT']

    return {
        data: {
            timeline: sortedTs,
            graphs: actions.map((action, i) => ({
                id: String(i),
                name: ACTION_LABELS[action],
                color: ACTION_COLORS[action],
                data: sortedTs.map((ts) => byInterval[ts][action]),
            })),
        },
        libraryConfig: {
            chart: {
                series: { type: 'line' },
                select: { zoom: false },
                size: { adaptive: true },
            },
            title: { text: 'События' },
            axes: { x: {} },
            scales: { x: {}, y: { type: 'linear', range: 'nice' } },
            tooltip: { show: true, tracking: 'sticky' },
            legend: { show: true },
        },
    }
}

function buildUserStats(records: LogRecord[]): UserStatRow[] {
    const byUser: Record<number, UserStatRow> = {}

    for (const log of records) {
        if (!log.userId || !log.user) continue
        if (!byUser[log.userId]) {
            byUser[log.userId] = {
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
        byUser[log.userId][log.action]++
        byUser[log.userId].total++
    }

    return Object.values(byUser).sort((a, b) => b.total - a.total)
}

function buildFilteredStats(records: LogRecord[]): StatsCounts {
    const counts: StatsCounts = { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0, uniqPrints: 0 }
    const printedIds = new Set<number>()
    for (const log of records) {
        counts[log.action]++
        if (log.action === 'PRINT' && log.participantId != null) {
            printedIds.add(log.participantId)
        }
    }
    counts.uniqPrints = printedIds.size
    return counts
}

function applyFieldFilters(records: LogRecord[], fieldFilters: FiltersState): LogRecord[] {
    const active = Object.entries(fieldFilters).filter(
        ([, v]) => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''),
    )
    if (active.length === 0) return records

    return records.filter((log) => {
        const data = (log.currentData ?? log.participant?.data) as
            | Record<string, unknown>
            | undefined
        if (!data) return false
        return active.every(([key, filterVal]) => {
            const cellVal = data[key]
            if (Array.isArray(filterVal)) {
                const cellStr = String(cellVal ?? '').toLowerCase()
                return filterVal.some((fv) => cellStr === fv.toLowerCase())
            }
            return String(cellVal ?? '')
                .toLowerCase()
                .includes((filterVal as string).toLowerCase())
        })
    })
}

export const useStatsData = (
    projectId: string | undefined,
    dateParams: StatsDateParams,
    fieldFilters: FiltersState,
) => {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined

    const { data: schemeData } = useSchemeQuery(projectId || '')
    const scheme = schemeData?.fields || []

    const {
        data: stats,
        isLoading: statsLoading,
        error: statsError,
    } = useStatsLogsQuery(projectIdNum, dateParams)

    const {
        data: logsResponse,
        isLoading: logsLoading,
        error: logsError,
    } = useLogsQuery(projectIdNum, { limit: 100, ...dateParams })

    const filteredRecords = useMemo(
        () => applyFieldFilters(logsResponse?.records ?? [], fieldFilters),
        [logsResponse, fieldFilters],
    )

    const chartData = useMemo(() => buildChartData(filteredRecords), [filteredRecords])
    const userStats = useMemo(() => buildUserStats(filteredRecords), [filteredRecords])
    const filteredStats = useMemo(() => buildFilteredStats(filteredRecords), [filteredRecords])

    const hasFieldFilters = Object.values(fieldFilters).some(
        (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''),
    )
    const statsMap: StatsCounts = hasFieldFilters
        ? filteredStats
        : stats ?? { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0, uniqPrints: 0 }

    return {
        scheme,
        stats: statsMap,
        statsLoading,
        statsError,
        logsLoading,
        logsError,
        chartData,
        userStats,
    }
}
