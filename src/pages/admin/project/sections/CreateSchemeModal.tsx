import { Dialog, TextInput, Text, Checkbox, Select } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useSnackbar } from 'notistack'
import { useCreateSchemeMutation } from '@/hooks/mutations/useSchemeMutations'
import ListItemsInput from './ListItemsInput'

interface ListItem {
    id: string
    value: string
    color: string
    isHidden?: boolean
}

interface CreateSchemeModalProps {
    open: boolean
    onClose: () => void
    projectId: string
}

const CreateSchemeModal = ({ open, onClose, projectId }: CreateSchemeModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const createMutation = useCreateSchemeMutation(projectId)

    const [formData, setFormData] = useState({
        label: '',
        key: '',
        type: 'text' as 'text' | 'list' | 'bool' | 'id' | 'img' | 'code',
        uniq: false,
        optional: true, // по умолчанию поле необязательное
        maxLength: '',
        listItems: [] as ListItem[],
        listMultiple: false,
        defaultValue: '',
        boolDefault: 'none' as 'none' | 'true' | 'false',
        random: false,
        codeLength: '20',
        codeChars: 'abcdefghijklmnopqrstuvwxyz0123456789',
        isPhone: false, // для text — поле телефона
        isHidden: false,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleClose = () => {
        setFormData({
            label: '',
            key: '',
            type: 'text',
            uniq: false,
            optional: true,
            maxLength: '',
            listItems: [],
            listMultiple: false,
            defaultValue: '',
            boolDefault: 'none',
            random: false,
            codeLength: '20',
            codeChars: 'abcdefghijklmnopqrstuvwxyz0123456789',
            isPhone: false,
            isHidden: false,
        })
        setErrors({})
        onClose()
    }

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {}

        if (!formData.label.trim()) {
            newErrors.label = 'Название обязательно'
        }
        if (!formData.key.trim()) {
            newErrors.key = 'Ключ обязателен'
        }
        if (formData.type === 'text' && formData.maxLength && isNaN(Number(formData.maxLength))) {
            newErrors.maxLength = 'Максимальная длина должна быть числом'
        }
        if (formData.type === 'list' && formData.listItems.length === 0) {
            newErrors.listItems = 'Добавьте хотя бы один вариант для списка'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const config: any = {
            type: formData.type,
            uniq: formData.uniq,
            optional: formData.optional,
        }

        if (formData.type === 'text') {
            if (formData.maxLength) {
                config.maxLength = Number(formData.maxLength)
            }
            config.isPhone = formData.isPhone
        }

        if (formData.type === 'list') {
            config.listSettings = {
                multiple: formData.listMultiple,
                items: formData.listItems.map((item) => ({
                    value: item.value,
                    color: item.color,
                    isHidden: item.isHidden || false,
                })),
            }
        }

        // defaultValue handling
        if (formData.type === 'bool') {
            if (formData.boolDefault === 'true') {
                config.defaultValue = true
            } else if (formData.boolDefault === 'false') {
                config.defaultValue = false
            }
            // if 'none' => do not set defaultValue
        } else if (formData.type === 'list') {
            if (formData.listMultiple) {
                if (formData.defaultValue.trim()) {
                    config.defaultValue = formData.defaultValue
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                }
            } else {
                if (formData.defaultValue.trim()) {
                    config.defaultValue = formData.defaultValue.trim()
                }
            }
        } else {
            if (formData.defaultValue.trim()) {
                config.defaultValue = formData.defaultValue.trim()
            }
        }

        // random flag for code type
        if (formData.type === 'code') {
            config.random = formData.random
            if (formData.random) {
                const len = Number(formData.codeLength)
                if (!Number.isInteger(len) || len < 1 || len > 200) {
                    setErrors({ ...newErrors, codeLength: 'Длина должна быть целым числом от 1 до 200' })
                    return
                }
                if (!formData.codeChars || formData.codeChars.length < 1) {
                    setErrors({ ...newErrors, codeChars: 'Набор символов не может быть пустым' })
                    return
                }
                config.codeLength = len
                config.codeChars = formData.codeChars
            }
        }

        // isHidden flag
        config.isHidden = formData.isHidden

        createMutation.mutate(
            {
                label: formData.label,
                key: formData.key,
                config,
            },
            {
                onSuccess: () => {
                    enqueueSnackbar('Поле создано', { variant: 'success' })
                    handleClose()
                },
                onError: () => {
                    enqueueSnackbar('Ошибка при создании поля', { variant: 'error' })
                },
            },
        )
    }

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="create-scheme-modal-title">
            <Dialog.Header caption="Добавить поле" id="create-scheme-modal-title" />
            <Dialog.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Название поля */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Название поля *
                        </label>
                        <TextInput
                            placeholder="Например: Email"
                            value={formData.label}
                            onUpdate={(value: string) => {
                                setFormData({ ...formData, label: value })
                                setErrors({ ...errors, label: '' })
                            }}
                            error={!!errors.label}
                            size="l"
                        />
                        {errors.label && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {errors.label}
                            </Text>
                        )}
                    </div>

                    {/* Ключ для API */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Ключ (для API) *
                        </label>
                        <TextInput
                            placeholder="Например: email"
                            value={formData.key}
                            onUpdate={(value: string) => {
                                setFormData({ ...formData, key: value })
                                setErrors({ ...errors, key: '' })
                            }}
                            error={!!errors.key}
                            size="l"
                        />
                        {errors.key && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {errors.key}
                            </Text>
                        )}
                    </div>

                    {/* Тип данных */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Тип данных *
                        </label>
                        <Select
                            value={[formData.type]}
                            width={'max'}
                            onUpdate={(value) => {
                                if (value.length > 0) {
                                    setFormData({ ...formData, type: value[0] as any })
                                }
                            }}
                            options={[
                                { value: 'text', content: 'Текст' },
                                { value: 'list', content: 'Список' },
                                { value: 'bool', content: 'Чекбокс' },
                                { value: 'id', content: 'Идентификатор' },
                                { value: 'img', content: 'Изображение' },
                                { value: 'code', content: 'Код' },
                            ]}
                            size="l"
                        />
                    </div>

                    {/* Обязательное поле - для всех типов кроме id */}
                    {formData.type !== 'id' && (
                        <Checkbox
                            checked={!formData.optional}
                            onUpdate={(checked) => setFormData({ ...formData, optional: !checked })}
                        >
                            Обязательное поле
                        </Checkbox>
                    )}

                    {/* Уникальное значение - только для text */}
                    {formData.type === 'text' && (
                        <Checkbox
                            checked={formData.uniq}
                            onUpdate={(checked) => setFormData({ ...formData, uniq: checked })}
                        >
                            Уникальное значение
                        </Checkbox>
                    )}

                    {/* Поле телефона - только для text */}
                    {formData.type === 'text' && (
                        <Checkbox
                            checked={formData.isPhone}
                            onUpdate={(checked) => setFormData({ ...formData, isPhone: checked })}
                        >
                            Номер телефона
                        </Checkbox>
                    )}

                    {/* Максимальная длина для типа text */}
                    {formData.type === 'text' && (
                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    marginBottom: '4px',
                                    fontSize: '12px',
                                    color: 'var(--g-color-text-secondary)',
                                }}
                            >
                                Максимальная длина
                            </label>
                            <TextInput
                                placeholder="Например: 128"
                                value={formData.maxLength}
                                onUpdate={(value: string) => {
                                    setFormData({ ...formData, maxLength: value })
                                    setErrors({ ...errors, maxLength: '' })
                                }}
                                error={!!errors.maxLength}
                                size="l"
                                type="number"
                            />
                            {errors.maxLength && (
                                <Text
                                    variant="caption-2"
                                    color="danger"
                                    style={{ marginTop: '4px', display: 'block' }}
                                >
                                    {errors.maxLength}
                                </Text>
                            )}
                        </div>
                    )}

                    {/* Варианты для типа list */}
                    {formData.type === 'list' && (
                        <>
                            <Checkbox
                                checked={formData.listMultiple}
                                onUpdate={(checked) =>
                                    setFormData({ ...formData, listMultiple: checked })
                                }
                            >
                                Множественный выбор
                            </Checkbox>

                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    Варианты списка *
                                </label>
                                <ListItemsInput
                                    items={formData.listItems}
                                    onItemsChange={(items) => {
                                        setFormData({ ...formData, listItems: items })
                                        setErrors({ ...errors, listItems: '' })
                                    }}
                                    error={!!errors.listItems}
                                    errorMessage={errors.listItems}
                                />
                            </div>
                        </>
                    )}

                    {/* Default value */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Значение по умолчанию
                        </label>
                        {formData.type === 'bool' ? (
                            <Select
                                value={[formData.boolDefault]}
                                width="max"
                                onUpdate={(v) =>
                                    v.length &&
                                    setFormData({ ...formData, boolDefault: v[0] as any })
                                }
                                options={[
                                    { value: 'none', content: 'Не задано' },
                                    { value: 'true', content: 'Да' },
                                    { value: 'false', content: 'Нет' },
                                ]}
                                size="l"
                            />
                        ) : (
                            <TextInput
                                placeholder={
                                    formData.type === 'list' && formData.listMultiple
                                        ? 'Например: VIP, Спикер'
                                        : 'Например: value'
                                }
                                value={formData.defaultValue}
                                onUpdate={(v: string) =>
                                    setFormData({ ...formData, defaultValue: v })
                                }
                                size="l"
                            />
                        )}
                    </div>

                    {/* Флаг random для типа code */}
                    {formData.type === 'code' && (
                        <Checkbox
                            checked={formData.random || false}
                            onUpdate={(checked) => setFormData({ ...formData, random: checked })}
                        >
                            Генерировать случайное значение
                        </Checkbox>
                    )}

                    {/* Параметры генерации кода */}
                    {formData.type === 'code' && formData.random && (
                        <>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    Длина кода
                                </label>
                                <TextInput
                                    type="number"
                                    value={formData.codeLength}
                                    onUpdate={(v: string) => {
                                        setFormData({ ...formData, codeLength: v })
                                        setErrors({ ...errors, codeLength: '' })
                                    }}
                                    error={!!errors.codeLength}
                                    size="l"
                                />
                                {errors.codeLength && (
                                    <Text variant="caption-2" color="danger" style={{ marginTop: '4px', display: 'block' }}>
                                        {errors.codeLength}
                                    </Text>
                                )}
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                        color: 'var(--g-color-text-secondary)',
                                    }}
                                >
                                    Символы для генерации
                                </label>
                                <TextInput
                                    placeholder="Например: 123456789"
                                    value={formData.codeChars}
                                    onUpdate={(v: string) => {
                                        setFormData({ ...formData, codeChars: v })
                                        setErrors({ ...errors, codeChars: '' })
                                    }}
                                    error={!!errors.codeChars}
                                    size="l"
                                />
                                {errors.codeChars && (
                                    <Text variant="caption-2" color="danger" style={{ marginTop: '4px', display: 'block' }}>
                                        {errors.codeChars}
                                    </Text>
                                )}
                            </div>
                        </>
                    )}

                    {/* Скрытое поле — только для admin */}
                    <Checkbox
                        checked={formData.isHidden}
                        onUpdate={(checked) => setFormData({ ...formData, isHidden: checked })}
                    >
                        Скрытое поле (только для админа)
                    </Checkbox>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSubmit}
                textButtonCancel="Отмена"
                textButtonApply="Создать"
                propsButtonApply={{ loading: createMutation.isPending }}
            />
        </Dialog>
    )
}

export default CreateSchemeModal
