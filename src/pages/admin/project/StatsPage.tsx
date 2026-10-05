'use client'

import { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Text, Card, Skeleton, Alert } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import ChartKit, { settings } from '@gravity-ui/chartkit'
import { YagrPlugin } from '@gravity-ui/chartkit/yagr'
import { PageWrapper, PageHeader, PageHeaderActions } from '@/components/atoms'
import { useStatsFilters } from './hooks/useStatsFilters'
import { useStatsData } from './hooks/useStatsData'
import { StatsFiltersPanel } from './components/StatsFiltersPanel'
import { StatsCardsRow } from './components/StatsCardsRow'
import { StatsUsersTable } from './components/StatsUsersTable'
import OperatorStatsModal from './components/OperatorStatsModal'
import type { SelectedOperator } from './types/stats'

import '@gravity-ui/yagr/dist/index.css'
import styles from './StatsPage.module.css'

settings.set({ plugins: [YagrPlugin] })

const ProjectStatsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const [selectedOperator, setSelectedOperator] = useState<SelectedOperator | null>(null)

    const {
        dateStart,
        dateEnd,
        setDateStart,
        setDateEnd,
        setDateRange,
        fieldFilters,
        setFieldFilters,
        resetFilters,
        dateParams,
    } = useStatsFilters()

    const {
        scheme,
        stats,
        statsLoading,
        statsError,
        logsLoading,
        logsError,
        chartData,
        userStats,
    } = useStatsData(projectId, dateParams, fieldFilters)

    const handleChartRangeSelect = useCallback(
        (from: number, to: number) => {
            if (!Number.isFinite(from) || !Number.isFinite(to)) {
                return
            }
            setDateRange(dayjs(Math.min(from, to)), dayjs(Math.max(from, to)))
        },
        [setDateRange],
    )

    const interactiveChartData = useMemo(() => {
        if (!chartData) {
            return null
        }

        const hooks = chartData.libraryConfig.hooks
        return {
            ...chartData,
            libraryConfig: {
                ...chartData.libraryConfig,
                hooks: {
                    ...hooks,
                    onSelect: [
                        ...(hooks?.onSelect ?? []),
                        ({ from, to }: { from: number; to: number }) =>
                            handleChartRangeSelect(from, to),
                    ],
                },
            },
        }
    }, [chartData, handleChartRangeSelect])

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Статистика</Text>
                <PageHeaderActions>
                    <StatsFiltersPanel
                        dateStart={dateStart}
                        dateEnd={dateEnd}
                        onDateStartChange={setDateStart}
                        onDateEndChange={setDateEnd}
                        filters={fieldFilters}
                        onFiltersChange={setFieldFilters}
                        scheme={scheme}
                        onReset={resetFilters}
                    />
                </PageHeaderActions>
            </PageHeader>

            {statsError && (
                <Alert theme="danger" title={`Ошибка: ${(statsError as Error).message}`} />
            )}
            {logsError && (
                <Alert theme="warning" title={`Ошибка: ${(logsError as Error).message}`} />
            )}

            <StatsCardsRow stats={stats} loading={statsLoading} />

            <Card className={styles.chartCard}>
                {logsLoading ? (
                    <Skeleton />
                ) : interactiveChartData ? (
                    <div className={styles.chart}>
                        <ChartKit type="yagr" data={interactiveChartData} />
                    </div>
                ) : (
                    <Text color="secondary">Нет данных для отображения графика</Text>
                )}
            </Card>

            <StatsUsersTable
                data={userStats}
                loading={logsLoading}
                onRowClick={setSelectedOperator}
            />

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
