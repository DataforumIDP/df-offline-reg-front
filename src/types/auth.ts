// Роли пользователей
export enum UserRole {
    OPERATOR = 'operator',
    ADMIN = 'admin',
}

// Уровни доступа (чем выше число, тем больше прав)
export const RoleLevel: Record<UserRole, number> = {
    [UserRole.OPERATOR]: 1,
    [UserRole.ADMIN]: 2,
}

// Интерфейс авторизованного пользователя
export interface AuthUser {
    id: number
    login: string
    name?: string
    role: UserRole
    projectId?: number
}

// Состояние авторизации
export interface AuthState {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
}

// Запрос на авторизацию
export interface LoginRequest {
    login: string
    password: string
}

// Ответ от сервера при авторизации
export interface LoginResponse {
    message: string
    accessToken: string
    refreshToken: string
    user: AuthUser
}

// Ошибка API - старый формат
export interface ApiErrorResponse {
    error: string
    code?: string
}

// Ошибка API - новый формат с полями валидации
export interface ApiValidationErrorResponse {
    errors: Record<string, string>
}

// Ошибки формы (группированные по полям)
export interface FormErrors {
    login?: string
    password?: string
    authorize?: string
    [key: string]: string | undefined
}
