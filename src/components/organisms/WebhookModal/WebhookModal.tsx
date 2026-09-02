import { useState, useCallback, useEffect, useMemo } from 'react'
import { Dialog, TextInput, Text, Checkbox, Button, Label, Spin } from '@gravity-ui/uikit'
import { TrashBin, Copy } from '@gravity-ui/icons'
import { useSnackbar } from 'notistack'
import type { Webhook, WebhookLog } from '@/services/api/webhooks'
import {
    useCreateWebhookMutation,
    useUpdateWebhookMutation,
    useDeleteWebhookMutation,
} from '@/hooks/mutations/useWebhookMutations'
import { useWebhookLogsQuery } from '@/hooks/queries/useWebhookQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { getActiveServerUrl } from '@/services/serverStorage'
import { CreateParticipantModal } from '@/components/organisms/CreateParticipantModal'
import { getProjectPrintCopies } from '@/utils/projectPrintSettings'

interface WebhookModalProps {
    open: boolean
    onClose: () => void
    projectId: number
    webhook?: Webhook | null // null = режим создания
}

type LogFilter = 'all' | 'success' | 'error'
type FormTab = 'settings' | 'logs'

function isLogSuccess(log: WebhookLog): boolean {
    return (
        log.errorMessage === null &&
        log.responseStatus !== null &&
        log.responseStatus >= 200 &&
        log.responseStatus < 400
    )
}

function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

/**
 * Модальное окно создания/редактирования webhook
 */
