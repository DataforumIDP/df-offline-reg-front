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
}

/**
 * Получить список участников проекта
 */
export const fetchParticipants = (
  projectId: number,
  params?: ParticipantsQuery
): Promise<any> => {
  return apiClient
    .get(`/projects/${projectId}/participants`, { params })
    .then(res => res.data)
}

/**
 * Получить участника по ID
 */
export const fetchParticipantById = (projectId: number, participantId: number): Promise<Participant> => {
  return apiClient
    .get<Participant>(`/projects/${projectId}/participants/${participantId}`)
    .then(res => res.data)
}

/**
 * Создать участника
 */
export const fetchCreateParticipant = (
  projectId: number,
  data: { data: ParticipantFieldValue }
): Promise<Participant> => {
  return apiClient
    .post<Participant>(`/projects/${projectId}/participants`, data)
    .then(res => res.data)
}

/**
 * Обновить участника
 */
export const fetchUpdateParticipant = (
  projectId: number,
  participantId: number,
  data: { data: ParticipantFieldValue }
): Promise<Participant> => {
  return apiClient
    .patch<Participant>(`/projects/${projectId}/participants/${participantId}`, data)
    .then(res => res.data)
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
    .then(res => res.data)
}

/**
 * Получить логи участника
 */
export const fetchParticipantLogs = (projectId: number, participantId: number): Promise<any> => {
  return apiClient
    .get(`/projects/${projectId}/participants/${participantId}/log`)
    .then(res => res.data)
}

/**
 * Получить статистику логов
 */
export const fetchParticipantLogsStats = (projectId: number): Promise<any> => {
  return apiClient
    .get(`/projects/${projectId}/participants/log/stats`)
    .then(res => res.data)
}

/**
 * Получить логи действий с участниками
 */
export const fetchParticipantActionLogs = (projectId: number, params?: any): Promise<any> => {
  return apiClient
    .get(`/projects/${projectId}/participants/log`, { params })
    .then(res => res.data)
}
