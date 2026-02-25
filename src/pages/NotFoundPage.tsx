import { Button, Text, Flex } from '@gravity-ui/uikit'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
    const navigate = useNavigate()

    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="4"
            style={{
                minHeight: 'calc(100vh - 300px)',
            }}
        >
            <Text variant="display-2" style={{ fontSize: '4rem', fontWeight: 'bold' }}>
                404
            </Text>
            <Text variant="header-1">Страница не найдена</Text>
            <Text variant="body-1" color="secondary">
                Извините, запрашиваемая страница не существует.
            <Text variant="body-1" color="secondary">
                {`Текущий адрес: ${window.location.href}`}
            </Text>
            </Text>
            <Button view="action" size="l" onClick={() => navigate('/')}>
                На главную
            </Button>
        </Flex>
    )
}

export default NotFoundPage