export const WebhookModal = ({ open, onClose, projectId, webhook }: WebhookModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const isEditMode = !!webhook

    // Мутации
    const createMutation = useCreateWebhookMutation(projectId)
    const updateMutation = useUpdateWebhookMutation(projectId)
    const deleteMutation = useDeleteWebhookMutation(projectId)

    // Состояние формы
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [formTab, setFormTab] = useState<FormTab>('settings')

    // Логи
    const [logFilter, setLogFilter] = useState<LogFilter>('all')
    const [logSearch, setLogSearch] = useState('')
    const [createFromLog, setCreateFromLog] = useState<WebhookLog | null>(null)

    const { data: allLogs, isLoading: logsLoading } = useWebhookLogsQuery(
        formTab === 'logs' && webhook ? webhook.slug : undefined,
        200,
    )

    const { data: schemeData } = useSchemeQuery(String(projectId))
    const { data: projectData } = useProjectQuery(projectId)

    const filteredLogs = useMemo(() => {
        if (!allLogs) return []
        let list = allLogs

        if (logFilter === 'success') list = list.filter((l) => isLogSuccess(l))
        if (logFilter === 'error') list = list.filter((l) => !isLogSuccess(l))

        if (logSearch.trim()) {
            const q = logSearch.trim().toLowerCase()
            list = list.filter((l) => {
                return (
                    (l.errorMessage?.toLowerCase().includes(q) ?? false) ||
                    (l.ipAddress?.toLowerCase().includes(q) ?? false) ||
                    String(l.responseStatus ?? '').includes(q) ||
                    JSON.stringify(l.requestBody ?? '').toLowerCase().includes(q) ||
                    JSON.stringify(l.responseBody ?? '').toLowerCase().includes(q)
                )
            })
        }

        return list
    }, [allLogs, logFilter, logSearch])

    // Счётчики для фильтра
    const successCount = useMemo(() => allLogs?.filter(isLogSuccess).length ?? 0, [allLogs])
    const errorCount = useMemo(() => allLogs?.filter((l) => !isLogSuccess(l)).length ?? 0, [allLogs])

    // Инициализация при открытии
    useEffect(() => {
        if (open) {
            if (webhook) {
                setName(webhook.name)
                setSlug(webhook.slug)
                setIsActive(webhook.isActive)
            } else {
                setName('')
                setSlug('')
                setIsActive(true)
            }
            setErrors({})
            setDeleteConfirm(false)
            setFormTab('settings')
            setLogFilter('all')
            setLogSearch('')
            setCreateFromLog(null)
        }
    }, [open, webhook])

    const handleClose = useCallback(() => {
        setName('')
        setSlug('')
        setIsActive(true)
        setErrors({})
        setDeleteConfirm(false)
        setFormTab('settings')
        setLogFilter('all')
        setLogSearch('')
        setCreateFromLog(null)
        onClose()
    }, [onClose])

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!name.trim()) {
            newErrors.name = 'Название обязательно'
        } else if (name.length > 1000) {
            newErrors.name = 'Название не должно превышать 1000 символов'
        }

        if (!isEditMode && slug.trim()) {
            if (slug.length < 3) {
                newErrors.slug = 'Slug должен быть минимум 3 символа'
            } else if (slug.length > 100) {
                newErrors.slug = 'Slug не должен превышать 100 символов'
            } else if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
                newErrors.slug = 'Только латинские буквы, цифры, дефис и подчёркивание'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) {
            return
        }

        try {
            if (isEditMode && webhook) {
                await updateMutation.mutateAsync({
                    slug: webhook.slug,
                    data: { name, isActive },
                })
                enqueueSnackbar('Вебхук обновлён', { variant: 'success' })
            } else {
                await createMutation.mutateAsync({
                    name,
                    isActive,
                    ...(slug.trim() ? { slug: slug.trim() } : {}),
                })
                enqueueSnackbar('Вебхук создан', { variant: 'success' })
            }
            handleClose()
        } catch (error: any) {
            const serverErrors = error?.response?.data?.errors
            if (serverErrors && typeof serverErrors === 'object') {
                setErrors(serverErrors)
            } else {
                enqueueSnackbar('Ошибка при сохранении вебхука', { variant: 'error' })
            }
        }
    }

    const handleDelete = async () => {
        if (!webhook) {
            return
        }

        try {
            await deleteMutation.mutateAsync(webhook.slug)
            enqueueSnackbar('Вебхук удалён', { variant: 'success' })
            handleClose()
        } catch {
            enqueueSnackbar('Ошибка при удалении вебхука', { variant: 'error' })
        }
    }

    const handleCopyUrl = () => {
        if (!webhook) {
            return
        }
        const url = `${getActiveServerUrl()}/webhooks/${webhook.slug}`
        navigator.clipboard.writeText(url)
        enqueueSnackbar('URL скопирован', { variant: 'success' })
    }

    const isLoading =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

    return (
        <>
        <Dialog open={open} onClose={handleClose}>
            <Dialog.Header caption={isEditMode ? 'Редактировать вебхук' : 'Создать вебхук'} />
            <Dialog.Body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        width: formTab === 'logs' ? '580px' : '540px',
                    }}
                >
                        {/* Вкладки (только в режиме редактирования) */}
                        {isEditMode && (
                            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--g-color-line-generic)', paddingBottom: '8px' }}>
                                {(['settings', 'logs'] as FormTab[]).map((tab) => (
                                    <Button
                                        key={tab}
                                        view={formTab === tab ? 'normal' : 'flat'}
                                        size="s"
                                        onClick={() => setFormTab(tab)}
                                    >
                                        {tab === 'settings' ? 'Настройки' : 'Логи'}
                                        {tab === 'logs' && errorCount > 0
                                            ? <span style={{ marginLeft: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--g-color-text-danger)', display: 'inline-block', verticalAlign: 'middle' }} />
                                            : null}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* ── Вкладка: Настройки ── */}
                        {(formTab === 'settings' || !isEditMode) && (
                            <>
                        {isEditMode && webhook && (
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    URL вебхука
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <TextInput
                                        value={`/webhooks/${webhook.slug}`}
                                        disabled
                                        size="l"
                                        style={{ flex: 1 }}
                                    />
                                    <Button view="flat" size="l" onClick={handleCopyUrl}>
                                        <Button.Icon>
                                            <Copy />
                                        </Button.Icon>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '4px',
                                    fontSize: '12px',
                                    color: 'var(--g-color-text-secondary)',
                                }}
                            >
                                Название
                            </label>
                            <TextInput
                                value={name}
                                onUpdate={setName}
                                placeholder="Введите название вебхука"
                                error={!!errors.name}
                                size="l"
                                disabled={isLoading}
                            />
                            {errors.name && (
                                <Text
                                    variant="caption-2"
                                    color="danger"
                                    style={{ marginTop: '4px', display: 'block' }}
                                >
                                    {errors.name}
                                </Text>
                            )}
                        </div>

                        {!isEditMode && (
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    Slug (опционально)
                                </label>
                                <TextInput
                                    value={slug}
                                    onUpdate={setSlug}
                                    placeholder="Оставьте пустым для автогенерации"
                                    error={!!errors.slug}
                                    size="l"
                                    disabled={isLoading}
                                />
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    style={{ marginTop: '4px', display: 'block' }}
                                >
                                    Латинские буквы, цифры, дефис и подчёркивание. Мин. 3 символа.
                                </Text>
                                {errors.slug && (
                                    <Text
                                        variant="caption-2"
                                        color="danger"
                                        style={{ marginTop: '4px', display: 'block' }}
                                    >
                                        {errors.slug}
                                    </Text>
                                )}
                            </div>
                        )}

                        <Checkbox
                            checked={isActive}
                            onUpdate={setIsActive}
                            size="l"
                            disabled={isLoading}
                        >
                            Активен (принимает запросы)
                        </Checkbox>

                        {isEditMode && deleteConfirm && (
                            <div
                                style={{
                                    padding: '12px',
                                    backgroundColor: 'var(--g-color-base-danger-light)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                }}
                            >
                                <Text variant="body-2" color="danger">
                                    Вы уверены, что хотите удалить этот вебхук? Это действие необратимо.
                                </Text>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        view="normal"
                                        size="m"
                                        onClick={() => setDeleteConfirm(false)}
                                        disabled={isLoading}
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        view="outlined-danger"
                                        size="m"
                                        onClick={handleDelete}
                                        loading={deleteMutation.isPending}
                                    >
                                        Подтвердить удаление
                                    </Button>
                                </div>
                            </div>
                        )}
                            </>
                        )}

                    {/* ── Вкладка: Логи ── */}
                    {formTab === 'logs' && isEditMode && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                            }}
                        >
                            {/* Фильтры */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Button
                                    view={logFilter === 'all' ? 'normal' : 'flat'}
                                    size="s"
                                    onClick={() => setLogFilter('all')}
                                >
                                    Все{allLogs ? ` (${allLogs.length})` : ''}
                                </Button>
                                <Button
                                    view={logFilter === 'success' ? 'normal' : 'flat'}
                                    size="s"
                                    onClick={() => setLogFilter('success')}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Label theme="success" size="xs">{successCount}</Label>
                                        Успешные
                                    </span>
                                </Button>
                                <Button
                                    view={logFilter === 'error' ? 'normal' : 'flat'}
                                    size="s"
                                    onClick={() => setLogFilter('error')}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Label theme="danger" size="xs">{errorCount}</Label>
                                        Ошибки
                                    </span>
                                </Button>
                            </div>

                            {/* Строка поиска */}
                            <TextInput
                                value={logSearch}
                                onUpdate={setLogSearch}
                                placeholder="Поиск по логам..."
                                size="m"
                                hasClear
                            />

                            {/* Список логов */}
                            <div
                                style={{
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    maxHeight: '400px',
                                    paddingRight: '4px',
                                }}
                            >
                                {logsLoading && (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                                        <Spin size="m" />
                                    </div>
                                )}

                                {!logsLoading && filteredLogs.length === 0 && (
                                    <Text variant="body-2" color="secondary" style={{ textAlign: 'center', padding: '24px 0' }}>
                                        {logSearch || logFilter !== 'all' ? 'Ничего не найдено' : 'Логов пока нет'}
                                    </Text>
                                )}

                                {!logsLoading && filteredLogs.map((log) => {
                                    const ok = isLogSuccess(log)
                                    return (
                                        <div
                                            key={log.id}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--g-color-base-generic)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Label theme={ok ? 'success' : 'danger'} size="xs">
                                                        {ok ? 'OK' : 'ERR'}
                                                    </Label>
                                                    {log.responseStatus !== null && (
                                                        <Text variant="caption-2" color={ok ? 'positive' : 'danger'}>
                                                            {log.responseStatus}
                                                        </Text>
                                                    )}
                                                </div>
                                                <Text variant="caption-2" color="secondary">
                                                    {formatDate(log.createdAt)}
                                                </Text>
                                            </div>

                                            {log.requestBody && Object.keys(log.requestBody).length > 0 && (
                                                <div
                                                    style={{
                                                        marginTop: '4px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px',
                                                    }}
                                                >
                                                    {Object.entries(log.requestBody).map(([k, v]) => (
                                                        <div key={k} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                            <Text variant="caption-2" color="secondary" style={{ flexShrink: 0 }}>
                                                                {k}:
                                                            </Text>
                                                            <Text
                                                                variant="caption-2"
                                                                style={{ wordBreak: 'break-all' }}
                                                            >
                                                                {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {log.errorMessage && (
                                                <Text
                                                    variant="caption-2"
                                                    color="danger"
                                                    style={{
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'pre-wrap',
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    {log.errorMessage}
                                                </Text>
                                            )}

                                            {!ok && log.requestBody && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <Button
                                                        size="xs"
                                                        view="outlined"
                                                        onClick={() => setCreateFromLog(log)}
                                                    >
                                                        Создать вручную
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {isEditMode && !deleteConfirm && (
                            <Button
                                view="flat-danger"
                                size="l"
                                onClick={() => setDeleteConfirm(true)}
                                disabled={isLoading}
                            >
                                <Button.Icon>
                                    <TrashBin />
                                </Button.Icon>
                                Удалить
                            </Button>
                        )}

                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button view="flat" size="l" onClick={handleClose} disabled={isLoading}>
                            Отмена
                        </Button>
                        <Button
                            view="action"
                            size="l"
                            onClick={handleSubmit}
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {isEditMode ? 'Сохранить' : 'Создать'}
                        </Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog>

        {createFromLog && schemeData && (
            <CreateParticipantModal
                open={!!createFromLog}
                onClose={() => setCreateFromLog(null)}
                projectId={String(projectId)}
                scheme={schemeData.fields}
                printCopies={getProjectPrintCopies(projectData)}
                prefillData={createFromLog.requestBody ?? undefined}
            />
        )}
    </>
    )
}

export default WebhookModal
