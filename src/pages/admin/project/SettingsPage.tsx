import { Text, Button, Dialog } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { useDeleteProjectMutation } from '@/hooks/mutations/useProjectMutations'
import BasicParametersSection from './sections/BasicParametersSection'
import ExportImportSection from './sections/ExportImportSection'
import ProjectSchemeSection from './sections/ProjectSchemeSection'

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
      <div style={{ padding: '24px' }}>
        <Text variant="display-1">Настройки проекта</Text>
        <Text variant="body-1" color="secondary" style={{ marginTop: '12px' }}>
          Загрузка...
        </Text>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: '24px' }}>
        <Text variant="display-1">Настройки проекта</Text>
        <Text variant="body-1" color="danger" style={{ marginTop: '12px' }}>
          Проект не найден
        </Text>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Text variant="display-1">Настройки проекта</Text>
        <Button view="outlined-danger" size="l" onClick={handleDeleteClick} disabled={deleteProjectMutation.isPending}>
          Удалить проект
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Левая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {project && <BasicParametersSection project={project} />}
          <ExportImportSection />
        </div>

        {/* Правая колонка */}
        <div>
          <ProjectSchemeSection />
        </div>
      </div>

      <Dialog open={isDeleteModalOpen} onClose={handleCancelDelete} aria-labelledby={deleteDialogTitleId}>
        <Dialog.Header caption="Удалить проект?" id={deleteDialogTitleId} />
        <Dialog.Footer
          onClickButtonCancel={handleCancelDelete}
          onClickButtonApply={handleConfirmDelete}
          textButtonCancel="Отмена"
          textButtonApply="Да, удалить"
          propsButtonApply={{ loading: deleteProjectMutation.isPending }}
        />
      </Dialog>
    </div>
  )
}

export default ProjectSettingsPage
