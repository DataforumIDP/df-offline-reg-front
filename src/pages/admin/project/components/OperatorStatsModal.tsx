import { Dialog, Text, Table, Skeleton, Icon } from '@gravity-ui/uikit'
import { CircleCheck, CircleXmark } from '@gravity-ui/icons'
import { useOperatorStatsQuery } from '@/hooks/queries/useStatsQueries'
import { useSchemeQuery, type SchemeField } from '@/hooks/queries/useSchemeQueries'

interface OperatorStatsModalProps {
    open: boolean
    onClose: () => void
    projectId: string
    operator: {
        userId: number
        userName: string
        userLogin: string
    } | null
    dateParams?: {
        dateStart?: string
        dateEnd?: string
    }
}

const OperatorStatsModal = ({
    open,
    onClose,
    projectId,
    operator,
    dateParams,
}: OperatorStatsModalProps) => {
    const { data, isLoading } = useOperatorStatsQuery(
        projectId ? parseInt(projectId, 10) : undefined,
        operator?.userId,
        dateParams
    )

    const { data: schemeData } = useSchemeQuery(projectId)

    // Получаем первые 2 столбика схемы и поле списка для цвета
    const displayFields: SchemeField[] = []
    let colorField: SchemeField | null = null

    if (schemeData?.fields) {
        // Первые 2 поля для отображения
        const nonIdFields = schemeData.fields.filter((f) => f.config.type !== 'id')
        displayFields.push(...nonIdFields.slice(0, 2))

        // Ищем первое поле списка для цвета
        colorField = schemeData.fields.find((f) => f.config.type === 'list') || null
    }

    const getColorFromListField = (
        participant: Record<string, unknown>,
        field: SchemeField | null
    ): string | null => {
        if (!field || !field.config.listSettings) return null

        const value = participant[field.key]
        const item = field.config.listSettings.items.find((i) => i.value === value)
        return item?.color || null
    }

    const columns = [
        {
            id: 'participant',
            name: 'Участник',
            template: (row: any) => {
                const color = getColorFromListField(row.currentData, colorField)
                const displayValues = displayFields
                    .map((f) => row.currentData[f.key] || '')
                    .filter(Boolean)
                    .join(' ')

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {color && (
                            <div
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        <span>{displayValues || `ID: ${row.participantId}`}</span>
                    </div>
                )
            },
        },
        {
            id: 'created',
            name: 'Добавил',
            width: 100,
            template: (row: any) => (
                <Icon
                    data={row.created ? CircleCheck : CircleXmark}
                    size={18}
                    style={{ color: row.created ? 'var(--g-color-text-positive)' : 'var(--g-color-text-secondary)' }}
                />
            ),
        },
        {
            id: 'updated',
            name: 'Изменил',
            width: 100,
            template: (row: any) => (
                <Icon
                    data={row.updated ? CircleCheck : CircleXmark}
                    size={18}
                    style={{ color: row.updated ? 'var(--g-color-text-info)' : 'var(--g-color-text-secondary)' }}
                />
            ),
        },
        {
            id: 'printCount',
            name: 'Распечатал',
            width: 110,
            template: (row: any) => (
                <Text color={row.printCount > 0 ? 'primary' : 'secondary'}>
                    {row.printCount}
                </Text>
            ),
        },
    ]

    return (
        <Dialog open={open} onClose={onClose} size="l">
            <Dialog.Header
                caption={operator ? `Статистика: ${operator.userName || operator.userLogin}` : 'Статистика оператора'}
            />
            <Dialog.Body>
                {isLoading ? (
                    <Skeleton style={{ height: 200 }} />
                ) : data?.participants && data.participants.length > 0 ? (
                    <>
                        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                            <Table data={data.participants} columns={columns} />
                        </div>
                        <Text
                            variant="body-2"
                            color="secondary"
                            style={{ marginTop: '16px', display: 'block' }}
                        >
                            Всего участников: <strong>{data.totalParticipants}</strong>
                        </Text>
                    </>
                ) : (
                    <Text color="secondary">Нет данных о действиях оператора</Text>
                )}
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                textButtonCancel="Закрыть"
            />
        </Dialog>
    )
}

export default OperatorStatsModal
