import { Text, Button, Card, TextInput, Skeleton, Label } from '@gravity-ui/uikit'
import { Plus, Magnifier, ChevronLeft, ChevronRight } from '@gravity-ui/icons'
import { useState } from 'react'
import { useProjectsQuery } from '@/hooks'
import CreateProjectModal from '@/components/organisms/CreateProjectModal'

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

const ProjectsPage = () => {
    const [search, setSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Получаем список проектов с поиском и пагинацией
    const { data, isLoading, error } = useProjectsQuery({
        page: currentPage,
        limit: 20,
        search,
    })

    const projects = data?.records || []
    const totalPages = data?.totalPages || 1

    if (error) {
        return (
            <div style={{ padding: '24px' }}>
                <Text variant="body-1" color="danger">
                    Ошибка загрузки проектов: {error.message}
                </Text>
            </div>
        )
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    return (
        <div style={{ padding: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}
            >
                <Text variant="display-1">Проекты</Text>
                <Button view="action" size="l" onClick={() => setIsCreateModalOpen(true)}>
                    <Button.Icon>
                        <Plus />
                    </Button.Icon>
                    Создать проект
                </Button>
            </div>

            <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
                <TextInput
                    placeholder="Поиск проектов..."
                    value={search}
                    onUpdate={(newValue) => {
                        setSearch(newValue)
                        setCurrentPage(1) // Сброс на первую страницу при поиске
                    }}
                    size="l"
                    startContent={<Magnifier />}
                />
            </div>

            {isLoading ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {[1, 2, 3].map((i) => (
                        <Card key={i} style={{ padding: '20px' }}>
                            <Skeleton />
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px',
                        }}
                    >
                        {projects.map((project) => {
                            const status = getProjectStatus(project.dateStart, project.dateEnd)
                            const stats = project.stats || { participants: 0, printings: 0 }

                            return (
                                <Card
                                    key={project.id}
                                    type="action"
                                    style={{ padding: '20px', cursor: 'pointer' }}
                                    onClick={() =>
                                        (window.location.href = `/admin/projects/${project.id}/participants`)
                                    }
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        <Text variant="header-1" style={{ flex: 1 }}>
                                            {project.title}
                                        </Text>
                                        <div style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                            <Label theme={status.theme}>{status.label}</Label>
                                        </div>
                                    </div>

                                    <Text
                                        variant="body-2"
                                        color="secondary"
                                        style={{ marginBottom: '12px', display: 'block' }}
                                    >
                                        {project.slug}
                                    </Text>

                                    {project.description && (
                                        <Text
                                            variant="body-2"
                                            color="secondary"
                                            style={{ marginBottom: '12px', display: 'block' }}
                                        >
                                            {project.description}
                                        </Text>
                                    )}

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            marginTop: '16px',
                                            paddingTop: '16px',
                                            borderTop: '1px solid var(--g-color-line-generic)',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <Text variant="caption-2" color="secondary">
                                                Участников
                                            </Text>
                                            <Text variant="body-1" style={{ fontWeight: 500 }}>
                                                {stats.participants}
                                            </Text>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text variant="caption-2" color="secondary">
                                                Распечатано
                                            </Text>
                                            <Text variant="body-1" style={{ fontWeight: 500 }}>
                                                {stats.printings}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '32px',
                            }}
                        >
                            <Button
                                view="outlined"
                                size="m"
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                            >
                                <Button.Icon>
                                    <ChevronLeft />
                                </Button.Icon>
                            </Button>

                            <Text variant="body-2">
                                Страница {currentPage} из {totalPages}
                            </Text>

                            <Button
                                view="outlined"
                                size="m"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                <Button.Icon>
                                    <ChevronRight />
                                </Button.Icon>
                            </Button>
                        </div>
                    )}
                </>
            )}

            <CreateProjectModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    )
}

export default ProjectsPage
