const FILES_CDN_URL = 'https://files-cdn.dataforum.pro/files/'
const STORAGE_BASE_URL = 'https://51b6eea3-c170-488b-ba78-bef37c6ed524.selstorage.ru'

export interface UploadResult {
  key: string
  url: string
  miniUrl: string
}

/**
 * Сжать изображение до указанного качества
 */
const compressImage = (file: File, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Загрузить файл на CDN
 */
const uploadFile = async (file: File | Blob, filename?: string): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file, filename)

  const response = await fetch(FILES_CDN_URL, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.key
}

/**
 * Получить URL файла по ключу
 */
export const getFileUrl = (key: string): string => {
  return `${STORAGE_BASE_URL}/${key}`
}

/**
 * Получить URL мини-версии по основному URL
 */
export const getMiniUrl = (url: string): string => {
  const key = url.split('/').pop() || ''
  return `${STORAGE_BASE_URL}/mini_${key}`
}

/**
 * Загрузить изображение с мини-версией
 * Возвращает основной URL и URL мини-версии
 */
export const uploadImageWithMini = async (file: File): Promise<UploadResult> => {
  // Загружаем оригинал
  const originalKey = await uploadFile(file, file.name)
  
  // Создаём и загружаем мини-версию (25% качества)
  const miniBlob = await compressImage(file, 0.25)
  const miniFilename = `mini_${originalKey}`
  await uploadFile(miniBlob, miniFilename)

  return {
    key: originalKey,
    url: getFileUrl(originalKey),
    miniUrl: getFileUrl(`mini_${originalKey}`),
  }
}

export default {
  uploadImageWithMini,
  getFileUrl,
  getMiniUrl,
}
