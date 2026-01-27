import { TextInput } from '@gravity-ui/uikit'
import { Magnifier } from '@gravity-ui/icons'
import { useState, useEffect, useCallback } from 'react'

export interface SearchInputProps {
  value: string
  onUpdate: (value: string) => void
  placeholder?: string
  debounceMs?: number
  fullWidth?: boolean
  size?: 's' | 'm' | 'l' | 'xl'
}

export const SearchInput = ({
  value,
  onUpdate,
  placeholder = 'Поиск...',
  debounceMs = 300,
  fullWidth = false,
  size = 'l',
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

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      <TextInput
        placeholder={placeholder}
        value={localValue}
        onUpdate={handleUpdate}
        size={size}
        startContent={<Magnifier style={{ margin: '0 4px' }} />}
        style={{ width: '100%' }}
      />
    </div>
  )
}

export default SearchInput
