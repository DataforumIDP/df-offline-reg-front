import { Text, Button, Card } from '@gravity-ui/uikit'

const ExportImportSection = () => {
  return (
    <Card style={{ padding: '24px' }}>
      <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
        Экспорт и импорт
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Button view="outlined" size="l">
          Скачать шаблон импорта
        </Button>

        <Button view="outlined" size="l">
          Загрузить заполненный шаблон
        </Button>

        <Button view="outlined" size="l">
          Выгрузка участников
        </Button>

        <Button view="outlined" size="l">
          Выгрузка сканов
        </Button>
      </div>
    </Card>
  )
}

export default ExportImportSection
