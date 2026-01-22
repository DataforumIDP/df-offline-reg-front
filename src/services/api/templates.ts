import apiClient from '@/services/api'

export interface PrintTemplate {
  id: number
  name: string
  settings?: Record<string, any>
  preloader?: string
  createdAt: string
  updatedAt: string
}

/**
 * Получить все шаблоны печати
 */
export const fetchPrintTemplates = (search?: string): Promise<{ templates: PrintTemplate[] }> => {
  return apiClient
    .get('/print-templates', { params: { search } })
    .then(res => res.data)
}

/**
 * Получить шаблон печати по ID
 */
export const fetchPrintTemplateById = (id: number): Promise<PrintTemplate> => {
  return apiClient.get<PrintTemplate>(`/print-templates/${id}`).then(res => res.data)
}

/**
 * Создать шаблон печати
 */
export const fetchCreatePrintTemplate = (
  data: Omit<PrintTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PrintTemplate> => {
  return apiClient.post<PrintTemplate>('/print-templates', data).then(res => res.data)
}

/**
 * Обновить шаблон печати
 */
export const fetchUpdatePrintTemplate = (
  id: number,
  data: Partial<Omit<PrintTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<PrintTemplate> => {
  return apiClient.put<PrintTemplate>(`/print-templates/${id}`, data).then(res => res.data)
}

/**
 * Удалить шаблон печати
 */
export const fetchDeletePrintTemplate = (id: number): Promise<void> => {
  return apiClient.delete(`/print-templates/${id}`).then(() => {})
}

/**
 * Назначить шаблон проекту
 */
export const fetchAssignPrintTemplateToProject = (
  projectId: number,
  templateId: number
): Promise<any> => {
  return apiClient
    .post(`/projects/${projectId}/print-template`, { templateId })
    .then(res => res.data)
}

/**
 * Получить шаблон проекта
 */
export const fetchProjectPrintTemplate = (projectId: number): Promise<{ template: PrintTemplate | null }> => {
  return apiClient
    .get(`/projects/${projectId}/print-template`)
    .then(res => res.data)
}

/**
 * Удалить шаблон у проекта
 */
export const fetchDeleteProjectPrintTemplate = (projectId: number): Promise<void> => {
  return apiClient.delete(`/projects/${projectId}/print-template`).then(() => {})
}
