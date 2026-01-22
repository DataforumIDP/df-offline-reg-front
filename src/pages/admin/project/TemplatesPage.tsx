import { Text, Button, Card, Select } from '@gravity-ui/uikit'
import { Plus } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useState } from 'react'

const ProjectTemplatesPage = () => {
  const { id: _projectId } = useParams()
  const [selectedTemplate, setSelectedTemplate] = useState<string[]>([])

  // TODO: Загрузка шаблонов из API
  const templates = [
    { value: '1', content: 'Стандартный бейдж' },
    { value: '2', content: 'VIP бейдж' },
    { value: '3', content: 'Бейдж спикера' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Text variant="display-1">Шаблоны печати</Text>
        <Button view="action" size="l">
          <Button.Icon>
            <Plus />
          </Button.Icon>
          Создать шаблон
        </Button>
      </div>

      <Card style={{ padding: '24px', maxWidth: '600px', marginBottom: '24px' }}>
        <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
          Активный шаблон проекта
        </Text>
        <Select
          placeholder="Выберите шаблон"
          options={templates}
          value={selectedTemplate}
          onUpdate={setSelectedTemplate}
          size="l"
          width="max"
        />
        <Button view="action" size="l" style={{ marginTop: '16px' }}>
          Сохранить
        </Button>
      </Card>

      <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
        Все шаблоны
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {templates.map((template) => (
          <Card key={template.value} style={{ padding: '20px' }}>
            <Text variant="header-2">{template.content}</Text>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Button view="outlined" size="m">
                Редактировать
              </Button>
              <Button view="outlined-danger" size="m">
                Удалить
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ProjectTemplatesPage
