import { useState, useEffect, useCallback } from 'react'
import { Card, Text, Select, RadioGroup } from '@gravity-ui/uikit'
import { useSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useUpdateProjectMutation } from '@/hooks/mutations/useProjectMutations'
import { Project, ScanAction, ScanActionType } from '@/services/api/projects'
import { FormInput } from '@/components/molecules'

// Типы полей, недоступные для выбора
const EXCLUDED_TYPES = new Set(['code', 'id'])

interface Props {
    project: Project
}

const ACTION_OPTIONS = [
    { value: 'none', content: 'Ничего' },
    { value: 'print', content: 'Печать' },
    { value: 'change', content: 'Изменение' },
]

const ScanActionSection = ({ project }: Props) => {
    const { id: projectId } = useParams<{ id: string }>()
    const { data: schemeData } = useSchemeQuery(projectId || '')
    const updateMutation = useUpdateProjectMutation()
    const { enqueueSnackbar } = useSnackbar()

    const [actionType, setActionType] = useState<ScanActionType>('none')
    const [fieldKey, setFieldKey] = useState<string>('')
    const [value, setValue] = useState<string>('')

    // Поля схемы без code и id
    const availableFields = (schemeData?.fields || []).filter(
        (f) => !EXCLUDED_TYPES.has(f.config.type),
    )

    // Выбранное поле
    const selectedField = availableFields.find((f) => f.key === fieldKey) ?? null

    // При изменении проекта — синхронизируем состояние
    useEffect(() => {
        const action = project.scanAction
        if (!action || action.type === 'none') {
            setActionType('none')
            setFieldKey('')
            setValue('')
        } else if (action.type === 'print') {
            setActionType('print')
            setFieldKey('')
            setValue('')
        } else if (action.type === 'change') {
            setActionType('change')
            setFieldKey(action.fieldKey || '')
            setValue(action.value !== undefined ? String(action.value) : '')
        }
    }, [project.scanAction])

    const save = useCallback(
        (action: ScanAction | null) => {
            updateMutation.mutate(
                { id: project.id, data: { scanAction: action } },
                {
                    onSuccess: () => enqueueSnackbar('Сохранено', { variant: 'success' }),
                    onError: () => enqueueSnackbar('Ошибка сохранения', { variant: 'error' }),
                },
            )
        },
        [project.id, updateMutation, enqueueSnackbar],
    )

    const handleActionTypeChange = (val: string) => {
        const type = val as ScanActionType
        setActionType(type)
        setFieldKey('')
        setValue('')

        if (type === 'none') {
            save(null)
        } else if (type === 'print') {
            save({ type: 'print' })
        }
        // 'change' — ждём выбора поля
    }

    const handleFieldChange = (keys: string[]) => {
        const key = keys[0] || ''
        setFieldKey(key)
        setValue('')
        // Не сохраняем пока не выбрано значение
    }

    const handleValueChange = (val: string | string[]) => {
        const strVal = Array.isArray(val) ? val[0] || '' : val
        setValue(strVal)
        if (fieldKey) {
            const field = availableFields.find((f) => f.key === fieldKey)
            const typedValue: string | boolean =
                field?.config.type === 'bool' ? strVal === 'true' : strVal
            save({ type: 'change', fieldKey, value: typedValue })
        }
    }

    // Опции для Select полей схемы
    const fieldOptions = availableFields.map((f) => ({
        value: f.key,
        content: f.label,
    }))

    // Опции значений в зависимости от типа поля
    const renderValueInput = () => {
        if (!selectedField) return null
        const type = selectedField.config.type

        if (type === 'bool') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Text variant="body-1" color="secondary">
                        Значение
                    </Text>
                    <RadioGroup
                        value={value === '' ? undefined : value}
                        onUpdate={handleValueChange}
                        options={[
                            { value: 'true', content: 'Да' },
                            { value: 'false', content: 'Нет' },
                        ]}
                    />
                </div>
            )
        }

        if (type === 'list') {
            const items = selectedField.config.listSettings?.items || []
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Text variant="body-1" color="secondary">
                        Значение
                    </Text>
                    <Select
                        value={value ? [value] : []}
                        onUpdate={handleValueChange}
                        placeholder="Выберите значение"
                        options={items.map((item) => ({
                            value: item.value,
                            content: item.value,
                        }))}
                        width="max"
                    />
                </div>
            )
        }

        // text, img
        return (
            <FormInput
                label="Значение"
                placeholder="Введите значение"
                value={value}
                onUpdate={(v) => {
                    setValue(v)
                    if (fieldKey) save({ type: 'change', fieldKey, value: v })
                }}
                size="m"
            />
        )
    }

    return (
        <Card style={{ padding: '24px' }}>
            <Text variant="header-2" style={{ display: 'block', marginBottom: '20px' }}>
                Действие при считывании
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Select
                    value={[actionType]}
                    onUpdate={(val) => handleActionTypeChange(val[0] || 'none')}
                    options={ACTION_OPTIONS}
                    width="max"
                />

                {actionType === 'change' && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <Text variant="body-1" color="secondary">
                                Поле
                            </Text>
                            <Select
                                value={fieldKey ? [fieldKey] : []}
                                onUpdate={handleFieldChange}
                                placeholder="Выберите поле"
                                options={fieldOptions}
                                width="max"
                            />
                        </div>

                        {renderValueInput()}
                    </>
                )}
            </div>
        </Card>
    )
}

export default ScanActionSection
