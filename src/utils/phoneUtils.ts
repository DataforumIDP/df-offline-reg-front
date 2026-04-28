import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

/**
 * Форматирование телефонного номера для отображения.
 * Приводит к международному формату страны (например, +7 (952) 484-80-41).
 * Если форматирование не удалось — возвращает исходную строку.
 *
 * @param phone - номер телефона (только цифры или любой формат)
 * @param defaultCountry - страна по умолчанию для парсинга (по умолчанию RU)
 * @returns отформатированный номер или исходная строка
 */
export function formatPhone(
    phone: string | number | null | undefined,
    defaultCountry: CountryCode = 'RU',
): string {
    if (phone === null || phone === undefined || phone === '') {
        return ''
    }

    const phoneStr = String(phone)

    // Если номер пустой после очистки — вернуть пустую строку
    if (!phoneStr.trim()) {
        return ''
    }

    try {
        // Добавляем + если номер начинается с цифры и содержит только цифры
        const digits = phoneStr.replace(/\D/g, '')
        const phoneWithPlus = digits === phoneStr ? '+' + digits : phoneStr

        // Пробуем распарсить
        const parsed = parsePhoneNumber(phoneWithPlus, defaultCountry)

        if (parsed && isValidPhoneNumber(phoneWithPlus, defaultCountry)) {
            return parsed.formatInternational()
        }

        // Если невалидный номер — пробуем хотя бы частичное форматирование
        if (parsed) {
            return parsed.formatInternational()
        }
    } catch {
        // Ошибка парсинга — вернём как есть
    }

    // Форматирование не удалось — возвращаем исходное значение
    return phoneStr
}
