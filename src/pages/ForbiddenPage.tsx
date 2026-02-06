import { Text, Button, Flex } from '@gravity-ui/uikit'
import { useNavigate } from 'react-router-dom'

/**
 * Страница 403 - Доступ запрещён
 */
const ForbiddenPage = () => {
    const navigate = useNavigate()

    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="4"
            style={{ minHeight: '60vh' }}
        >
            <Text variant="display-2" color="danger">
                403
            </Text>
            <Text variant="header-1">Доступ запрещён</Text>
            <Text variant="body-2" color="secondary">
                У вас недостаточно прав для просмотра этой страницы
            </Text>
            <Flex gap="3" style={{ marginTop: '16px' }}>
                <Button view="action" size="l" onClick={() => navigate(-1)}>
                    Назад
                </Button>
                <Button view="normal" size="l" onClick={() => navigate('/')}>
                    На главную
                </Button>
            </Flex>
        </Flex>
    )
}

export default ForbiddenPage
