import { Navigate, useLocation } from 'react-router-dom'
import { Loader, Flex } from '@gravity-ui/uikit'
import { useAppSelector } from '@store/hooks'
import { UserRole, RoleLevel } from '@/types/auth'

interface ProtectedRouteProps {
    children: React.ReactNode
    /** Минимальная роль для доступа к маршруту */
    minRole?: UserRole
}

/**
 * Компонент-обёртка для защищённых маршрутов.
 * Проверяет авторизацию и уровень доступа пользователя.
 *
 * @param minRole - минимальная роль для доступа (по умолчанию OPERATOR)
 *
 * Логика доступа:
 * - ADMIN (уровень 2) имеет доступ ко всем маршрутам
 * - OPERATOR (уровень 1) имеет доступ только к маршрутам с minRole <= OPERATOR
 */
const ProtectedRoute = ({ children, minRole = UserRole.OPERATOR }: ProtectedRouteProps) => {
    const location = useLocation()
    const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth)

    // Показываем лоадер пока проверяем авторизацию
    if (isLoading) {
        return (
            <Flex alignItems="center" justifyContent="center" style={{ minHeight: '100vh' }}>
                <Loader size="l" />
            </Flex>
        )
    }

    // Если не авторизован - редирект на страницу входа
    if (!isAuthenticated || !user) {
        // Сохраняем путь, куда хотел попасть пользователь
        return <Navigate to="/login/operator" state={{ from: location }} replace />
    }

    // Проверяем уровень доступа
    const userLevel = RoleLevel[user.role]
    const requiredLevel = RoleLevel[minRole]

    if (userLevel < requiredLevel) {
        // Недостаточно прав - редирект на главную или страницу 403
        return <Navigate to="/forbidden" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute
