import { useState } from 'react'
import { Button, Card, Dialog, Text } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { io } from 'socket.io-client'
import { getActiveServerUrl } from '@/services/serverStorage'

type OperatorCommand = 'clear-cache' | 'logout'

interface OperatorCommandResponse {
    success: boolean
    error?: string
    affected?: number
}

const sendOperatorCommand = (
    projectId: number,
    command: OperatorCommand,
): Promise<OperatorCommandResponse> => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
        return Promise.reject(new Error('Нет токена администратора. Войдите заново.'))
    }

    return new Promise((resolve, reject) => {
        const socket = io(`${getActiveServerUrl()}/operator-control`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            autoConnect: false,
        })
        let settled = false

        const finish = (error?: Error, result?: OperatorCommandResponse) => {
            if (settled) {
                return
            }
            settled = true
            socket.disconnect()
            if (error) {
                reject(error)
            } else if (!result?.success) {
                reject(new Error(result?.error || 'Не удалось выполнить команду'))
            } else {
                resolve(result)
            }
        }

        socket.once('connect_error', (error) => finish(error))
        socket.once('connect', () => {
            socket.timeout(10_000).emit(
                'admin:command',
                { projectId, command },
                (error: Error | null, result: OperatorCommandResponse) => {
                    finish(error ?? undefined, result)
                },
            )
        })
        socket.connect()
    })
}

const OperatorActionsSection = () => {
    const { id } = useParams<{ id: string }>()
    const projectId = Number(id)
    const { enqueueSnackbar } = useSnackbar()
    const [activeCommand, setActiveCommand] = useState<OperatorCommand | null>(null)
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

    const executeCommand = async (command: OperatorCommand) => {
        setActiveCommand(command)
        try {
            const result = await sendOperatorCommand(projectId, command)
            const action =
                command === 'clear-cache' ? 'Очистка кеша отправлена' : 'Выход отправлен'
            enqueueSnackbar(
                `${action}. Операторов онлайн: ${result.affected ?? 0}.`,
                { variant: 'success' },
            )
            setIsLogoutDialogOpen(false)
        } catch (error) {
            enqueueSnackbar(
                error instanceof Error ? error.message : 'Ошибка отправки команды операторам',
                { variant: 'error' },
            )
        } finally {
            setActiveCommand(null)
        }
    }

    return (
        <>
            <Card style={{ padding: '24px' }}>
                <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
                    Операторы
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        view="outlined"
                        size="l"
                        loading={activeCommand === 'clear-cache'}
                        disabled={activeCommand !== null || !projectId}
                        onClick={() => void executeCommand('clear-cache')}
                    >
                        Очистить кеш у всех
                    </Button>
                    <Button
                        view="outlined-danger"
                        size="l"
                        disabled={activeCommand !== null || !projectId}
                        onClick={() => setIsLogoutDialogOpen(true)}
                    >
                        Выйти у всех
                    </Button>
                </div>
            </Card>

            <Dialog
                open={isLogoutDialogOpen}
                onClose={() => {
                    if (activeCommand === null) {
                        setIsLogoutDialogOpen(false)
                    }
                }}
            >
                <Dialog.Header caption="Выйти у всех операторов?" />
                <Dialog.Body>
                    Операторы мероприятия будут разлогинены и перенаправлены на страницу входа.
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setIsLogoutDialogOpen(false)}
                    onClickButtonApply={() => void executeCommand('logout')}
                    textButtonCancel="Отмена"
                    textButtonApply="Выйти у всех"
                    propsButtonCancel={{ disabled: activeCommand !== null }}
                    propsButtonApply={{
                        view: 'outlined-danger',
                        loading: activeCommand === 'logout',
                    }}
                />
            </Dialog>
        </>
    )
}

export default OperatorActionsSection
