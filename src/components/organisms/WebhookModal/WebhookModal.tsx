import { useState, useCallback, useEffect } from 'react'
import { Dialog, TextInput, Text, Checkbox, Button } from '@gravity-ui/uikit'
import { TrashBin, Copy } from '@gravity-ui/icons'
import { useSnackbar } from 'notistack'
import type { Webhook } from '@/services/api/webhooks'
import {
    useCreateWebhookMutation,
    useUpdateWebhookMutation,
    useDeleteWebhookMutation,
} from '@/hooks/mutations/useWebhookMutations'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface WebhookModalProps {
    open: boolean
    onClose: () => void
    projectId: number
    webhook?: Webhook | null // null = режим создания
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
        }
    }, [open, webhook])

    const handleClose = useCallback(() => {
        setName('')
        setSlug('')
        setIsActive(true)
        setErrors({})
        setDeleteConfirm(false)
        onClose()
    }, [onClose])

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!name.trim()) {
            newErrors.name = 'Название обязательно'
        } else if (name.length > 1000) {
            newErrors.name = 'Название не должно превышать 1000 символов'
        }

        // Валидация slug только при создании (если введён)
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
        const url = `${API_BASE_URL}/webhooks/${webhook.slug}`
        navigator.clipboard.writeText(url)
        enqueueSnackbar('URL скопирован', { variant: 'success' })
    }

    const isLoading =
        createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

    return (
        <Dialog open={open} onClose={handleClose}>
            <Dialog.Header caption={isEditMode ? 'Редактировать вебхук' : 'Создать вебхук'} />
            <Dialog.Body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        width: '400px',
                    }}
                >
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
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div>
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
    )
}

export default WebhookModal
