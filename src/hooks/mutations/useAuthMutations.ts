import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { setUser, clearUser } from '@/store/slices/authSlice'
import {
    fetchLoginAdmin,
    fetchLoginOperator,
    fetchLogout,
    fetchRegisterOperator,
} from '@/services/api/auth'
import type { LoginRequest, LoginResponse, FormErrors, RegisterOperatorRequest } from '@/types/auth'
import { AxiosError } from 'axios'

const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
}

const clearTokens = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
}

/**
 * Парсит ошибки из ответа сервера
 * Поддерживает форматы:
 * - {"errors": {"field": "message"}}
 * - {"error": "message"}
 * - Другие форматы ошибок Axios
 */
const parseErrorResponse = (error: unknown): FormErrors => {
    const errors: FormErrors = {}

    if (error instanceof AxiosError) {
        const data = error.response?.data as any

        // Формат: {"errors": {"field": "message", ...}}
        if (data?.errors && typeof data.errors === 'object') {
            Object.assign(errors, data.errors)
            return errors
        }

        // Формат: {"error": "message"}
        if (data?.error && typeof data.error === 'string') {
            errors.authorize = data.error
            return errors
        }

        // Стандартные HTTP коды
        if (error.response?.status === 401) {
            errors.authorize = 'Неверный логин или пароль'
            return errors
        }

        if (error.response?.status === 403) {
            errors.authorize = 'Доступ запрещён'
            return errors
        }

        if (!error.response) {
            errors.authorize = 'Ошибка сети. Проверьте подключение к интернету'
            return errors
        }
    }

    errors.authorize = 'Произошла ошибка. Попробуйте позже'
    return errors
}

class AuthError extends Error {
    constructor(public errors: FormErrors) {
        super(JSON.stringify(errors))
        this.name = 'AuthError'
    }
}

/**
 * Мутация для авторизации администратора
 */
export const useLoginAdminMutation = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    return useMutation<LoginResponse, AuthError, LoginRequest>({
        mutationFn: async (credentials) => {
            try {
                return await fetchLoginAdmin(credentials)
            } catch (error) {
                const errors = parseErrorResponse(error)
                throw new AuthError(errors)
            }
        },
        onSuccess: (data) => {
            const { accessToken, refreshToken, user } = data
            saveTokens(accessToken, refreshToken)
            dispatch(setUser(user))
            navigate('/admin/projects')
        },
    })
}

/**
 * Мутация для авторизации оператора
 */
export const useLoginOperatorMutation = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    return useMutation<LoginResponse, AuthError, LoginRequest>({
        mutationFn: async (credentials) => {
            try {
                return await fetchLoginOperator(credentials)
            } catch (error) {
                const errors = parseErrorResponse(error)
                throw new AuthError(errors)
            }
        },
        onSuccess: (data) => {
            const { accessToken, refreshToken, user } = data
            saveTokens(accessToken, refreshToken)
            dispatch(setUser(user))

            if (user.projectId) {
                navigate(`/operator/projects/${user.projectId}`)
            } else {
                navigate('/operator')
            }
        },
    })
}

/**
 * Мутация для регистрации оператора (вход по коду мероприятия и ФИО)
 */
export const useRegisterOperatorMutation = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    return useMutation<LoginResponse, AuthError, RegisterOperatorRequest>({
        mutationFn: async (data) => {
            try {
                return await fetchRegisterOperator(data)
            } catch (error) {
                const errors = parseErrorResponse(error)
                throw new AuthError(errors)
            }
        },
        onSuccess: (data) => {
            const { accessToken, refreshToken, user } = data
            saveTokens(accessToken, refreshToken)
            dispatch(setUser(user))
            navigate('/operator/participants')
        },
    })
}

/**
 * Мутация для выхода из системы
 */
export const useLogoutMutation = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    return useMutation<void, Error>({
        mutationFn: fetchLogout,
        onSettled: () => {
            clearTokens()
            dispatch(clearUser())
            navigate('/')
        },
    })
}

export { parseErrorResponse, AuthError }
