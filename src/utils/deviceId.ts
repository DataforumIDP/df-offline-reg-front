const KEY = 'rega_device_id'

/**
 * Возвращает постоянный идентификатор устройства.
 * При первом вызове генерирует случайную строку из 40 символов и сохраняет в localStorage.
 * При последующих вызовах возвращает сохранённое значение.
 */
export function getDeviceId(): string {
    let id = localStorage.getItem(KEY)
    if (!id) {
        id = generateId()
        localStorage.setItem(KEY, id)
    }
    return id
}

function generateId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const array = new Uint8Array(40)
    crypto.getRandomValues(array)
    return Array.from(array, (b) => chars[b % chars.length]).join('')
}
