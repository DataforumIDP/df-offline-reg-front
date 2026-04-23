import { StatsCard } from './StatsCard'
import type { StatsCounts } from '../types/stats'
import styles from './StatsCardsRow.module.css'

interface StatsCardsRowProps {
    stats: StatsCounts
    loading?: boolean
}

export const StatsCardsRow = ({ stats, loading }: StatsCardsRowProps) => (
    <div className={styles.row}>
        <StatsCard value={stats.CREATE} label="Создано" color="positive" loading={loading} />
        <StatsCard value={stats.UPDATE} label="Обновлено" color="info" loading={loading} />
        <StatsCard value={stats.DELETE} label="Удалено" color="danger" loading={loading} />
        <StatsCard
            value={stats.uniqPrints}
            label="Напечатано"
            color="warning"
            loading={loading}
            tooltip={`Всего печатей: ${stats.PRINT}`}
        />
    </div>
)
