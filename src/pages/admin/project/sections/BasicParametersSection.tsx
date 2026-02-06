import { Text, Card, Label, Checkbox } from '@gravity-ui/uikit'
import { FormInput } from '@/components/molecules'
import { useState, useEffect, useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { useUpdateProjectMutation } from '@/hooks/mutations/useProjectMutations'
import { useDebounce } from '@/hooks'
import { Project } from '@/services/api/projects'

// Определяем статус проекта (прошедший, идущий, будущий)
const getProjectStatus = (
    dateStart: string,
    dateEnd: string,
): { label: string; theme: 'normal' | 'unknown' | 'success' } => {
    const now = new Date()
    const start = new Date(dateStart)
    const end = new Date(dateEnd)

    if (now < start) {
        return { label: 'Будущее', theme: 'normal' }
    } else if (now > end) {
        return { label: 'Прошедшее', theme: 'unknown' }
    } else {
        return { label: 'Идёт', theme: 'success' }
    }
}

interface BasicParametersSectionProps {
    project: Project
}

const BasicParametersSection = ({ project }: BasicParametersSectionProps) => {
    const updateMutation = useUpdateProjectMutation()
    const { enqueueSnackbar } = useSnackbar()

    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [isOperatorEditable, setIsOperatorEditable] = useState(false)

    // Дебаунс для каждого поля
    const debouncedTitle = useDebounce(title, 1000)
    const debouncedDescription = useDebounce(description, 1000)

    // Загружаем данные проекта
    useEffect(() => {
        setTitle(project.title)
        setSlug(project.slug)
        setDescription(project.description || '')
        setIsOperatorEditable(project.isOperatorEditable ?? false)
    }, [project])

    // Дебаунс обновление название
    useEffect(() => {
        if (debouncedTitle !== project.title && debouncedTitle) {
            updateMutation.mutate(
                { id: project.id, data: { title: debouncedTitle } },
                {
                    onSuccess: () => {
                        enqueueSnackbar('Сохранено', { variant: 'success' })
                    },
                },
            )
        }
    }, [debouncedTitle])

    // Дебаунс обновление описания
    useEffect(() => {
        if (debouncedDescription !== project.description) {
            updateMutation.mutate(
                { id: project.id, data: { description: debouncedDescription || '' } },
                {
                    onSuccess: () => {
                        enqueueSnackbar('Сохранено', { variant: 'success' })
                    },
                },
            )
        }
    }, [debouncedDescription])

    // Обновление права редактирования оператором
    const handleOperatorEditableChange = useCallback(
        (checked: boolean) => {
            setIsOperatorEditable(checked)
            updateMutation.mutate(
                { id: project.id, data: { isOperatorEditable: checked } },
                {
                    onSuccess: () => {
                        enqueueSnackbar('Сохранено', { variant: 'success' })
                    },
                },
            )
        },
        [project.id, updateMutation, enqueueSnackbar],
    )

    const status = getProjectStatus(project.dateStart, project.dateEnd)
    const formattedDateStart = new Date(project.dateStart).toLocaleDateString('ru-RU')
    const formattedDateEnd = new Date(project.dateEnd).toLocaleDateString('ru-RU')

    return (
        <Card style={{ padding: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                }}
            >
                <Text variant="header-2">Основные параметры</Text>
                <Label size="s" theme={status.theme}>
                    {status.label}
                </Label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormInput
                    label="Название проекта"
                    placeholder="Введите название"
                    value={title}
                    onUpdate={setTitle}
                    size="l"
                    required
                />

                <FormInput label="Slug" placeholder="project-slug" value={slug} size="l" readOnly />

                <div>
                    <label
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--g-color-text-primary)',
                        }}
                    >
                        Описание
                    </label>
                    <textarea
                        placeholder="Описание проекта"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid var(--g-color-line-generic)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            backgroundColor: 'var(--g-color-base-background)',
                            color: 'var(--g-color-text-primary)',
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FormInput label="Дата начала" value={formattedDateStart} size="l" readOnly />
                    <FormInput label="Дата окончания" value={formattedDateEnd} size="l" readOnly />
                </div>

                <div style={{ marginTop: '8px' }}>
                    <Checkbox
                        checked={isOperatorEditable}
                        onUpdate={handleOperatorEditableChange}
                        size="l"
                    >
                        Разрешить операторам редактировать данные участников
                    </Checkbox>
                </div>
            </div>
        </Card>
    )
}

export default BasicParametersSection
