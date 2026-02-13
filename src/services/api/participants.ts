import apiClient from '@/services/api'

export interface ParticipantFieldValue {
    [key: string]: any
}

export interface Participant {
    id: number
    projectId: number
    data: ParticipantFieldValue
    createdAt: string
    updatedAt: string
}

export interface ParticipantsQuery {
    page?: number
    limit?: number
    search?: string
    order?: string
    direction?: 'ASC' | 'DESC'
    filters?: Record<string, string | string[]>
}

/**
 * Получить список участников проекта
 */
export const fetchParticipants = (projectId: number, params?: ParticipantsQuery): Promise<any> => {
    // Преобразуем filters в JSON строку для передачи на бэкенд
    const queryParams = params
        ? {
              ...params,
              filters: params.filters ? JSON.stringify(params.filters) : undefined,
          }
        : undefined

    return apiClient
        .get(`/projects/${projectId}/participants`, { params: queryParams })
        .then((res) => res.data)
}

/**
 * Получить участника по ID
 */
export const fetchParticipantById = (
    projectId: number,
    participantId: number,
): Promise<Participant> => {
    return apiClient
        .get<Participant>(`/projects/${projectId}/participants/${participantId}`)
        .then((res) => res.data)
}

/**
 * Создать участника
 */
export const fetchCreateParticipant = (
    projectId: number,
    data: ParticipantFieldValue,
): Promise<Participant> => {
    return apiClient
        .post<Participant>(`/projects/${projectId}/participants`, data)
        .then((res) => res.data)
}

/**
 * Обновить участника
 */
export const fetchUpdateParticipant = (
    projectId: number,
    participantId: number,
    data: ParticipantFieldValue,
): Promise<Participant> => {
    return apiClient
        .put<Participant>(`/projects/${projectId}/participants/${participantId}`, data)
        .then((res) => res.data)
}

/**
 * Удалить участника
 */
export const fetchDeleteParticipant = (projectId: number, participantId: number): Promise<void> => {
    return apiClient.delete(`/projects/${projectId}/participants/${participantId}`).then(() => {})
}

/**
 * Отметить печать участника
 */
export const fetchPrintParticipant = (projectId: number, participantId: number): Promise<any> => {
    return apiClient
        .post(`/projects/${projectId}/participants/${participantId}/print`)
        .then((res) => res.data)
}

/**
 * Получить логи участника
 */
export const fetchParticipantLogs = (projectId: number, participantId: number): Promise<any> => {
    return apiClient
        .get(`/projects/${projectId}/participants/${participantId}/log`)
        .then((res) => res.data)
}

/**
 * Получить количество печатей участника
 */
export const fetchParticipantPrintCount = (
    projectId: number,
    participantId: number,
): Promise<{ printCount: number }> => {
    return apiClient
        .get<{ printCount: number }>(`/projects/${projectId}/participants/${participantId}/printCount`)
        .then((res) => res.data)
}

/**
 * Получить статистику логов
 */
export const fetchParticipantLogsStats = (projectId: number): Promise<any> => {
    return apiClient.get(`/projects/${projectId}/participants/log/stats`).then((res) => res.data)
}

/**
 * Получить логи действий с участниками
 */
export const fetchParticipantActionLogs = (projectId: number, params?: any): Promise<any> => {
    return apiClient
        .get(`/projects/${projectId}/participants/log`, { params })
        .then((res) => res.data)
}

/**
 * Скачать шаблон Excel для импорта
 */
export const fetchExcelTemplate = (projectId: number): Promise<Blob> => {
    return apiClient
        .get(`/projects/${projectId}/participants/excel`, { responseType: 'blob' })
        .then((res) => res.data)
}

/**
 * Импортировать участников из Excel
 */
export interface ImportExcelError {
    row: number
    field: string
    message: string
}

export interface ImportExcelResult {
    success: boolean
    imported?: number
    message?: string
    errors?: ImportExcelError[]
}

export const fetchImportExcel = (projectId: number, file: File): Promise<ImportExcelResult> => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient
        .post<ImportExcelResult>(`/projects/${projectId}/participants/excel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((res) => res.data)
}

/**
 * Экспортировать участников в Excel
 */
export const fetchExportExcel = (projectId: number, params?: ParticipantsQuery): Promise<Blob> => {
    const queryParams = params
        ? {
              ...params,
              filters: params.filters ? JSON.stringify(params.filters) : undefined,
          }
        : undefined

    return apiClient
        .get(`/projects/${projectId}/participants/export`, {
            params: queryParams,
            responseType: 'blob',
        })
        .then((res) => res.data)
}

/**
 * Очистить всех участников проекта
 */
export interface ClearParticipantsResult {
    success: boolean
    deleted: {
        participants: number
        logs: number
    }
    message: string
}

export const fetchClearParticipants = (projectId: number): Promise<ClearParticipantsResult> => {
    return apiClient
        .delete<ClearParticipantsResult>(`/projects/${projectId}/participants`)
        .then((res) => res.data)
}

/**
 * Очистить отметки печати
 */
export interface ClearPrintMarksResult {
    success: boolean
    deleted: number
    message: string
}

export const fetchClearPrintMarks = (projectId: number): Promise<ClearPrintMarksResult> => {
    return apiClient
        .delete<ClearPrintMarksResult>(`/projects/${projectId}/prints`)
        .then((res) => res.data)
}

/**
 * Очистить логи сканеров
 */
export interface ClearScannerLogsResult {
    success: boolean
    deleted: number
    message: string
}

export const fetchClearScannerLogs = (projectId: number): Promise<ClearScannerLogsResult> => {
    return apiClient
        .delete<ClearScannerLogsResult>(`/projects/${projectId}/scanners/logs`)
        .then((res) => res.data)
}

/**
 * Параметры экспорта статистики сканирований
 */
export interface ExportScansParams {
    keys?: string[] // Ключи схемы для выборки
    zones?: number[] // ID зон для фильтрации
    filter?: Record<string, any>[] // Фильтры по полям
    timeRange?: string[] // [startISO, endISO]
    addPrints?: boolean // Включать количество печатей
}

/**
 * Экспорт статистики сканирований в Excel
 */
export const fetchExportScans = async (
    projectId: number,
    params: ExportScansParams
): Promise<Blob> => {
    const response = await apiClient.post(`/projects/${projectId}/scans/excel`, params, {
        responseType: 'blob',
    })
    return response.data
}

/**
 * Поиск участника по коду
 */
export const fetchParticipantByCode = (projectId: number, code: string): Promise<Participant> => {
    return apiClient
        .get<Participant>(`/projects/${projectId}/code/${encodeURIComponent(code)}`)
        .then((res) => res.data)
}
