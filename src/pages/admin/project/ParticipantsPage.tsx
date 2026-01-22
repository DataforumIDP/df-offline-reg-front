import { Text, Button, TextInput, Table, withTableSelection } from '@gravity-ui/uikit'
import { Plus, Magnifier } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useState } from 'react'

const SelectableTable = withTableSelection(Table)

const ProjectParticipantsPage = () => {
  const { id: _projectId } = useParams()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // TODO: Загрузка участников из API
  const participants = [
    { id: '1', fio: 'Иванов Иван Иванович', email: 'ivanov@example.com', status: 'Подтвержден' },
    { id: '2', fio: 'Петров Петр Петрович', email: 'petrov@example.com', status: 'Ожидает' },
  ]

  const columns = [
    { id: 'id', name: 'ID' },
    { id: 'fio', name: 'ФИО' },
    { id: 'email', name: 'Email' },
    { id: 'status', name: 'Статус' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Text variant="display-1">Участники</Text>
        <Button view="action" size="l">
          <Button.Icon>
            <Plus />
          </Button.Icon>
          Добавить участника
        </Button>
      </div>

      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <TextInput
          placeholder="Поиск участников..."
          value={search}
          onUpdate={setSearch}
          size="l"
          startContent={<Magnifier />}
        />
      </div>

      <SelectableTable
        data={participants}
        columns={columns}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  )
}

export default ProjectParticipantsPage
