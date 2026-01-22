import { Button, TextInput, Icon, DropdownMenu } from '@gravity-ui/uikit'
import { Plus, Ellipsis } from '@gravity-ui/icons'

interface ListItem {
  id: string
  value: string
  color: string
}

interface ListItemsInputProps {
  items: ListItem[]
  onItemsChange: (items: ListItem[]) => void
  error?: boolean
  errorMessage?: string
}

const ListItemsInput = ({ items, onItemsChange, error, errorMessage }: ListItemsInputProps) => {
  const addItem = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    onItemsChange([...items, { id: newId, value: '', color: '#4a90e2' }])
  }

  const updateItem = (id: string, field: 'value' | 'color', newValue: string) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, [field]: newValue } : item))
    )
  }

  const deleteItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id))
  }

  const editItem = (id: string) => {
    // Редактирование для list типа будет реализовано позже
    console.log('Edit item:', id)
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <Button onClick={addItem} view="outlined" size="l" style={{ width: '100%' }}>
          <Icon data={Plus} /> Добавить вариант
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <TextInput
              value={item.value}
              onUpdate={(value) => updateItem(item.id, 'value', value)}
              placeholder="Введите вариант"
              size="l"
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={item.color}
                onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '4px',
                  border: '1px solid var(--g-color-line-generic)',
                  cursor: 'pointer',
                  padding: '0',
                }}
              />
              <DropdownMenu
                items={[
                  {
                    text: 'Редактировать',
                    action: () => editItem(item.id),
                  },
                  {
                    text: 'Удалить',
                    action: () => deleteItem(item.id),
                    theme: 'danger',
                  },
                ]}
              >
                <Button view="flat-secondary" size="l">
                  <Icon data={Ellipsis} />
                </Button>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {error && errorMessage && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--g-color-text-danger)' }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default ListItemsInput
