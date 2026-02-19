import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import type { AuthUser, UserRole } from '@/types/auth'

export type QrAuthStatus = 'connecting' | 'waiting' | 'expired' | 'error'

interface QrAuthResponse {
    accessToken: string
    refreshToken: string
    account: {
        id: number
        login: string
        name?: string
        role: string
        projectId?: number
    }
}

export const useQrAuth = (apiUrl: string) => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const socketRef = useRef<Socket | null>(null)

    const [code, setCode] = useState<string | null>(null)
    const [ttl, setTtl] = useState(0)
    const [status, setStatus] = useState<QrAuthStatus>('connecting')
    const [error, setError] = useState<string | null>(null)

    const retry = () => {
        setStatus('connecting')
        setError(null)
        socketRef.current?.emit('request-code')
    }

    useEffect(() => {
        const socket = io(`${apiUrl}/qr-auth`, {
            transports: ['websocket', 'polling'],
        })
        socketRef.current = socket

        socket.on('connect', () => {
            socket.emit('request-code')
        })

        socket.on('code-generated', (data: { code: string; ttl: number }) => {
            setCode(data.code)
            setTtl(data.ttl)
            setStatus('waiting')
        })

        socket.on('authenticated', (data: QrAuthResponse) => {
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)

            const user: AuthUser = {
                ...data.account,
                role: data.account.role as UserRole,
            }
            dispatch(setUser(user))
            navigate('/admin/projects')
        })

        socket.on('code-expired', () => {
            setStatus('expired')
            setCode(null)
        })

        socket.on('connect_error', () => {
            setStatus('error')
            setError('Ошибка подключения к серверу')
        })

        return () => {
            socket.disconnect()
        }
    }, [apiUrl, dispatch, navigate])

    return { code, ttl, status, error, retry }
}
