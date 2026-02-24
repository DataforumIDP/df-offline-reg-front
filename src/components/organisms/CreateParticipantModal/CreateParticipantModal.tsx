import { Dialog, TextInput, Text, Checkbox, Button, Loader } from '@gravity-ui/uikit'
import { useState, useCallback, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useCreateParticipantMutation } from '@/hooks/mutations/useParticipantMutations'
import { uploadImageWithMini } from '@/services/api/files'
import { fetchPrintParticipant } from '@/services/api/participants'
import { useAppSelector } from '@/store/hooks'
import { previewBadgePdf, PrintTemplate } from '@/services/printService'
import { SelectWithOther } from '@/components/atoms'

export interface CreateParticipantModalProps {
    open: boolean
    onClose: () => void
    projectId: string
    scheme: SchemeField[]
}

// Стилизованный инпут для изображения с загрузкой на сервер
const ImageInput = ({
    value,
    onChange,
    label,
    onError,
}: {
    value: string
    onChange: (url: string) => void
    label: string
    onError?: (msg: string) => void
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            return
        }

        // Показываем превью сразу
        setPreviewUrl(URL.createObjectURL(file))
        setIsUploading(true)

        try {
            const result = await uploadImageWithMini(file)
            onChange(result.url) // Сохраняем основной URL
        } catch (err) {
            console.error('Upload error:', err)
            onError?.('Ошибка загрузки изображения')
            setPreviewUrl(null)
        } finally {
            setIsUploading(false)
        }
    }

    // Если есть загруженный URL - показываем изображение
    if (value || previewUrl) {
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
                <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <img
                        src={previewUrl || value}
                        alt={label}
                        style={{
                            width: '65%',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            opacity: isUploading ? 0.5 : 1,
                        }}
                    />
                    {isUploading && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <Loader size="m" />
                        </div>
                    )}
                </div>
            </div>
        )
    }

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
                    cursor: isUploading ? 'wait' : 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    backgroundColor: 'var(--g-color-base-generic)',
                }}
                onMouseEnter={(e) => {
                    if (!isUploading) {
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
                    disabled={isUploading}
                    onChange={handleFileChange}
                />
                <div style={{ textAlign: 'center' }}>
                    {isUploading ? (
                        <Loader size="s" />
                    ) : (
                        <Text variant="body-1" color="secondary">
                            Нажмите для выбора изображения
                        </Text>
                    )}
                </div>
            </label>
        </div>
    )
}

export const CreateParticipantModal = ({
    open,
    onClose,
    projectId,
    scheme,
}: CreateParticipantModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const createMutation = useCreateParticipantMutation(Number(projectId))
    const templateEditor = useAppSelector((state) => state.templateEditor)

    // Состояние формы - динамически формируется из схемы
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Чекбоксы футера
    const [keepOpen, setKeepOpen] = useState(false)
    const [printAfterSave, setPrintAfterSave] = useState(false)

    // Инициализация формы при открытии
    useEffect(() => {
        if (open && scheme.length > 0) {
            const initialData: Record<string, any> = {}
            scheme.forEach((field) => {
                // Пропускаем поля id (генерируется автоматически)
                if (field.config.type === 'id') {
                    return
                }

                switch (field.config.type) {
                    case 'bool':
                        initialData[field.key] = false
                        break
                    case 'list':
                        initialData[field.key] = field.config.listSettings?.multiple ? [] : ''
                        break
                    default:
                        initialData[field.key] = ''
                }
            })
            setFormData(initialData)
            setErrors({})
        }
    }, [open, scheme])

    // Очистка формы
    const resetForm = useCallback(() => {
        const initialData: Record<string, any> = {}
        scheme.forEach((field) => {
            if (field.config.type === 'id') {
                return
            }

            switch (field.config.type) {
                case 'bool':
                    initialData[field.key] = false
                    break
                case 'list':
                    initialData[field.key] = field.config.listSettings?.multiple ? [] : ''
                    break
                default:
                    initialData[field.key] = ''
            }
        })
        setFormData(initialData)
        setErrors({})
    }, [scheme])

    const handleClose = useCallback(() => {
        if (!keepOpen) {
            resetForm()
            setKeepOpen(false)
            setPrintAfterSave(false)
        }
        onClose()
    }, [keepOpen, resetForm, onClose])

    // Печать участника после создания
    const handlePrint = useCallback(
        async (participantId: number, participantData: Record<string, any>) => {
            const { canvas, elements } = templateEditor

            if (elements.length === 0) {
                enqueueSnackbar('Добавьте элементы в шаблон печати', { variant: 'warning' })
                return
            }

            try {
                const template: PrintTemplate = {
                    widthMm: canvas.widthMm,
                    heightMm: canvas.heightMm,
                    elements: elements,
                }

                await previewBadgePdf(template, participantData)

                // Отправляем запрос о печати на сервер
                await fetchPrintParticipant(Number(projectId), participantId)
            } catch (err) {
                console.error('Print error:', err)
                enqueueSnackbar('Ошибка при генерации PDF', { variant: 'error' })
            }
        },
        [templateEditor, projectId, enqueueSnackbar],
    )

    const handleSubmit = useCallback(async () => {
        // Валидация обязательных полей
        const newErrors: Record<string, string> = {}

        scheme.forEach((field) => {
            // Пропускаем поле id (генерируется автоматически)
            if (field.config.type === 'id') {
                return
            }

            // Проверяем только обязательные поля (optional = false)
            if (!field.config.optional) {
                const value = formData[field.key]
                // Пустая строка считается отсутствием значения
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

        createMutation.mutate(formData, {
            onSuccess: (createdParticipant) => {
                enqueueSnackbar('Участник создан', { variant: 'success' })

                // Печать если выбрано
                if (printAfterSave) {
                    handlePrint(createdParticipant.id, createdParticipant.data)
                }

                if (keepOpen) {
                    // Очищаем форму, но сохраняем чекбоксы
                    resetForm()
                } else {
                    handleClose()
                }
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
                    enqueueSnackbar('Ошибка при создании участника', { variant: 'error' })
                }
            },
        })
    }, [
        scheme,
        formData,
        createMutation,
        keepOpen,
        printAfterSave,
        resetForm,
        handleClose,
        handlePrint,
        enqueueSnackbar,
    ])

    const updateField = useCallback((key: string, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => ({ ...prev, [key]: '' }))
    }, [])

    // Рендер поля в зависимости от типа
    const renderField = (field: SchemeField) => {
        // Пропускаем id (генерируется автоматически)
        if (field.config.type === 'id') {
            return null
        }

        const value = formData[field.key]
        const error = errors[field.key]

        switch (field.config.type) {
            case 'img':
                return (
                    <div key={field.key}>
                        <ImageInput
                            value={value || ''}
                            onChange={(url) => updateField(field.key, url)}
                            label={field.label}
                            onError={(msg) => setErrors((prev) => ({ ...prev, [field.key]: msg }))}
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

            case 'bool':
                return (
                    <Checkbox
                        key={field.key}
                        checked={!!value}
                        onUpdate={(checked) => updateField(field.key, checked)}
                        size="l"
                    >
                        {field.label}
                    </Checkbox>
                )

            case 'list':
                const items = field.config.listSettings?.items || []
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
                            items={items}
                            value={isMultiple ? (Array.isArray(value) ? value : []) : value || ''}
                            multiple={isMultiple}
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

            default:
                // text и другие типы
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

    const hasMultipleColumns = scheme.length > 8

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="create-participant-modal-title"
            size={hasMultipleColumns ? 'l' : undefined}
        >
            <Dialog.Header caption="Добавить участника" id="create-participant-modal-title" />
            <Dialog.Body>
                <div
                    style={{
                        display: hasMultipleColumns ? 'grid' : 'flex',
                        gridTemplateColumns: hasMultipleColumns ? 'repeat(2, 1fr)' : undefined,
                        flexDirection: hasMultipleColumns ? undefined : 'column',
                        gap: '16px',
                        width: hasMultipleColumns
                            ? '100% !important'
                            : 'min(400px, calc(100vw - 64px))',
                    }}
                >
                    {scheme.map(renderField)}
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Checkbox checked={keepOpen} onUpdate={setKeepOpen} size="m">
                            Не закрывать
                        </Checkbox>
                        <Checkbox checked={printAfterSave} onUpdate={setPrintAfterSave} size="m">
                            Печать
                        </Checkbox>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button view="flat" size="l" onClick={handleClose}>
                            Отмена
                        </Button>
                        <Button
                            view="action"
                            size="l"
                            onClick={handleSubmit}
                            loading={createMutation.isPending}
                        >
                            Сохранить
                        </Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog>
    )
}

export default CreateParticipantModal
