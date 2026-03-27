import { useEffect } from 'react'
import { Button, Text } from '@gravity-ui/uikit'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks'

const MainPage = () => {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAppSelector((state) => state.auth)

    // Если пользователь авторизирован, перенаправляем его
    useEffect(() => {
        console.log(user?.role)
        if (!isAuthenticated || !user) {
            // Не авторизирован - показываем страницу
            return
        }

        // Авторизирован - редиректим
        if (user.role === 'admin') {
            navigate('/admin/projects')
        } else {
            navigate('/operator/table')
        }
    }, [user, isAuthenticated, navigate])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                gap: '24px',
                padding: '20px',
            }}
        >
            <Text variant="display-2">REGA</Text>
            <Button
                style={{ minWidth: 240 }}
                view="action"
                size="xl"
                onClick={() => navigate('/admin')}
            >
                Войти как админ
            </Button>
            <Button
                style={{ minWidth: 240 }}
                view="action"
                disabled
                size="xl"
                onClick={() => navigate('/partner')}
            >
                Войти как партнер
            </Button>
            <Button
                style={{ minWidth: 240 }}
                view="action"
                size="xl"
                onClick={() => navigate('/operator')}
            >
                Войти как оператор
            </Button>
            <Text variant="body-2" color="secondary">
                V {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
            </Text>
        </div>
    )
}

export default MainPage
