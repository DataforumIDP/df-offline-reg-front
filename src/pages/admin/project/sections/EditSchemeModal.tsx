import { Dialog, TextInput, Checkbox, Select, Button, Icon } from '@gravity-ui/uikit'
import { ArrowsRotateRight } from '@gravity-ui/icons'
import { useSnackbar } from 'notistack'
import { useUpdateSchemaMutation } from '@/hooks/mutations/useSchemeMutations'
import ListItemsInput from './ListItemsInput'
import { useState, useEffect } from 'react'

interface ListItem {
    id: string
    value: string
    color: string
}

interface EditSchemeModalProps {
    open: boolean
    onClose: () => void
    field: any
    projectId: string
}

const EditSchemeModal = ({ open, onClose, field, projectId }: EditSchemeModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const updateMutation = useUpdateSchemaMutation(projectId, field?.id || 0)

    const [listItems, setListItems] = useState<ListItem[]>([])
    const [listMultiple, setListMultiple] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [label, setLabel] = useState('')
    const [keyValue, setKeyValue] = useState('')
    const [typeValue, setTypeValue] = useState<'text' | 'list' | 'bool' | 'id' | 'img' | 'code'>(
        'text',
    )
    const [uniq, setUniq] = useState(false)
    const [optional, setOptional] = useState(true)
    const [maxLength, setMaxLength] = useState('')
    const [defaultValue, setDefaultValue] = useState<string>('')
    const [boolDefault, setBoolDefault] = useState<'none' | 'true' | 'false'>('none')
    const [random, setRandom] = useState(false)
    const [isRestarting, setIsRestarting] = useState(false)
    const [scannerEditable, setScannerEditable] = useState(false)

    // Функция для перезапуска генерации (отключает random, затем включает обратно)
    const handleRestartGeneration = async () => {
        if (!field || isRestarting) return

        setIsRestarting(true)

        try {
            // Формируем конфиг с random: false
            const configOff: any = { ...field.config, random: false }

            await new Promise<void>((resolve, reject) => {
                updateMutation.mutate(
                    { label: field.label, key: field.key, config: configOff },
                    {
                        onSuccess: () => resolve(),
                        onError: () => reject(),
                    },
                )
            })

            // Затем включаем обратно
            const configOn: any = { ...field.config, random: true }

            await new Promise<void>((resolve, reject) => {
                updateMutation.mutate(
                    { label: field.label, key: field.key, config: configOn },
                    {
                        onSuccess: () => {
                            enqueueSnackbar('Генерация перезапущена', { variant: 'success' })
                            resolve()
                        },
                        onError: () => reject(),
                    },
                )
            })
        } catch {
            enqueueSnackbar('Ошибка при перезапуске генерации', { variant: 'error' })
        } finally {
            setIsRestarting(false)
        }
    }

    useEffect(() => {
        if (!field) {
            return
        }

        setLabel(field.label || '')
        setKeyValue(field.key || '')
        setTypeValue(field.config?.type || 'text')
        setUniq(!!field.config?.uniq)
        setOptional(field.config?.optional !== false)
        setMaxLength(field.config?.maxLength ? String(field.config.maxLength) : '')
        // defaultValue
        const dv = field.config?.defaultValue
        if (dv === null || dv === undefined) {
            setDefaultValue('')
            setBoolDefault('none')
        } else if (field.config?.type === 'bool') {
            setBoolDefault(dv ? 'true' : 'false')
            setDefaultValue('')
        } else if (field.config?.type === 'list' && Array.isArray(dv)) {
            setDefaultValue(dv.join(', '))
        } else {
            setDefaultValue(String(dv))
        }

        if (field?.config?.type === 'list' && field?.config?.listSettings) {
            const items = field.config.listSettings.items.map((item: any, index: number) => ({
                id: `${field.id}_${index}`,
                value: item.value,
                color: item.color || '#4a90e2',
            }))
            setListItems(items)
            setListMultiple(field.config.listSettings.multiple || false)
        } else {
            setListItems([])
            setListMultiple(false)
        }

        setRandom(field.config?.random || false)
        setScannerEditable(field.scannerEditable || false)
    }, [field, open])

    const handleClose = () => {
        setListItems([])
        setListMultiple(false)
        setErrors({})
        setLabel('')
        setKeyValue('')
        setTypeValue('text')
        setUniq(false)
        setOptional(true)
        setMaxLength('')
        setDefaultValue('')
        setBoolDefault('none')
        setRandom(false)
        setScannerEditable(false)
        onClose()
    }

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {}

        if (!label.trim()) {
            newErrors.label = 'Название обязательно'
        }
        if (!keyValue.trim()) {
            newErrors.key = 'Ключ обязателен'
        }
        if (typeValue === 'text' && maxLength && isNaN(Number(maxLength))) {
            newErrors.maxLength = 'Максимальная длина должна быть числом'
        }
        if (typeValue === 'list' && listItems.length === 0) {
            newErrors.listItems = 'Добавьте хотя бы один вариант для списка'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const config: any = {
            type: typeValue,
            uniq,
            optional,
        }

        if (typeValue === 'text' && maxLength) {
            config.maxLength = Number(maxLength)
        }

        if (typeValue === 'list') {
            config.listSettings = {
                multiple: listMultiple,
                items: listItems.map((item) => ({
                    value: item.value,
                    color: item.color,
                })),
            }
        }

        // defaultValue handling
        if (typeValue === 'bool') {
            if (boolDefault === 'true') {
                config.defaultValue = true
            } else if (boolDefault === 'false') {
                config.defaultValue = false
            }
        } else if (typeValue === 'list') {
            if (listMultiple) {
                if (defaultValue.trim()) {
                    config.defaultValue = defaultValue
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                }
            } else {
                if (defaultValue.trim()) {
                    config.defaultValue = defaultValue.trim()
                }
            }
        } else {
            if (defaultValue.trim()) {
                config.defaultValue = defaultValue.trim()
            }
        }

        // random flag for code type
        if (typeValue === 'code') {
            config.random = random
        }

        // Если ключ изменился — спрашиваем подтверждение, что данные участников будут мигрированы
        if (field.key !== keyValue) {
            const ok = window.confirm(
                'Вы изменили ключ поля. Все данные участников будут автоматически перенесены на новый ключ. Продолжить?',
            )
            if (!ok) {
                return
            }
        }

        updateMutation.mutate(
            {
                label,
                key: keyValue,
                config,
                scannerEditable: typeValue === 'bool' ? scannerEditable : undefined,
            },
            {
                onSuccess: () => {
                    enqueueSnackbar('Поле обновлено', { variant: 'success' })
                    handleClose()
                },
                onError: () => {
                    enqueueSnackbar('Ошибка при обновлении поля', { variant: 'error' })
                },
            },
        )
    }

    if (!field) {
        return null
    }

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="edit-scheme-modal-title">
            <Dialog.Header caption="Редактировать поле" id="edit-scheme-modal-title" />
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
                            value={label}
                            onUpdate={(v: string) => {
                                setLabel(v)
                                setErrors({ ...errors, label: '' })
                            }}
                            error={!!errors.label}
                            size="l"
                        />
                        {errors.label && (
                            <div style={{ color: 'var(--g-color-danger)', marginTop: 6 }}>
                                {errors.label}
                            </div>
                        )}
                    </div>

                    {/* Ключ */}
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
                            value={keyValue}
                            onUpdate={(v: string) => {
                                setKeyValue(v)
                                setErrors({ ...errors, key: '' })
                            }}
                            error={!!errors.key}
                            size="l"
                        />
                        {errors.key && (
                            <div style={{ color: 'var(--g-color-danger)', marginTop: 6 }}>
                                {errors.key}
                            </div>
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
                            value={[typeValue]}
                            width={'max'}
                            onUpdate={(value) => {
                                if (value.length > 0) {
                                    setTypeValue(value[0] as any)
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

                    {/* Уникальное значение */}
                    <div
                        style={{
                            padding: '12px',
                            backgroundColor: 'var(--g-color-bg-secondary)',
                            borderRadius: '4px',
                        }}
                    >
                        <Checkbox checked={uniq} onUpdate={(c) => setUniq(c)}>
                            Уникальное значение
                        </Checkbox>
                    </div>

                    {/* Редактируемые поля только для list */}
                    {field.config.type === 'list' && (
                        <>
                            <Checkbox
                                checked={listMultiple}
                                onUpdate={(checked) => setListMultiple(checked)}
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
                                    items={listItems}
                                    onItemsChange={(items) => {
                                        setListItems(items)
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
                        {typeValue === 'bool' ? (
                            <Select
                                value={[boolDefault]}
                                width="max"
                                onUpdate={(v) => v.length && setBoolDefault(v[0] as any)}
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
                                    typeValue === 'list' && listMultiple
                                        ? 'Например: VIP, Спикер'
                                        : 'Например: value'
                                }
                                value={defaultValue}
                                onUpdate={(v: string) => setDefaultValue(v)}
                                size="l"
                            />
                        )}
                    </div>

                    {/* Флаг random для типа code */}
                    {typeValue === 'code' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Checkbox checked={random} onUpdate={(checked) => setRandom(checked)}>
                                Генерировать случайное значение
                            </Checkbox>
                            {random && field?.config?.random && (
                                <Button
                                    view="flat"
                                    size="s"
                                    loading={isRestarting}
                                    onClick={handleRestartGeneration}
                                    title="Перезапустить генерацию"
                                >
                                    <Icon data={ArrowsRotateRight} size={16} />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Редактируемо в сканере - только для bool */}
                    {typeValue === 'bool' && (
                        <Checkbox
                            checked={scannerEditable}
                            onUpdate={(checked) => setScannerEditable(checked)}
                        >
                            Редактируемо в сканере
                        </Checkbox>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSubmit}
                textButtonCancel="Отмена"
                textButtonApply="Сохранить"
                propsButtonApply={{ loading: updateMutation.isPending }}
            />
        </Dialog>
    )
}

export default EditSchemeModal
