import { Card, Text, Flex } from '@gravity-ui/uikit'
import CreatePageButton from '@components/atoms/CreatePageButton'

/**
 * Пример использования кнопки из Figma макета
 * File: DF-PRO (k0Q7g7eTPrHqFVSzb7i1xx)
 * Node: 182-1120
 */
const FigmaComponentShowcase = () => {
  const handleCreatePage = () => {
    console.warn('Creating new page...')
  }

  return (
    <Card view="raised" style={{ padding: '24px' }}>
      <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
        Компоненты из Figma макета
      </Text>

      <Flex direction="column" gap="4" style={{ marginTop: '16px' }}>
        <Flex direction="column" gap="2">
          <Text variant="body-2" color="secondary">
            Кнопка &quot;Создать страницу&quot;
          </Text>
          <CreatePageButton onClick={handleCreatePage} />
        </Flex>
      </Flex>
    </Card>
  )
}

export default FigmaComponentShowcase
