import { useState, useEffect, useCallback } from 'react'
import { Card, Text, Select, RadioGroup, Button, TextInput, Icon } from '@gravity-ui/uikit'
import { Plus, TrashBin } from '@gravity-ui/icons'
import { useSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useUpdateProjectMutation } from '@/hooks/mutations/useProjectMutations'
import { Project, ScanActionRule, ScanActionType } from '@/services/api/projects'
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

const emptyRule = (): ScanActionRule => ({ prefix: '', type: 'none' })

const ScanActionSection = ({ project }: Props) => {
    const { id: projectId } = useParams<{ id: string }>()
    const { data: schemeData } = useSchemeQuery(projectId || '')
    const updateMutation = useUpdateProjectMutation()
    const { enqueueSnackbar } = useSnackbar()

    const [rules, setRules] = useState<ScanActionRule[]>([])

    // Поля схемы без code и id
    const availableFields = (schemeData?.fields || []).filter(
        (f) => !EXCLUDED_TYPES.has(f.config.type),
    )

    // При изменении проекта — синхронизируем состояние
    useEffect(() => {
        setRules(project.scanActionRules ?? [])
    }, [project.scanActionRules])

    const save = useCallback(
        (nextRules: ScanActionRule[]) => {
            updateMutation.mutate(
                { id: project.id, data: { scanActionRules: nextRules } },
                {
                    onSuccess: () => enqueueSnackbar('Сохранено', { variant: 'success' }),
                    onError: () => enqueueSnackbar('Ошибка сохранения', { variant: 'error' }),
                },
            )
        },
        [project.id, updateMutation, enqueueSnackbar],
    )

    const updateRule = (index: number, patch: Partial<ScanActionRule>) => {
        const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r))
        setRules(next)
        // Сохраняем только если правило достаточно заполнено
        const rule = next[index]
        const isReady =
            rule.prefix.trim() !== '' &&
            (rule.type === 'none' ||
                rule.type === 'print' ||
                (rule.type === 'change' && rule.fieldKey))
        if (isReady) save(next)
    }

    const addRule = () => {
        setRules((prev) => [...prev, emptyRule()])
    }

    const removeRule = (index: number) => {
        const next = rules.filter((_, i) => i !== index)
        setRules(next)
        save(next)
    }

    const renderValueInput = (rule: ScanActionRule, index: number) => {
        const field = availableFields.find((f) => f.key === rule.fieldKey) ?? null
        if (!field) return null
        const type = field.config.type
        const currentValue = rule.value !== undefined ? String(rule.value) : ''

        if (type === 'bool') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Text variant="body-1" color="secondary">Значение</Text>
                    <RadioGroup
                        value={currentValue === '' ? undefined : currentValue}
                        onUpdate={(v) => {
                            const typedValue = v === 'true'
                            updateRule(index, { value: typedValue })
                        }}
                        options={[
                            { value: 'true', content: 'Да' },
                            { value: 'false', content: 'Нет' },
                        ]}
                    />
                </div>
            )
        }

        if (type === 'list') {
            const items = field.config.listSettings?.items || []
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Text variant="body-1" color="secondary">Значение</Text>
                    <Select
                        value={currentValue ? [currentValue] : []}
                        onUpdate={(val) => updateRule(index, { value: val[0] || '' })}
                        placeholder="Выберите значение"
                        options={items.map((item) => ({ value: item.value, content: item.value }))}
                        width="max"
                    />
                </div>
            )
        }

        return (
            <FormInput
                label="Значение"
                placeholder="Введите значение"
                value={currentValue}
                onUpdate={(v) => updateRule(index, { value: v })}
                size="m"
            />
        )
    }

    const fieldOptions = availableFields.map((f) => ({ value: f.key, content: f.label }))

    return (
        <Card style={{ padding: '24px' }}>
            <Text variant="header-2" style={{ display: 'block', marginBottom: '20px' }}>
                Действия при считывании
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rules.map((rule, index) => (
                    <Card key={index} style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <Text variant="body-1" color="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                                        Префикс
                                    </Text>
                                    <TextInput
                                        value={rule.prefix}
                                        onUpdate={(v) => updateRule(index, { prefix: v })}
                                        placeholder="например: code_"
                                        size="m"
                                    />
                                </div>
                                <Button
                                    view="flat-danger"
                                    size="m"
                                    onClick={() => removeRule(index)}
                                >
                                    <Icon data={TrashBin} size={16} />
                                </Button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <Text variant="body-1" color="secondary">Действие</Text>
                                <Select
                                    value={[rule.type]}
                                    onUpdate={(val) => {
                                        const type = (val[0] || 'none') as ScanActionType
                                        updateRule(index, { type, fieldKey: undefined, value: undefined })
                                    }}
                                    options={ACTION_OPTIONS}
                                    width="max"
                                />
                            </div>

                            {rule.type === 'change' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <Text variant="body-1" color="secondary">Поле</Text>
                                        <Select
                                            value={rule.fieldKey ? [rule.fieldKey] : []}
                                            onUpdate={(keys) => updateRule(index, { fieldKey: keys[0] || undefined, value: undefined })}
                                            placeholder="Выберите поле"
                                            options={fieldOptions}
                                            width="max"
                                        />
                                    </div>
                                    {rule.fieldKey && renderValueInput(rule, index)}
                                </>
                            )}
                        </div>
                    </Card>
                ))}

                <Button view="outlined" size="m" onClick={addRule}>
                    <Icon data={Plus} size={16} />
                    Добавить правило
                </Button>
            </div>
        </Card>
    )
}

export default ScanActionSection

