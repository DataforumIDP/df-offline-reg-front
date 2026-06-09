import apiClient from '@/services/api'

export type EmailProvider = 'smtp' | 'rusender'

export interface EmailAccount {
    id: number
    slug: string
    provider: EmailProvider
    host: string | null
    port: number | null
    secure: boolean | null
    login: string | null
    alias: string | null
    fromName: string | null
    createdAt: string
    updatedAt: string
}

export interface CreateEmailAccountPayload {
    slug: string
    provider: EmailProvider
    host?: string
    port?: number
    secure?: boolean
    login?: string
    password?: string
    apiKey?: string
    alias?: string
    fromName?: string
}

export interface UpdateEmailAccountPayload {
    slug?: string
    provider?: EmailProvider
    host?: string
    port?: number
    secure?: boolean
    login?: string
    /** Передавать только если меняется */
    password?: string
    apiKey?: string
    alias?: string
    fromName?: string
}

export const fetchEmailAccounts = (): Promise<{ accounts: EmailAccount[] }> =>
    apiClient.get('/email-accounts').then((r) => r.data)

export const createEmailAccount = (payload: CreateEmailAccountPayload): Promise<EmailAccount> =>
    apiClient.post('/email-accounts', payload).then((r) => r.data)

export const updateEmailAccount = (id: number, payload: UpdateEmailAccountPayload): Promise<EmailAccount> =>
    apiClient.put(`/email-accounts/${id}`, payload).then((r) => r.data)

export const deleteEmailAccount = (id: number): Promise<void> =>
    apiClient.delete(`/email-accounts/${id}`).then(() => {})
