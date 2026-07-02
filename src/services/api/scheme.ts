import apiClient from '@/services/api'

export interface ProjectSchemeField {
    id: number
    projectId: number
    label: string
    key: string
    scannerEditable?: boolean // только для bool - можно менять в сканере
    config: {
        type: 'text' | 'list' | 'bool' | 'id' | 'img' | 'code'
        uniq: boolean
        optional?: boolean
        showInScanner?: boolean
        isMark?: boolean
        maxLength?: number
        random?: boolean
        codeLength?: number
        codeChars?: string
        listSettings?: {
            items: { value: string; color: string }[]
            multiple?: boolean
        }
    }
}

/**
 * Получить схему проекта
 */
export const fetchProjectScheme = (
    projectId: number,
): Promise<{ fields: ProjectSchemeField[] }> => {
    return apiClient.get(`/projects/${projectId}/scheme`).then((res) => res.data)
}

/**
 * Добавить поле в схему
 */
export const fetchAddSchemeField = (
    projectId: number,
    field: Omit<ProjectSchemeField, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
): Promise<ProjectSchemeField> => {
    return apiClient
        .post<ProjectSchemeField>(`/projects/${projectId}/scheme`, field)
        .then((res) => res.data)
}

/**
 * Обновить поле схемы
 */
export const fetchUpdateSchemeField = (
    projectId: number,
    fieldId: number,
    data: Partial<ProjectSchemeField>,
): Promise<ProjectSchemeField> => {
    return apiClient
        .put<ProjectSchemeField>(`/projects/${projectId}/scheme/${fieldId}`, data)
        .then((res) => res.data)
}

/**
 * Удалить поле схемы
 */
export const fetchDeleteSchemeField = (projectId: number, fieldId: number): Promise<void> => {
    return apiClient.delete(`/projects/${projectId}/scheme/${fieldId}`).then(() => {})
}
