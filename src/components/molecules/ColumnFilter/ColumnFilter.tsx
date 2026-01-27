import { useState, useCallback, useRef } from 'react'
import { Button, Popup, TextInput, Select, Icon } from '@gravity-ui/uikit'
import { Funnel } from '@gravity-ui/icons'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'

export interface ColumnFilterProps {
  field: SchemeField
  value: string | string[] | undefined
  onChange: (key: string, value: string | string[] | undefined) => void
}

/**
 * Компонент фильтра для колонки таблицы
 * Для list/multiList типов показывает Select
 * Для остальных - TextInput
 */
export const ColumnFilter = ({ field, value, onChange }: ColumnFilterProps) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isActive = value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== '')

  const handleOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Предотвращаем срабатывание сортировки
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleTextChange = useCallback((newValue: string) => {
    onChange(field.key, newValue || undefined)
  }, [field.key, onChange])

  const handleSelectChange = useCallback((newValues: string[]) => {
    onChange(field.key, newValues.length > 0 ? newValues : undefined)
  }, [field.key, onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(field.key, undefined)
    setOpen(false)
  }, [field.key, onChange])

  const isListType = field.config.type === 'list'
  const listItems = field.config.listSettings?.items || []
  const isMultiple = field.config.listSettings?.multiple || false

  // Опции для Select
  const selectOptions = listItems.map((item) => ({
    value: item.value,
    content: item.value,
  }))

  return (
    <>
      <Button
        ref={buttonRef}
        view="flat"
        size="xs"
        onClick={handleOpen}
        style={{ marginLeft: 4 }}
      >
        <Icon data={Funnel} size={14} />
        {isActive && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              backgroundColor: 'var(--g-color-base-info)',
              borderRadius: '50%',
            }}
          />
        )}
      </Button>

      <Popup
        open={open}
        anchorRef={buttonRef}
        onClose={handleClose}
        placement="bottom-start"
      >
        <div
          style={{
            padding: 12,
            minWidth: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            Фильтр: {field.label}
          </div>

          {isListType ? (
            <Select
              multiple={isMultiple}
              value={Array.isArray(value) ? value : value ? [value] : []}
              options={selectOptions}
              onUpdate={handleSelectChange}
              placeholder="Выберите значения"
              width="max"
              filterable
            />
          ) : (
            <TextInput
              value={typeof value === 'string' ? value : ''}
              onUpdate={handleTextChange}
              placeholder="Введите значение"
              autoFocus
            />
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button view="flat" size="s" onClick={handleClear}>
              Сбросить
            </Button>
            <Button view="action" size="s" onClick={handleClose}>
              Применить
            </Button>
          </div>
        </div>
      </Popup>
    </>
  )
}

export default ColumnFilter
