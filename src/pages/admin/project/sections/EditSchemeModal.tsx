import { Dialog, TextInput, Checkbox } from '@gravity-ui/uikit'
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

  useEffect(() => {
    if (field?.config?.type === 'list' && field?.config?.listSettings) {
      const items = field.config.listSettings.items.map((item: any, index: number) => ({
        id: `${field.id}_${index}`,
        value: item.value,
        color: item.color || '#4a90e2',
      }))
      setListItems(items)
      setListMultiple(field.config.listSettings.multiple || false)
    }
  }, [field, open])

  const handleClose = () => {
    setListItems([])
    setListMultiple(false)
    setErrors({})
    onClose()
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    if (field?.config?.type === 'list' && listItems.length === 0) {
      newErrors.listItems = 'Добавьте хотя бы один вариант для списка'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const config: any = {
      type: field.config.type,
      uniq: field.config.uniq,
    }

    if (field.config.type === 'text' && field.config.maxLength) {
      config.maxLength = field.config.maxLength
    }

    if (field.config.type === 'list') {
      config.listSettings = {
        multiple: listMultiple,
        items: listItems.map((item) => ({
          value: item.value,
          color: item.color,
        })),
      }
    }

    updateMutation.mutate(
      { config },
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
          {/* Название поля - readonly */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Название поля
            </label>
            <TextInput value={field.label} disabled size="l" />
          </div>

          {/* Ключ - readonly */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Ключ (для API)
            </label>
            <TextInput value={field.key} disabled size="l" />
          </div>

          {/* Тип данных - readonly */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Тип данных
            </label>
            <TextInput
              value={
                {
                  text: 'Текст',
                  list: 'Список',
                  bool: 'Чекбокс',
                  id: 'Идентификатор',
                  img: 'Изображение',
                  code: 'Код',
                }[field.config.type as string] || field.config.type
              }
              disabled
              size="l"
            />
          </div>

          {/* Уникальное значение - readonly */}
          <div style={{ padding: '12px', backgroundColor: 'var(--g-color-bg-secondary)', borderRadius: '4px' }}>
            <Checkbox checked={field.config.uniq} disabled>
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
