import { Dialog, TextInput, Checkbox, Select } from '@gravity-ui/uikit'
import { useSnackbar } from 'notistack'
import { useUpdateSchemaMutation } from '@/hooks/mutations/useSchemeMutations'
import ListItemsInput from './ListItemsInput'
import { useState, useEffect } from 'react'

interface ListItem {
  id: string
  value: string
  color: string
}

interface EditSchemeModalProps {
  open: boolean
  onClose: () => void
  field: any
  projectId: string
}

const EditSchemeModal = ({ open, onClose, field, projectId }: EditSchemeModalProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const updateMutation = useUpdateSchemaMutation(projectId, field?.id || 0)

  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listMultiple, setListMultiple] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [label, setLabel] = useState('')
  const [keyValue, setKeyValue] = useState('')
  const [typeValue, setTypeValue] = useState<'text' | 'list' | 'bool' | 'id' | 'img' | 'code'>('text')
  const [uniq, setUniq] = useState(false)
  const [optional, setOptional] = useState(true)
  const [maxLength, setMaxLength] = useState('')

  useEffect(() => {
    if (!field) return

    setLabel(field.label || '')
    setKeyValue(field.key || '')
    setTypeValue(field.config?.type || 'text')
    setUniq(!!field.config?.uniq)
    setOptional(field.config?.optional !== false)
    setMaxLength(field.config?.maxLength ? String(field.config.maxLength) : '')

    if (field?.config?.type === 'list' && field?.config?.listSettings) {
      const items = field.config.listSettings.items.map((item: any, index: number) => ({
        id: `${field.id}_${index}`,
        value: item.value,
        color: item.color || '#4a90e2',
      }))
      setListItems(items)
      setListMultiple(field.config.listSettings.multiple || false)
    } else {
      setListItems([])
      setListMultiple(false)
    }
  }, [field, open])

  const handleClose = () => {
    setListItems([])
    setListMultiple(false)
    setErrors({})
    setLabel('')
    setKeyValue('')
    setTypeValue('text')
    setUniq(false)
    setOptional(true)
    setMaxLength('')
    onClose()
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    if (!label.trim()) newErrors.label = 'Название обязательно'
    if (!keyValue.trim()) newErrors.key = 'Ключ обязателен'
    if (typeValue === 'text' && maxLength && isNaN(Number(maxLength))) {
      newErrors.maxLength = 'Максимальная длина должна быть числом'
    }
    if (typeValue === 'list' && listItems.length === 0) {
      newErrors.listItems = 'Добавьте хотя бы один вариант для списка'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const config: any = {
      type: typeValue,
      uniq,
      optional,
    }

    if (typeValue === 'text' && maxLength) {
      config.maxLength = Number(maxLength)
    }

    if (typeValue === 'list') {
      config.listSettings = {
        multiple: listMultiple,
        items: listItems.map((item) => ({
          value: item.value,
          color: item.color,
        })),
      }
    }

    // Если ключ изменился — спрашиваем подтверждение, что данные участников будут мигрированы
    if (field.key !== keyValue) {
      const ok = window.confirm('Вы изменили ключ поля. Все данные участников будут автоматически перенесены на новый ключ. Продолжить?')
      if (!ok) return
    }

    updateMutation.mutate(
      { label, key: keyValue, config },
      {
        onSuccess: () => {
          enqueueSnackbar('Поле обновлено', { variant: 'success' })
          handleClose()
        },
        onError: () => {
          enqueueSnackbar('Ошибка при обновлении поля', { variant: 'error' })
        },
      }
    )
  }

  if (!field) return null

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="edit-scheme-modal-title">
      <Dialog.Header caption="Редактировать поле" id="edit-scheme-modal-title" />
      <Dialog.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Название поля */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Название поля *
            </label>
            <TextInput
              value={label}
              onUpdate={(v: string) => { setLabel(v); setErrors({ ...errors, label: '' }) }}
              error={!!errors.label}
              size="l"
            />
            {errors.label && <div style={{ color: 'var(--g-color-danger)', marginTop: 6 }}>{errors.label}</div>}
          </div>

          {/* Ключ */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Ключ (для API) *
            </label>
            <TextInput
              value={keyValue}
              onUpdate={(v: string) => { setKeyValue(v); setErrors({ ...errors, key: '' }) }}
              error={!!errors.key}
              size="l"
            />
            {errors.key && <div style={{ color: 'var(--g-color-danger)', marginTop: 6 }}>{errors.key}</div>}
          </div>

          {/* Тип данных */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Тип данных *
            </label>
            <Select
              value={[typeValue]}
              width={"max"}
              onUpdate={(value) => {
                if (value.length > 0) {
                  setTypeValue(value[0] as any)
                }
              }}
              options={[
                { value: 'text', content: 'Текст' },
                { value: 'list', content: 'Список' },
                { value: 'bool', content: 'Чекбокс' },
                { value: 'id', content: 'Идентификатор' },
                { value: 'img', content: 'Изображение' },
                { value: 'code', content: 'Код' },
              ]}
              size="l"
            />
          </div>

          {/* Уникальное значение */}
          <div style={{ padding: '12px', backgroundColor: 'var(--g-color-bg-secondary)', borderRadius: '4px' }}>
            <Checkbox checked={uniq} onUpdate={(c) => setUniq(c)}>
              Уникальное значение
            </Checkbox>
          </div>

          {/* Редактируемые поля только для list */}
          {field.config.type === 'list' && (
            <>
              <Checkbox
                checked={listMultiple}
                onUpdate={(checked) => setListMultiple(checked)}
              >
                Множественный выбор
              </Checkbox>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
                  Варианты списка *
                </label>
                <ListItemsInput
                  items={listItems}
                  onItemsChange={(items) => {
                    setListItems(items)
                    setErrors({ ...errors, listItems: '' })
                  }}
                  error={!!errors.listItems}
                  errorMessage={errors.listItems}
                />
              </div>
            </>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer
        onClickButtonCancel={handleClose}
        onClickButtonApply={handleSubmit}
        textButtonCancel="Отмена"
        textButtonApply="Сохранить"
        propsButtonApply={{ loading: updateMutation.isPending }}
      />
    </Dialog>
  )
}

export default EditSchemeModal
