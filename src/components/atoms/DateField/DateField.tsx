import { Text } from '@gravity-ui/uikit'
import { dateTime } from '@gravity-ui/date-utils'
import type { DateTime } from '@gravity-ui/date-utils'
import { useCallback, useEffect, useState } from 'react'

interface DateFieldProps {
    label?: string
    value: Date | null
    onUpdate: (date: Date | null) => void
    disabled?: boolean
    error?: boolean
    errorMessage?: string
    required?: boolean
    size?: 's' | 'm' | 'l'
}

const DateField = ({
    label,
    value,
    onUpdate,
    disabled = false,
    error = false,
    errorMessage,
    required = false,
}: DateFieldProps) => {
    const [dateTimeValue, setDateTimeValue] = useState<DateTime | null>(null)

    // Преобразуем Date в DateTime при загрузке
    useEffect(() => {
        if (value) {
            setDateTimeValue(dateTime({ input: value || new Date() }))
        } else {
            setDateTimeValue(null)
        }
    }, [value])

    // Обработчик изменения датапикера
    const handleChange = useCallback(
        (newDateTime: DateTime | null) => {
            setDateTimeValue(newDateTime)
            if (newDateTime) {
                onUpdate(newDateTime.toDate())
            } else {
                onUpdate(null)
            }
        },
        [onUpdate],
    )

    return (
        <div>
            {label && (
                <label
                    style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: 'var(--g-color-text-secondary)',
                    }}
                >
                    {label} {required && '*'}
                </label>
            )}
            <input
                type="date"
                value={dateTimeValue ? dateTimeValue.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null
                    handleChange(newDate ? dateTime({ input: newDate }) : null)
                }}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--g-color-line-generic)',
                    borderRadius: '4px',
                    fontSize: '14px',
                }}
            />
            {error && errorMessage && (
                <Text
                    variant="caption-2"
                    color="danger"
                    style={{ marginTop: '4px', display: 'block' }}
                >
                    {errorMessage}
                </Text>
            )}
        </div>
    )
}

export default DateField
