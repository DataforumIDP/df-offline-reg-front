import { Dialog, TextInput, Text, Checkbox, Button, Loader } from '@gravity-ui/uikit'
import { TrashBin, Printer } from '@gravity-ui/icons'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSnackbar } from 'notistack'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import {
    useParticipantQuery,
    useParticipantPrintCountQuery,
} from '@/hooks/queries/useParticipantQueries'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import {
    useUpdateParticipantMutation,
    useDeleteParticipantMutation,
} from '@/hooks/mutations/useParticipantMutations'
import { useAppSelector } from '@/store/hooks'
import { previewBadgePdf, PrintTemplate } from '@/services/printService'
import { fetchPrintParticipant } from '@/services/api/participants'
import { getProjectPrintCopies } from '@/utils/projectPrintSettings'
import { UserRole } from '@/types/auth'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { SelectWithOther, PhoneInput } from '@/components/atoms'

export interface ParticipantModalProps {
    open: boolean
    onClose: () => void
    participantId: number | null
    projectId: string
    scheme: SchemeField[]
}

// Компонент для отображения/редактирования изображения с лайтбоксом
const ImageField = ({
    value,
    onChange,
    label,
    disabled,
}: {
    value: string
    onChange: (v: string) => void
    label: string
    disabled?: boolean
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false)

    // Если есть URL изображения - показываем его
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
        return (
            <div>
                <label
                    style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: 'var(--g-color-text-secondary)',
                    }}
                >
                    {label}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={value}
                        alt={label}
                        onClick={() => setLightboxOpen(true)}
                        style={{
                            width: '65%',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1'
                        }}
                    />
                </div>
                <Lightbox
                    open={lightboxOpen}
                    close={() => setLightboxOpen(false)}
                    slides={[{ src: value }]}
                />
            </div>
        )
    }

    // Если нет изображения - показываем загрузчик
    return (
        <div>
            <label
                style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: 'var(--g-color-text-secondary)',
                }}
            >
                {label}
            </label>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    border: '2px dashed var(--g-color-line-generic)',
                    borderRadius: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    backgroundColor: 'var(--g-color-base-generic)',
                    opacity: disabled ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.borderColor = 'var(--g-color-line-generic-hover)'
                        e.currentTarget.style.backgroundColor = 'var(--g-color-base-generic-hover)'
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--g-color-line-generic)'
                    e.currentTarget.style.backgroundColor = 'var(--g-color-base-generic)'
                }}
            >
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={disabled}
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                            // TODO: Загрузка файла на сервер
                            onChange(file.name)
                        }
                    }}
                />
                <div style={{ textAlign: 'center' }}>
                    <Text variant="body-1" color="secondary">
                        {value || 'Нажмите для выбора изображения'}
                    </Text>
                </div>
            </label>
        </div>
    )
}

