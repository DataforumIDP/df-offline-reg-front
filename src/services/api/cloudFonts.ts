import apiClient from '@/services/api'

export interface CloudFontVariants {
    normal: string
    bold: string
    italic: string
    bolditalic: string
}

export interface CloudFont {
    id: number
    name: string
    variants: CloudFontVariants
    createdAt: string
    updatedAt: string
}

export interface CreateCloudFontPayload {
    name: string
    normalUrl: string
    boldUrl: string
    italicUrl: string
    bolditalicUrl: string
}

/**
 * Получить список облачных шрифтов
 */
export const fetchCloudFonts = (): Promise<{ fonts: CloudFont[] }> =>
    apiClient.get('/cloud-fonts').then((r) => r.data)

/**
 * Создать облачный шрифт (сохранить ссылки)
 */
export const createCloudFont = (payload: CreateCloudFontPayload): Promise<CloudFont> =>
    apiClient.post('/cloud-fonts', payload).then((r) => r.data)

/**
 * Удалить облачный шрифт
 */
export const deleteCloudFont = (id: number): Promise<void> =>
    apiClient.delete(`/cloud-fonts/${id}`).then(() => {})
