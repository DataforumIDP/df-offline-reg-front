import apiClient from '@/services/api'

export interface Zone {
    id: number
    projectId: number
    name: string
    free: boolean
    rules: ZoneRule[]
    createdAt: string
    updatedAt: string
}

export interface ZoneRule {
    id: number
    zoneId: number
    listItem: string
    createdAt: string
}

export interface CreateZoneDTO {
    projectId: number
    name: string
    free?: boolean
}

export interface UpdateZoneDTO {
    name?: string
    free?: boolean
}

/**
 * Получить список зон проекта
 */
export const fetchZones = (projectId: number): Promise<Zone[]> => {
    return apiClient.get<Zone[]>('/zones', { params: { projectId } }).then((res) => res.data)
}

/**
 * Получить одну зону
 */
export const fetchZoneById = (zoneId: number): Promise<Zone> => {
    return apiClient.get<Zone>(`/zones/${zoneId}`).then((res) => res.data)
}

/**
 * Создать зону
 */
export const createZone = (data: CreateZoneDTO): Promise<Zone> => {
    return apiClient.post<Zone>('/zones', data).then((res) => res.data)
}

/**
 * Обновить зону
 */
export const updateZone = (zoneId: number, data: UpdateZoneDTO): Promise<Zone> => {
    return apiClient.put<Zone>(`/zones/${zoneId}`, data).then((res) => res.data)
}

/**
 * Удалить зону
 */
export const deleteZone = (zoneId: number): Promise<void> => {
    return apiClient.delete(`/zones/${zoneId}`).then(() => {})
}

/**
 * Добавить правило доступа
 */
export const createZoneRule = (zoneId: number, listItem: string): Promise<ZoneRule> => {
    return apiClient.post<ZoneRule>(`/zones/${zoneId}/rules`, { listItem }).then((res) => res.data)
}

/**
 * Удалить правило доступа
 */
export const deleteZoneRule = (zoneId: number, ruleId: number): Promise<void> => {
    return apiClient.delete(`/zones/${zoneId}/rules/${ruleId}`).then(() => {})
}

/**
 * Конфиг зоны для QR кода сканера
 */
export interface ZoneConfig {
    server: string
    project: string
    zone: number
    authorize: {
        access: string
        secret: string
    }
}

/**
 * Получить конфиг зоны для QR
 */
export const fetchZoneConfig = (zoneId: number): Promise<ZoneConfig> => {
    return apiClient.get<ZoneConfig>(`/zones/${zoneId}/config`).then((res) => res.data)
}

/**
 * Устройство (сканер) с количеством логов
 */
export interface ZoneScanner {
    id: number
    scannerId: string
    projectId: number
    zoneId: number
    name: string | null
    lastSeenAt: string | null
    createdAt: string
    logsCount: number
    isCurrentZone: boolean
}

/**
 * Получить список устройств зоны
 */
export const fetchZoneScanners = (zoneId: number): Promise<ZoneScanner[]> => {
    return apiClient.get<ZoneScanner[]>(`/zones/${zoneId}/scanners`).then((res) => res.data)
}