export const ParticipantModal = ({
    open,
    onClose,
    participantId,
    projectId,
    scheme,
}: ParticipantModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const user = useAppSelector((state) => state.auth.user)
    const templateEditor = useAppSelector((state) => state.templateEditor)

    // Запросы
    const { data: participant, isLoading: participantLoading } = useParticipantQuery(
        participantId ? Number(projectId) : undefined,
        participantId || undefined,
    )
    const { data: printCountData } = useParticipantPrintCountQuery(
        participantId ? Number(projectId) : undefined,
        participantId || undefined,
    )
    const { data: project } = useProjectQuery(projectId)

    // Мутации
    const updateMutation = useUpdateParticipantMutation(Number(projectId))
    const deleteMutation = useDeleteParticipantMutation(Number(projectId))

    // Состояние печати
    const [isPrinting, setIsPrinting] = useState(false)

    // Состояние формы
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Состояние модалки подтверждения удаления
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)

    // Права на редактирование
    const isAdmin = user?.role === UserRole.ADMIN
    const canEdit = useMemo(() => {
        if (isAdmin) {
            return true
        }
        return project?.isOperatorEditable ?? false
    }, [isAdmin, project?.isOperatorEditable])

    // Инициализация формы при загрузке участника
    useEffect(() => {
        if (open && participant) {
            const initialData: Record<string, any> = {}
            scheme.forEach((field) => {
                if (field.config.type === 'id') {
                    return
                }
                initialData[field.key] = participant.data?.[field.key] ?? ''
            })
            setFormData(initialData)
            setErrors({})
        }
    }, [open, participant, scheme])

    const handleClose = useCallback(() => {
        setFormData({})
        setErrors({})
        onClose()
    }, [onClose])

    const handlePrint = useCallback(async () => {
        if (!participant) {
            return
        }

        const { canvas, elements } = templateEditor

        if (elements.length === 0) {
            enqueueSnackbar('Добавьте элементы в шаблон печати', { variant: 'warning' })
            return
        }

        setIsPrinting(true)

        try {
            const template: PrintTemplate = {
                widthMm: canvas.widthMm,
                heightMm: canvas.heightMm,
                elements: elements,
            }

            await previewBadgePdf(template, participant.data, getProjectPrintCopies(project))

            // Отправляем запрос о печати на сервер
            await fetchPrintParticipant(Number(projectId), participant.id)
        } catch (err) {
            console.error('Print error:', err)
            enqueueSnackbar('Ошибка при генерации PDF', { variant: 'error' })
        } finally {
            setIsPrinting(false)
        }
    }, [participant, project, templateEditor, enqueueSnackbar, projectId])

    const handleSubmit = useCallback(async () => {
        if (!participantId) {
            return
        }

        // Валидация обязательных полей
        const newErrors: Record<string, string> = {}

        scheme.forEach((field) => {
            if (field.config.type === 'id') {
                return
            }

            if (!field.config.optional) {
                const value = formData[field.key]
                const isEmpty = value === undefined || value === null || value === ''

                if (isEmpty) {
                    newErrors[field.key] = `${field.label} обязательно для заполнения`
                }
            }
        })

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        updateMutation.mutate(
            { participantId, data: formData },
            {
                onSuccess: () => {
                    enqueueSnackbar('Участник обновлён', { variant: 'success' })
                    handleClose()
                },
                onError: (error: any) => {
                    // Обработка ошибок валидации с сервера
                    const serverErrors = error?.response?.data?.errors
                    if (serverErrors && typeof serverErrors === 'object') {
                        const fieldErrors: Record<string, string> = {}
                        const fieldKeys = scheme.map((f) => f.key)

                        Object.entries(serverErrors).forEach(([key, message]) => {
                            if (fieldKeys.includes(key)) {
                                // Ошибка привязана к полю
                                fieldErrors[key] = String(message)
                            } else {
                                // Ошибка не привязана к полю - показываем как toast
                                enqueueSnackbar(String(message), { variant: 'error' })
                            }
                        })

                        if (Object.keys(fieldErrors).length > 0) {
                            setErrors((prev) => ({ ...prev, ...fieldErrors }))
                        }
                    } else {
                        enqueueSnackbar('Ошибка при обновлении участника', { variant: 'error' })
                    }
                },
            },
        )
    }, [participantId, scheme, formData, updateMutation, handleClose, enqueueSnackbar])

    const handleDelete = useCallback(() => {
        if (!participantId) {
            return
        }

        deleteMutation.mutate(participantId, {
            onSuccess: () => {
                enqueueSnackbar('Участник удалён', { variant: 'success' })
                setDeleteModalOpen(false)
                handleClose()
            },
            onError: () => {
                enqueueSnackbar('Ошибка при удалении участника', { variant: 'error' })
            },
        })
    }, [participantId, deleteMutation, handleClose, enqueueSnackbar])

    const updateField = useCallback((key: string, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => ({ ...prev, [key]: '' }))
    }, [])

    // Рендер поля в зависимости от типа
    const renderField = (field: SchemeField) => {
        // Скрытые поля не отображаются операторам
        if (field.config.isHidden && !isAdmin) return null

        if (field.config.type === 'id') {
            // Показываем ID как readonly
            return (
                <div key={field.key}>
                    <label
                        style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '12px',
                            color: 'var(--g-color-text-secondary)',
                        }}
                    >
                        {field.label}
                    </label>
                    <TextInput value={participant?.id?.toString() || ''} disabled size="l" />
                </div>
            )
        }

        const value = formData[field.key]
        const error = errors[field.key]

        switch (field.config.type) {
            case 'img':
                return (
                    <ImageField
                        key={field.key}
                        value={value || ''}
                        onChange={(v) => updateField(field.key, v)}
                        label={field.label}
                        disabled={!canEdit}
                    />
                )

            case 'bool':
                return (
                    <Checkbox
                        key={field.key}
                        checked={!!value}
                        onUpdate={(checked) => updateField(field.key, checked)}
                        size="l"
                        disabled={!canEdit}
                    >
                        {field.label}
                    </Checkbox>
                )

            case 'list':
                const items = field.config.listSettings?.items || []
                const visibleItems = isAdmin ? items : items.filter((i) => !i.isHidden)
                const isMultiple = field.config.listSettings?.multiple || false

                return (
                    <div key={field.key}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            {field.label}
                        </label>
                        <SelectWithOther
                            items={visibleItems}
                            value={isMultiple ? (Array.isArray(value) ? value : []) : value || ''}
                            multiple={isMultiple}
                            disabled={!canEdit}
                            onUpdate={(selected) => updateField(field.key, selected)}
                            size="l"
                            placeholder={`Выберите ${field.label.toLowerCase()}`}
                        />
                        {error && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {error}
                            </Text>
                        )}
                    </div>
                )

            case 'code':
                // Код только для чтения
                return (
                    <div key={field.key}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            {field.label}
                        </label>
                        <TextInput value={value || ''} disabled size="l" />
                    </div>
                )

            default:
                // Телефон или обычный текст
                if (field.config.type === 'text' && field.config.isPhone) {
                    return (
                        <div key={field.key}>
                            <PhoneInput
                                label={field.label}
                                value={value || ''}
                                onChange={(v) => updateField(field.key, v)}
                            />
                            {error && (
                                <Text
                                    variant="caption-2"
                                    color="danger"
                                    style={{ marginTop: '4px', display: 'block' }}
                                >
                                    {error}
                                </Text>
                            )}
                        </div>
                    )
                }

                return (
                    <div key={field.key}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            {field.label}
                        </label>
                        <TextInput
                            placeholder={field.label}
                            value={value || ''}
                            onUpdate={(v) => updateField(field.key, v)}
                            error={!!error}
                            size="l"
                            disabled={!canEdit}
                        />
                        {error && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {error}
                            </Text>
                        )}
                    </div>
                )
        }
    }

    const isLoading = participantLoading
    const hasMultipleColumns = scheme.length > 8

    // Разделяем поля на обычные и чекбоксы
    const visibleScheme = isAdmin ? scheme : scheme.filter((f) => !f.config.isHidden)
    const nonBoolFields = visibleScheme.filter((f) => f.config.type !== 'bool')
    const boolFields = visibleScheme.filter((f) => f.config.type === 'bool')

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="participant-modal-title"
                size={hasMultipleColumns ? 'l' : undefined}
            >
                <Dialog.Header caption="Участник" id="participant-modal-title" />
                <Dialog.Body>
                    {isLoading ? (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '48px',
                                width: hasMultipleColumns
                                    ? 'min(700px, calc(100vw - 64px))'
                                    : 'min(400px, calc(100vw - 64px))',
                            }}
                        >
                            <Loader size="l" />
                        </div>
                    ) : (
                        <div
                            style={{
                                display: hasMultipleColumns ? 'grid' : 'flex',
                                gridTemplateColumns: hasMultipleColumns
                                    ? 'repeat(2, 1fr)'
                                    : undefined,
                                flexDirection: hasMultipleColumns ? undefined : 'column',
                                gap: '16px',
                                width: hasMultipleColumns
                                    ? '100%'
                                    : 'min(400px, calc(100vw - 64px))',
                            }}
                        >
                            {/* Количество печатей - read only */}
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    Количество печатей
                                </label>
                                <TextInput
                                    value={printCountData?.printCount?.toString() || '0'}
                                    disabled
                                    size="l"
                                />
                            </div>
                            {nonBoolFields.map(renderField)}
                            {boolFields.length > 0 && (
                                <div
                                    style={{
                                        gridColumn: hasMultipleColumns ? '1 / -1' : undefined,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        alignItems: 'center',
                                    }}
                                >
                                    {boolFields.map(renderField)}
                                </div>
                            )}
                        </div>
                    )}
                </Dialog.Body>
                <Dialog.Footer>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    >
                        <div>
                            {isAdmin && (
                                <Button
                                    view="flat-danger"
                                    size="l"
                                    onClick={() => setDeleteModalOpen(true)}
                                    title="Удалить участника"
                                >
                                    <Button.Icon>
                                        <TrashBin />
                                    </Button.Icon>
                                    Удалить
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button view="flat" size="l" onClick={handleClose}>
                                Отмена
                            </Button>
                            <Button
                                view="outlined"
                                size="l"
                                onClick={handlePrint}
                                loading={isPrinting}
                            >
                                <Button.Icon>
                                    <Printer />
                                </Button.Icon>
                                Печать
                            </Button>
                            {canEdit && (
                                <Button
                                    view="action"
                                    size="l"
                                    onClick={handleSubmit}
                                    loading={updateMutation.isPending}
                                >
                                    Сохранить
                                </Button>
                            )}
                        </div>
                    </div>
                </Dialog.Footer>
            </Dialog>

            <ConfirmDeleteModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                participantId={participantId}
            />
        </>
    )
}

export default ParticipantModal
