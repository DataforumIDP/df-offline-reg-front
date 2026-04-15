import apiClient from '@/services/api'

/**
 * Запись журнала устройств
 */
export interface JournalRecord {
    id: number
    projectId: number
    zoneId: number | null
    scannerId: number | null
    scannerName: string | null
    zoneName: string | null
    userCode: string
    userName: string | null
    participantId: number | null
    checkoutAt: string
    checkinAt: string | null
    isReturned: boolean
    manualReturn: boolean
    createdAt: string
    updatedAt: string
}

/**
 * Статистика журнала
 */
export interface JournalStats {
    total: number
    onHands: number
    returned: number
}

/**
 * Параметры запроса записей журнала
 */
export interface JournalQueryParams {
    page?: number
    limit?: number
    search?: string
    isReturned?: boolean
    zoneId?: number
    dateStart?: string
    dateEnd?: string
}

/**
 * Ответ со списком записей журнала
 */
export interface JournalRecordsResponse {
    records: JournalRecord[]
    totalRecords: number
    totalPages: number
    page: number
    recordsPerPage: number
}

/**
 * Получить записи журнала
 */
export async function fetchJournalRecords(
    projectId: number,
    params: JournalQueryParams = {}
): Promise<JournalRecordsResponse> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.set('page', String(params.page))
    if (params.limit) queryParams.set('limit', String(params.limit))
    if (params.search) queryParams.set('search', params.search)
    if (params.isReturned !== undefined) queryParams.set('isReturned', String(params.isReturned))
    if (params.zoneId) queryParams.set('zoneId', String(params.zoneId))
    if (params.dateStart) queryParams.set('dateStart', params.dateStart)
    if (params.dateEnd) queryParams.set('dateEnd', params.dateEnd)

    const response = await apiClient.get<JournalRecordsResponse>(
        `/projects/${projectId}/journal?${queryParams.toString()}`
    )
    return response.data
}

/**
 * Получить статистику журнала
 */
export async function fetchJournalStats(projectId: number): Promise<JournalStats> {
    const response = await apiClient.get<JournalStats>(`/projects/${projectId}/journal/stats`)
    return response.data
}

/**
 * Ручной возврат устройства
 */
export async function returnJournalRecord(
    projectId: number,
    recordId: number
): Promise<{ message: string; record: JournalRecord }> {
    const response = await apiClient.post<{ message: string; record: JournalRecord }>(
        `/projects/${projectId}/journal/${recordId}/return`
    )
    return response.data
}
