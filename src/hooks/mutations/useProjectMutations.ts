import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchCreateProject, fetchUpdateProject, fetchDeleteProject } from '@/services/api/projects'

/**
 * Мутация для создания проекта
 */
export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: any) => fetchCreateProject(data),
    onSuccess: (data) => {
      // Инвалидируем список проектов
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
      // Переходим на страницу settings нового проекта
      navigate(`/admin/projects/${data.id}/settings`)
    },
  })
}

/**
 * Мутация для обновления проекта
 */
export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetchUpdateProject(id, data),
    onSuccess: (data) => {
      // Инвалидируем список проектов и отдельный проект
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
      // Инвалидируем по id как числу и строке (projectId из URL — строка)
      queryClient.invalidateQueries({
        queryKey: ['project', data.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['project', String(data.id)],
      })
    },
  })
}

/**
 * Мутация для удаления проекта
 */
export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => fetchDeleteProject(id),
    onSuccess: () => {
      // Инвалидируем список проектов
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
    },
  })
}
