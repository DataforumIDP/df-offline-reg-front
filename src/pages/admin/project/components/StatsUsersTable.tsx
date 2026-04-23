import { Text, Card, Skeleton, Table } from '@gravity-ui/uikit'
import type { UserStatRow, SelectedOperator } from '../types/stats'
import styles from './StatsUsersTable.module.css'

const COLUMNS = [
    { id: 'userName', name: 'Пользователь' },
    { id: 'CREATE', name: 'Создано' },
    { id: 'UPDATE', name: 'Обновлено' },
    { id: 'DELETE', name: 'Удалено' },
    { id: 'PRINT', name: 'Напечатано' },
]

interface StatsUsersTableProps {
    data: UserStatRow[]
    loading?: boolean
    onRowClick: (operator: SelectedOperator) => void
}

export const StatsUsersTable = ({ data, loading, onRowClick }: StatsUsersTableProps) => (
    <Card className={styles.card}>
        <Text variant="header-1" className={styles.title}>
            Статистика по пользователям
        </Text>
        {loading ? (
            <Skeleton />
        ) : data.length > 0 ? (
            <Table
                data={data}
                columns={COLUMNS}
                className={styles.table}
                onRowClick={(row) =>
                    onRowClick({
                        userId: row.userId,
                        userName: row.userName,
                        userLogin: row.userLogin,
                    })
                }
                getRowDescriptor={() => ({ interactive: true })}
            />
        ) : (
            <Text color="secondary">Нет данных о действиях пользователей</Text>
        )}
    </Card>
)
