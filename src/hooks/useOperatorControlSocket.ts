import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearUser } from '@/store/slices/authSlice'
import { resetApplicationState } from '@/store/store'
import { getActiveServerUrl } from '@/services/serverStorage'
import { OPERATOR_CACHE_CLEAR_EVENT } from '@/utils/operatorControlEvents'

export const useOperatorControlSocket = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const user = useAppSelector((state) => state.auth.user)

    useEffect(() => {
        if (user?.role !== 'operator' || !user.projectId) {
            return
        }

        const token = localStorage.getItem('accessToken')
        if (!token) {
            return
        }

        const socket = io(`${getActiveServerUrl()}/operator-control`, {
            auth: { token },
            transports: ['websocket', 'polling'],
        })

        socket.on('operator:clear-cache', () => {
            window.dispatchEvent(new Event(OPERATOR_CACHE_CLEAR_EVENT))
        })

        socket.on('operator:logout', () => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            dispatch(resetApplicationState())
            dispatch(clearUser())
            navigate('/operator', { replace: true })
        })

        socket.on('connect_error', (error) => {
            console.error('Не удалось подключить команды оператора', error)
        })

        return () => {
            socket.disconnect()
        }
    }, [dispatch, navigate, user?.projectId, user?.role])
}
