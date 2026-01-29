'use client'

import { useMemo } from 'react'
import { Text, Card, Skeleton, Alert, Table } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import ChartKit, { settings } from '@gravity-ui/chartkit'
import { YagrPlugin } from '@gravity-ui/chartkit/yagr'
import type { YagrWidgetData } from '@gravity-ui/chartkit/yagr'
import { useStatsLogsQuery, useLogsQuery } from '../../../hooks/queries/useStatsQueries'
import type { LogRecord } from '../../../services/api/statsService'

import '@gravity-ui/yagr/dist/index.css'

settings.set({ plugins: [YagrPlugin] })

const ProjectStatsPage = () => {
  const { id: projectId } = useParams<{ id: string }>()

  const projectIdNum = projectId ? parseInt(projectId, 10) : undefined

  // Загружаем статистику по типам действий
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useStatsLogsQuery(projectIdNum)

  // Загружаем логи за последние 30 дней для графика
  const {
    data: logsResponse,
    isLoading: logsLoading,
    error: logsError,
  } = useLogsQuery(projectIdNum, {
    limit: 100,
  })

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!logsResponse?.records || logsResponse.records.length === 0) return null

    // Группируем логи по датам (начало дня) и типам действий
    const dataByTimestamp: Record<number, Record<string, number>> = {}

    logsResponse.records.forEach((log) => {
      // Получаем начало дня в миллисекундах
      const date = new Date(log.createdAt)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      
      if (!dataByTimestamp[dayStart]) {
        dataByTimestamp[dayStart] = { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0 }
      }
      dataByTimestamp[dayStart][log.action]++
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
    if (!logsResponse?.records) return []

    const statsByUser: Record<number, {
      userId: number
      userName: string
      userLogin: string
      CREATE: number
      UPDATE: number
      DELETE: number
      PRINT: number
      total: number
    }> = {}

    logsResponse.records.forEach((log: LogRecord) => {
      if (!log.userId || !log.user) return

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
    { id: 'userLogin', name: 'Логин' },
    { id: 'CREATE', name: 'Создано' },
    { id: 'UPDATE', name: 'Обновлено' },
    { id: 'DELETE', name: 'Удалено' },
    { id: 'PRINT', name: 'Напечатано' },
    { id: 'total', name: 'Всего' },
  ]

  const statsMap = stats || { CREATE: 0, UPDATE: 0, DELETE: 0, PRINT: 0 }

  return (
    <div style={{ padding: '24px' }}>
      <Text variant="display-1" style={{ marginBottom: '24px', display: 'block' }}>
        Статистика
      </Text>

      {statsError && (
        <Alert theme="danger" title={`Ошибка: ${(statsError as Error).message}`} style={{ marginBottom: '24px' }} />
      )}

      {logsError && (
        <Alert theme="warning" title={`Ошибка: ${(logsError as Error).message}`} style={{ marginBottom: '24px' }} />
      )}

      {/* Карточки со статистикой */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ flex: 1, padding: '20px', textAlign: 'center', aspectRatio: '2 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {statsLoading ? (
            <Skeleton />
          ) : (
            <>
              <Text variant="display-2" color="positive">
                {statsMap.CREATE}
              </Text>
              <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
                Создано
              </Text>
            </>
          )}
        </Card>

        <Card style={{ flex: 1, padding: '20px', textAlign: 'center', aspectRatio: '2 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {statsLoading ? (
            <Skeleton />
          ) : (
            <>
              <Text variant="display-2" color="info">
                {statsMap.UPDATE}
              </Text>
              <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
                Обновлено
              </Text>
            </>
          )}
        </Card>

        <Card style={{ flex: 1, padding: '20px', textAlign: 'center', aspectRatio: '2 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {statsLoading ? (
            <Skeleton />
          ) : (
            <>
              <Text variant="display-2" color="danger">
                {statsMap.DELETE}
              </Text>
              <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
                Удалено
              </Text>
            </>
          )}
        </Card>

        <Card style={{ flex: 1, padding: '20px', textAlign: 'center', aspectRatio: '2 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {statsLoading ? (
            <Skeleton />
          ) : (
            <>
              <Text variant="display-2" color="warning">
                {statsMap.PRINT}
              </Text>
              <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
                Напечатано
              </Text>
            </>
          )}
        </Card>
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
      <Card style={{ padding: '20px', marginTop: '24px' }}>
        <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
          Статистика по пользователям
        </Text>
        {logsLoading ? (
          <Skeleton />
        ) : userStats.length > 0 ? (
          <Table data={userStats} columns={userStatsColumns} />
        ) : (
          <Text color="secondary">Нет данных о действиях пользователей</Text>
        )}
      </Card>
    </div>
  )
}

export default ProjectStatsPage
