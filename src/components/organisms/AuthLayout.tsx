import { Outlet } from 'react-router-dom'
import { Flex, Text } from '@gravity-ui/uikit'

/**
 * Лейаут для страниц авторизации (логин оператора/админа)
 */
const AuthLayout = () => {
    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--g-color-base-background)',
                padding: '24px',
            }}
        >
            {/* Логотип / Заголовок */}
            <Flex direction="column" alignItems="center" gap="2" style={{ marginBottom: '32px' }}>
                <Text variant="display-1" color="brand">
                    Offline Registration
                </Text>
                <Text variant="body-2" color="secondary">
                    Система регистрации участников
                </Text>
            </Flex>

            {/* Контент страницы авторизации */}
            <Flex
                direction="column"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'var(--g-color-base-float)',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 4px 24px var(--g-color-sfx-shadow)',
                }}
            >
                <Outlet />
            </Flex>

            {/* Подвал */}
            <Text variant="body-1" color="hint" style={{ marginTop: '24px' }}>
                © 2025 Offline Registration
            </Text>
        </Flex>
    )
}

export default AuthLayout
