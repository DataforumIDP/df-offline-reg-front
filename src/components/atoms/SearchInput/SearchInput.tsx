import { TextInput, Icon, Button, DropdownMenu, Text } from '@gravity-ui/uikit'
import { Magnifier, ClockArrowRotateLeft, Xmark } from '@gravity-ui/icons'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import type { SearchHistoryEntry } from '@/hooks/useParticipantsState'

export type { SearchHistoryEntry }

export interface SearchInputProps {
    value: string
    onUpdate: (value: string) => void
    placeholder?: string
    debounceMs?: number
    fullWidth?: boolean
    size?: 's' | 'm' | 'l' | 'xl'
    /** Контент в конце инпута (иконка/кнопка) */
    endContent?: ReactNode
    /** Функция для получения истории поиска */
    getSearchHistory?: () => SearchHistoryEntry[]
    /** Обработчик применения записи из истории */
    onApplyHistory?: (entry: SearchHistoryEntry) => void
    /** Показывать кнопку очистки */
    showClear?: boolean
}

const formatHistoryLabel = (entry: SearchHistoryEntry): string => {
    const parts: string[] = []
    if (entry.search) {
        parts.push(`"${entry.search}"`)
    }
    const filterCount = Object.keys(entry.filters || {}).length
    if (filterCount > 0) {
        parts.push(`${filterCount} фильтр${filterCount > 1 ? 'а' : ''}`)
    }
    if (entry.sortColumn && entry.sortColumn !== 'id') {
        parts.push(`сорт: ${entry.sortColumn}`)
    }
    return parts.join(', ') || 'Пустой поиск'
}

const formatTimestamp = (ts: number): string => {
    const date = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts

    if (diff < 60000) return 'только что'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`
    if (date.toDateString() === now.toDateString()) return 'сегодня'

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const SearchInput = ({
    value,
    onUpdate,
    placeholder = 'Поиск...',
    debounceMs = 300,
    fullWidth = false,
    size = 'l',
    endContent,
    getSearchHistory,
    onApplyHistory,
    showClear = true,
}: SearchInputProps) => {
    const [localValue, setLocalValue] = useState(value)

    // Синхронизация с внешним значением
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Дебаунс
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onUpdate(localValue)
            }
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [localValue, debounceMs, onUpdate, value])

    const handleUpdate = useCallback((newValue: string) => {
        setLocalValue(newValue)
    }, [])

    const handleClear = useCallback(() => {
        setLocalValue('')
        onUpdate('')
    }, [onUpdate])

    const historyItems = getSearchHistory?.() || []

    const renderEndContent = () => {
        const elements: ReactNode[] = []

        // Кнопка очистки
        if (showClear && localValue) {
            elements.push(
                <Button
                    key="clear"
                    view="flat"
                    size="xs"
                    onClick={handleClear}
                    style={{ marginRight: 4 }}
                >
                    <Icon data={Xmark} size={14} />
                </Button>,
            )
        }

        // История поиска
        if (getSearchHistory && onApplyHistory && historyItems.length > 0) {
            elements.push(
                <DropdownMenu
                    key="history"
                    items={historyItems.map((entry) => ({
                        action: () => onApplyHistory(entry),
                        text: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Text variant="body-1">{formatHistoryLabel(entry)}</Text>
                                <Text variant="caption-2" color="secondary">
                                    {formatTimestamp(entry.timestamp)}
                                </Text>
                            </div>
                        ),
                    }))}
                    renderSwitcher={(props) => (
                        <Button {...props} view="flat" size="xs" style={{ marginRight: 4 }}>
                            <Icon data={ClockArrowRotateLeft} size={16} />
                        </Button>
                    )}
                />,
            )
        }

        // Дополнительный контент
        if (endContent) {
            elements.push(<span key="custom">{endContent}</span>)
        }

        return elements.length > 0 ? <>{elements}</> : undefined
    }

    return (
        <div style={{ width: fullWidth ? '100%' : 'auto' }}>
            <TextInput
                placeholder={placeholder}
                value={localValue}
                onUpdate={handleUpdate}
                size={size}
                startContent={<Magnifier style={{ margin: '0 4px' }} />}
                endContent={renderEndContent()}
                style={{ width: '100%' }}
            />
        </div>
    )
}

export default SearchInput
