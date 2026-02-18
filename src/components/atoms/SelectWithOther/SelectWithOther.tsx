import { Select, TextInput } from '@gravity-ui/uikit'
import { useState, useEffect, useMemo } from 'react'

interface ListItem {
    value: string
    color?: string
}

interface SelectWithOtherProps {
    items: ListItem[]
    value: string | string[]
    multiple?: boolean
    disabled?: boolean
    placeholder?: string
    size?: 's' | 'm' | 'l' | 'xl'
    onUpdate: (value: string | string[]) => void
}

/**
 * Select с поддержкой произвольного значения.
 * Если в items есть элемент с value="_", показываем опцию "Другое"
 * и при её выборе позволяем ввести произвольный текст.
 */
const SelectWithOther = ({
    items,
    value,
    multiple = false,
    disabled = false,
    placeholder,
    size = 'l',
    onUpdate,
}: SelectWithOtherProps) => {
    // Проверяем наличие "_" в items
    const otherItem = items.find((item) => item.value === '_')
    const hasOther = !!otherItem

    // Фильтруем items без "_"
    const regularItems = useMemo(
        () => items.filter((item) => item.value !== '_'),
        [items],
    )

    // Список всех известных значений
    const knownValues = useMemo(
        () => new Set(regularItems.map((item) => item.value)),
        [regularItems],
    )

    // Определяем, является ли текущее значение "другим" (не из списка)
    const isOtherValue = useMemo(() => {
        if (!hasOther) return false
        if (multiple) {
            const arr = Array.isArray(value) ? value : []
            return arr.some((v) => !knownValues.has(v))
        } else {
            const val = Array.isArray(value) ? value[0] : value
            return val && !knownValues.has(val)
        }
    }, [hasOther, value, multiple, knownValues])

    // Состояние для показа input "Другое"
    const [showOtherInput, setShowOtherInput] = useState(isOtherValue)
    const [otherText, setOtherText] = useState('')

    // Инициализация при изменении value
    useEffect(() => {
        if (isOtherValue) {
            setShowOtherInput(true)
            if (multiple) {
                const arr = Array.isArray(value) ? value : []
                const otherVals = arr.filter((v) => !knownValues.has(v))
                setOtherText(otherVals.join(', '))
            } else {
                const val = Array.isArray(value) ? value[0] : value
                setOtherText(val || '')
            }
        } else {
            setShowOtherInput(false)
            setOtherText('')
        }
    }, [value, isOtherValue, multiple, knownValues])

    // Формируем опции для Select
    const options = useMemo(() => {
        const opts = regularItems.map((item) => ({
            value: item.value,
            content: item.value,
        }))

        if (hasOther) {
            opts.push({
                value: '_other_',
                content: 'Другое...',
            })
        }

        return opts
    }, [regularItems, hasOther])

    // Текущее значение для Select
    const selectValue = useMemo(() => {
        if (showOtherInput) {
            if (multiple) {
                const arr = Array.isArray(value) ? value : []
                const known = arr.filter((v) => knownValues.has(v))
                return [...known, '_other_']
            }
            return ['_other_']
        }

        if (multiple) {
            return Array.isArray(value) ? value : []
        }
        return value ? [value as string] : []
    }, [value, multiple, showOtherInput, knownValues])

    const handleSelectUpdate = (selected: string[]) => {
        const hasOtherSelected = selected.includes('_other_')

        if (hasOtherSelected) {
            setShowOtherInput(true)
            if (!multiple) {
                // Для single select сразу переключаемся на Other
                onUpdate('')
            } else {
                // Для multiple - оставляем выбранные + флаг
                const known = selected.filter((v) => v !== '_other_' && knownValues.has(v))
                onUpdate(known)
            }
        } else {
            setShowOtherInput(false)
            setOtherText('')
            if (multiple) {
                onUpdate(selected)
            } else {
                onUpdate(selected[0] || '')
            }
        }
    }

    const handleOtherTextUpdate = (text: string) => {
        setOtherText(text)
        if (multiple) {
            const arr = Array.isArray(value) ? value : []
            const known = arr.filter((v) => knownValues.has(v))
            const other = text.trim() ? [text.trim()] : []
            onUpdate([...known, ...other])
        } else {
            onUpdate(text.trim())
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Select
                value={selectValue}
                width="max"
                multiple={multiple}
                disabled={disabled}
                onUpdate={handleSelectUpdate}
                options={options}
                size={size}
                placeholder={placeholder}
            />
            {showOtherInput && (
                <TextInput
                    value={otherText}
                    onUpdate={handleOtherTextUpdate}
                    placeholder="Введите значение"
                    disabled={disabled}
                    size={size}
                />
            )}
        </div>
    )
}

export default SelectWithOther
