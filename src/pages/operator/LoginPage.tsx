import { useState, useEffect } from 'react'
import { Button, Text, Card, TextInput, Icon, Popup } from '@gravity-ui/uikit'
import { TrashBin, ChevronDown } from '@gravity-ui/icons'
import { FormField } from '@/components/atoms/FormField'
import { FormInput } from '@/components/molecules'
import { useRegisterOperatorMutation } from '@/hooks/mutations/useAuthMutations'

const STORAGE_KEY = 'rega_operator_projects'

// Загрузка истории мероприятий из localStorage
const loadProjectHistory = (): string[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

// Сохранение истории мероприятий в localStorage
const saveProjectHistory = (projects: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

// Добавление проекта в историю (без дубликатов, новые сверху)
const addToHistory = (slug: string) => {
    const history = loadProjectHistory()
    const filtered = history.filter((p) => p !== slug)
    const newHistory = [slug, ...filtered].slice(0, 10) // Максимум 10 записей
    saveProjectHistory(newHistory)
}

// Удаление проекта из истории
const removeFromHistory = (slug: string) => {
    const history = loadProjectHistory()
    saveProjectHistory(history.filter((p) => p !== slug))
}

const OperatorLoginPage = () => {
    const registerMutation = useRegisterOperatorMutation()
    const [project, setProject] = useState('')
    const [name, setName] = useState('')
    const [projectHistory, setProjectHistory] = useState<string[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [anchorRef, setAnchorRef] = useState<HTMLDivElement | null>(null)

    // Загружаем историю при монтировании
    useEffect(() => {
        setProjectHistory(loadProjectHistory())
    }, [])

    // Ошибки приходят в mutation.error.errors
    const fieldErrors = registerMutation.error?.errors || {}

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await registerMutation.mutateAsync({ project, name })
            // После успешного входа сохраняем слаг в историю
            addToHistory(project)
        } catch (error) {
            // Ошибка уже обработана в mutation.error
            console.error(error)
        }
    }

    const handleSelectProject = (slug: string) => {
        setProject(slug)
        setIsDropdownOpen(false)
    }

    const handleRemoveFromHistory = (e: React.MouseEvent, slug: string) => {
        e.stopPropagation()
        removeFromHistory(slug)
        setProjectHistory(loadProjectHistory())
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: 'var(--g-color-base-background)',
            }}
        >
            <Card
                style={{
                    padding: '32px',
                    width: '100%',
                    maxWidth: '400px',
                }}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Text variant="display-1">REGA</Text>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginTop: '8px', display: 'block' }}
                            >
                                Вход в панель оператора
                            </Text>
                        </div>

                        {/* Поле кода мероприятия с историей */}
                        <FormField
                            label="Код мероприятия"
                            required
                            error={fieldErrors.project}
                        >
                            <div ref={setAnchorRef} style={{ position: 'relative' }}>
                                <TextInput
                                    value={project}
                                    onUpdate={setProject}
                                    placeholder="Введите код мероприятия"
                                    size="xl"
                                    autoComplete="off"
                                    validationState={fieldErrors.project ? 'invalid' : undefined}
                                    endContent={
                                        projectHistory.length > 0 ? (
                                            <Button
                                                view="flat"
                                                size="s"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                style={{ 
                                                    marginRight: '4px',
                                                    minWidth: '28px',
                                                    padding: '0 4px',
                                                }}
                                            >
                                                <Icon 
                                                    data={ChevronDown} 
                                                    size={16} 
                                                    style={{
                                                        transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                />
                                            </Button>
                                        ) : undefined
                                    }
                                />
                                <Popup
                                    open={isDropdownOpen && projectHistory.length > 0}
                                    anchorRef={{ current: anchorRef }}
                                    placement="bottom-start"
                                    onClose={() => setIsDropdownOpen(false)}
                                >
                                    <div
                                        style={{
                                            padding: '4px 0',
                                            minWidth: anchorRef?.offsetWidth || 300,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {projectHistory.map((slug) => (
                                            <div
                                                key={slug}
                                                onClick={() => handleSelectProject(slug)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    backgroundColor:
                                                        project === slug
                                                            ? 'var(--g-color-base-selection)'
                                                            : 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (project !== slug) {
                                                        e.currentTarget.style.backgroundColor =
                                                            'var(--g-color-base-simple-hover)'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (project !== slug) {
                                                        e.currentTarget.style.backgroundColor =
                                                            'transparent'
                                                    }
                                                }}
                                            >
                                                <Text variant="body-1">{slug}</Text>
                                                <Button
                                                    view="flat"
                                                    size="xs"
                                                    onClick={(e) => handleRemoveFromHistory(e, slug)}
                                                >
                                                    <Icon data={TrashBin} size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Popup>
                            </div>
                        </FormField>

                        <FormInput
                            label="ФИО"
                            required
                            placeholder="Введите ваше ФИО"
                            value={name}
                            onUpdate={setName}
                            size="xl"
                            autoComplete="name"
                            error={fieldErrors.name}
                        />

                        {fieldErrors.authorize && (
                            <Text variant="body-1" color="danger">
                                {fieldErrors.authorize}
                            </Text>
                        )}

                        <Button
                            type="submit"
                            view="action"
                            size="xl"
                            width="max"
                            loading={registerMutation.isPending}
                            disabled={!project || !name}
                        >
                            Войти
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default OperatorLoginPage
