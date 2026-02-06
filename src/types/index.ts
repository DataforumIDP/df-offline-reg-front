// Пример типов для приложения

export interface User {
    id: string
    name: string
    email: string
    createdAt: string
}

export interface ApiResponse<T> {
    data: T
    message?: string
    success: boolean
}

export interface ApiError {
    message: string
    code: string
    status: number
}
