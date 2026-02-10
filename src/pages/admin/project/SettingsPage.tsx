import { Text, Button, Dialog } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { PageWrapper, PageHeader, PageHeaderActions } from '@/components/atoms'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { useDeleteProjectMutation } from '@/hooks/mutations/useProjectMutations'
import BasicParametersSection from './sections/BasicParametersSection'
import ExportImportSection from './sections/ExportImportSection'
import ProjectSchemeSection from './sections/ProjectSchemeSection'
import styles from './SettingsPage.module.css'

const ProjectSettingsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { data: project, isLoading } = useProjectQuery(projectId || '')
    const deleteProjectMutation = useDeleteProjectMutation()
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const deleteDialogTitleId = 'delete-project-dialog-title'

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = () => {
        setIsDeleteModalOpen(false)
        deleteProjectMutation.mutate(parseInt(projectId || ''), {
            onSuccess: () => {
                enqueueSnackbar('Проект удалён', { variant: 'success' })
                navigate('/admin/projects')
            },
            onError: () => {
                enqueueSnackbar('Ошибка удаления проекта', { variant: 'error' })
            },
        })
    }

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false)
    }

    if (isLoading) {
        return (
            <PageWrapper>
                <Text variant="display-1">Настройки проекта</Text>
                <Text variant="body-1" color="secondary">
                    Загрузка...
                </Text>
            </PageWrapper>
        )
    }

    if (!project) {
        return (
            <PageWrapper>
                <Text variant="display-1">Настройки проекта</Text>
                <Text variant="body-1" color="danger">
                    Проект не найден
                </Text>
            </PageWrapper>
        )
    }

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Настройки проекта</Text>
                <PageHeaderActions>
                    <Button
                        view="outlined-danger"
                        size="l"
                        onClick={handleDeleteClick}
                        disabled={deleteProjectMutation.isPending}
                    >
                        Удалить проект
                    </Button>
                </PageHeaderActions>
            </PageHeader>

            <div className={styles.grid}>
                {/* Схема проекта - первая на мобилке */}
                <div className={styles.schemeColumn}>
                    <ProjectSchemeSection />
                </div>

                {/* Основные настройки */}
                <div className={styles.settingsColumn}>
                    {project && <BasicParametersSection project={project} />}
                    <ExportImportSection />
                </div>
            </div>

            <Dialog
                open={isDeleteModalOpen}
                onClose={handleCancelDelete}
                aria-labelledby={deleteDialogTitleId}
            >
                <Dialog.Header caption="Удалить проект?" id={deleteDialogTitleId} />
                <Dialog.Footer
                    onClickButtonCancel={handleCancelDelete}
                    onClickButtonApply={handleConfirmDelete}
                    textButtonCancel="Отмена"
                    textButtonApply="Да, удалить"
                    propsButtonApply={{ loading: deleteProjectMutation.isPending }}
                />
            </Dialog>
        </PageWrapper>
    )
}

export default ProjectSettingsPage
