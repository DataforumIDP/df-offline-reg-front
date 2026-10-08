import apiClient from '@/services/api'

export interface PaginatedResponse<T> {
    records: T[]
    page: number
    totalPages: number
    totalRecords: number
    recordsPerPage: number
}

export interface ProjectStats {
    participants: number
    printings: number
}

export type ScanMode = 'base' | 'direction' | 'view'

export type ScanActionType = 'none' | 'print' | 'change' | 'view'

export interface ScanAction {
    type: ScanActionType
    fieldKey?: string
    value?: string | boolean
}

export interface ScanActionRule {
    prefix: string
    type: ScanActionType
    fieldKey?: string
    value?: string | boolean
}

export interface Project {
    id: number
    title: string
    slug: string
    description?: string
    dateStart: string
    dateEnd: string
    isOperatorEditable?: boolean
    colorRow?: boolean
    repeatPrintEnabled?: boolean
    repeatPrintCount?: number
    journalEnabled?: boolean
    rulesField?: string | null
    scanMode?: ScanMode
    scanAction?: ScanAction | null
    scanActionRules?: ScanActionRule[]
    stats?: ProjectStats
    createdAt: string
    updatedAt: string
}

export interface ProjectsQuery {
    page?: number
    limit?: number
    search?: string
    dateStart?: string
    dateEnd?: string
}

/**
 * Получить список проектов
 */
export const fetchProjects = (params?: ProjectsQuery): Promise<PaginatedResponse<Project>> => {
    return apiClient
        .get<PaginatedResponse<Project>>('/projects', { params })
        .then((res) => res.data)
}

/**
 * Получить проект по ID или slug
 */
export const fetchProjectById = (id: string | number): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`).then((res) => res.data)
}

/**
 * Создать проект
 */
export const fetchCreateProject = (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Project> => {
    return apiClient.post<Project>('/projects', data).then((res) => res.data)
}

/**
 * Обновить проект
 */
export const fetchUpdateProject = (
    id: number,
    data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Project> => {
    return apiClient.patch<Project>(`/projects/${id}`, data).then((res) => res.data)
}

/**
 * Удалить проект
 */
export const fetchDeleteProject = (id: number): Promise<void> => {
    return apiClient.delete(`/projects/${id}`).then(() => {})
}

/**
 * Устройство (сканер) проекта
 */
export interface Device {
    id: number
    scannerId: string
    projectId: number
    zoneId: number
    zoneName: string
    name: string | null
    lastSeenAt: string | null
    isCheckedOut: boolean
    checkedOutAt: string | null
    createdAt: string
    updatedAt: string
}

/**
 * Получить список устройств (сканеров) проекта
 */
export const fetchProjectDevices = (projectId: number): Promise<Device[]> => {
    return apiClient.get<Device[]>(`/projects/${projectId}/devices`).then((res) => res.data)
}
