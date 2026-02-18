import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Text, Spin, Alert } from '@gravity-ui/uikit'
import QRCodeStyling from 'qr-code-styling'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'
import type { AuthUser, UserRole } from '@/types/auth'
import styles from './QrLogin.module.css'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface AuthResponse {
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

export const QrLogin = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const socketRef = useRef<Socket | null>(null)
    const qrRef = useRef<HTMLDivElement>(null)
    const qrCodeRef = useRef<QRCodeStyling | null>(null)
    const [code, setCode] = useState<string | null>(null)
    const [ttl, setTtl] = useState<number>(0)
    const [status, setStatus] = useState<'connecting' | 'waiting' | 'expired' | 'error'>('connecting')
    const [error, setError] = useState<string | null>(null)

    // Инициализация QR кода
    useEffect(() => {
        qrCodeRef.current = new QRCodeStyling({
            width: 200,
            height: 200,
            type: 'svg',
            margin: 2,
            dotsOptions: {
                color: '#000',
                type: 'rounded',
            },
            backgroundOptions: {
                color: '#fff',
            },
            cornersSquareOptions: {
                type: 'extra-rounded',
            },
            cornersDotOptions: {
                type: 'dot',
            },
        })
    }, [])

    // Обновление QR кода при изменении кода
    useEffect(() => {
        if (code && qrCodeRef.current && qrRef.current) {
            qrCodeRef.current.update({
                data: `REGA_AUTH:${code}`,
            })
            qrRef.current.innerHTML = ''
            qrCodeRef.current.append(qrRef.current)
        }
    }, [code])

    useEffect(() => {
        // Подключаемся к Socket.IO namespace /qr-auth
        const socket = io(`${API_URL}/qr-auth`, {
            transports: ['websocket', 'polling'],
        })
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('[QR Login] Connected to server')
            // Запрашиваем код
            socket.emit('request-code')
        })

        socket.on('code-generated', (data: { code: string; ttl: number }) => {
            console.log('[QR Login] Code generated:', data.code)
            setCode(data.code)
            setTtl(data.ttl)
            setStatus('waiting')
        })

        socket.on('authenticated', (data: AuthResponse) => {
            console.log('[QR Login] Authenticated!')
            // Сохраняем токены в localStorage
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            
            // Сохраняем пользователя в Redux (приводим role к UserRole)
            const user: AuthUser = {
                ...data.account,
                role: data.account.role as UserRole,
            }
            dispatch(setUser(user))
            
            // Редирект на главную
            navigate('/admin/projects')
        })

        socket.on('code-expired', () => {
            setStatus('expired')
            setCode(null)
        })

        socket.on('connect_error', (err) => {
            console.error('[QR Login] Connection error:', err)
            setStatus('error')
            setError('Ошибка подключения к серверу')
        })

        socket.on('disconnect', () => {
            console.log('[QR Login] Disconnected')
        })

        return () => {
            socket.disconnect()
        }
    }, [dispatch, navigate])

    // Таймер обратного отсчёта
    useEffect(() => {
        if (ttl <= 0) return

        const interval = setInterval(() => {
            setTtl((prev) => {
                if (prev <= 1) {
                    setStatus('expired')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [ttl > 0])

    const handleRetry = () => {
        setStatus('connecting')
        setError(null)
        socketRef.current?.emit('request-code')
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className={styles.container}>
            <Text variant="subheader-2" className={styles.title}>
                Вход по QR-коду
            </Text>
            <Text variant="body-2" color="secondary" className={styles.description}>
                Отсканируйте QR-код с авторизованного устройства
            </Text>

            <div className={styles.qrContainer}>
                {status === 'connecting' && (
                    <div className={styles.loading}>
                        <Spin size="l" />
                        <Text variant="body-2" color="secondary">
                            Подключение...
                        </Text>
                    </div>
                )}

                {status === 'waiting' && code && (
                    <>
                        <div ref={qrRef} className={styles.qrCode} />
                        <Text variant="body-2" color="secondary">
                            Код действителен: {formatTime(ttl)}
                        </Text>
                    </>
                )}

                {status === 'expired' && (
                    <div className={styles.expired}>
                        <Text variant="body-2" color="secondary">
                            Код истёк
                        </Text>
                        <button onClick={handleRetry} className={styles.retryLink}>
                            Получить новый код
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <Alert
                        theme="danger"
                        message={error || 'Ошибка подключения'}
                        actions={
                            <button onClick={handleRetry} className={styles.retryLink}>
                                Повторить
                            </button>
                        }
                    />
                )}
            </div>
        </div>
    )
}
