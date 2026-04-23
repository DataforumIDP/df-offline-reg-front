import { Text, Card, Skeleton, Tooltip } from '@gravity-ui/uikit'
import type { TextProps } from '@gravity-ui/uikit'
import styles from './StatsCard.module.css'

interface StatsCardProps {
    value: number
    label: string
    color: TextProps['color']
    loading?: boolean
    tooltip?: string
}

const StatsCardInner = ({ value, label, color, loading }: Omit<StatsCardProps, 'tooltip'>) => (
    <Card className={styles.card}>
        {loading ? (
            <Skeleton className={styles.skeleton} />
        ) : (
            <>
                <Text variant="display-2" color={color} className={styles.value}>
                    {value}
                </Text>
                <Text variant="body-2" color="secondary" className={styles.label}>
                    {label}
                </Text>
            </>
        )}
    </Card>
)

export const StatsCard = ({ tooltip, ...rest }: StatsCardProps) => {
    if (tooltip) {
        return (
            <Tooltip content={tooltip} placement="bottom">
                <StatsCardInner {...rest} />
            </Tooltip>
        )
    }
    return <StatsCardInner {...rest} />
}
