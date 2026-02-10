import { Text, Button, Card, Skeleton, Label } from '@gravity-ui/uikit'
import { Plus, ChevronLeft, ChevronRight } from '@gravity-ui/icons'
import { useState } from 'react'
import { useProjectsQuery } from '@/hooks'
import { PageWrapper, PageHeader, PageHeaderActions, SearchInput } from '@/components/atoms'
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
            <PageWrapper>
                <Text variant="body-1" color="danger">
                    Ошибка загрузки проектов: {error.message}
                </Text>
            </PageWrapper>
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
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Проекты</Text>
                <PageHeaderActions>
                    <Button view="action" size="l" onClick={() => setIsCreateModalOpen(true)}>
                        <Button.Icon>
                            <Plus />
                        </Button.Icon>
                        Создать проект
                    </Button>
                </PageHeaderActions>
            </PageHeader>

            <SearchInput
                placeholder="Поиск проектов..."
                value={search}
                onUpdate={(newValue) => {
                    setSearch(newValue)
                    setCurrentPage(1) // Сброс на первую страницу при поиске
                }}
                size="l"
                fullWidth
            />

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
                                    style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
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
                                            marginTop: 'auto',
                                            paddingTop: '16px',
                                            borderTop: '1px solid var(--g-color-line-generic)',
                                        }}
                                    >
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Text variant="caption-2" color="secondary">
                                                Участников
                                            </Text>
                                            <Text variant="body-1" style={{ fontWeight: 500 }}>
                                                {stats.participants}
                                            </Text>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            <CreateProjectModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </PageWrapper>
    )
}

export default ProjectsPage
