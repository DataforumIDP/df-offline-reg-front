import { Text, Card } from '@gravity-ui/uikit'

const ProjectSchemeSection = () => {
  return (
    <Card style={{ padding: '24px' }}>
      <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
        Схема проекта
      </Text>
      <div style={{ padding: '32px', backgroundColor: 'var(--g-color-bg-secondary)', borderRadius: '4px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="body-1" color="secondary">
          Схема будет добавлена позже
        </Text>
      </div>
    </Card>
  )
}

export default ProjectSchemeSection
