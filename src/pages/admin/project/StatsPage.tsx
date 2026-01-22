import { Text, Card } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'

const ProjectStatsPage = () => {
  const { id: _projectId } = useParams()

  // TODO: Загрузка статистики из API
  const stats = {
    CREATE: 150,
    UPDATE: 320,
    DELETE: 5,
    PRINT: 89,
  }

  return (
    <div style={{ padding: '24px' }}>
      <Text variant="display-1" style={{ marginBottom: '24px', display: 'block' }}>
        Статистика
      </Text>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <Text variant="display-2" color="positive">{stats.CREATE}</Text>
          <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
            Создано
          </Text>
        </Card>

        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <Text variant="display-2" color="info">{stats.UPDATE}</Text>
          <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
            Обновлено
          </Text>
        </Card>

        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <Text variant="display-2" color="danger">{stats.DELETE}</Text>
          <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
            Удалено
          </Text>
        </Card>

        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <Text variant="display-2" color="warning">{stats.PRINT}</Text>
          <Text variant="body-2" color="secondary" style={{ marginTop: '8px', display: 'block' }}>
            Напечатано
          </Text>
        </Card>
      </div>
    </div>
  )
}

export default ProjectStatsPage
