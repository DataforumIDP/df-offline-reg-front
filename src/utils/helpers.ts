// Утилиты для работы с форматированием и преобразованием данных
import { format, formatDistance, parseISO, isBefore, isAfter, addDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'

// Date-fns обертки
export const formatDate = (date: string | Date, dateFormat = 'dd.MM.yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, dateFormat, { locale: ru })
}

export const formatDateTime = (date: string | Date, dateFormat = 'dd.MM.yyyy HH:mm'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, dateFormat, { locale: ru })
}

export const getRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(d, new Date(), { addSuffix: true, locale: ru })
}

export const addDaysToDate = (date: string | Date, days: number): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return addDays(d, days)
}

export const subtractDaysFromDate = (date: string | Date, days: number): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return subDays(d, days)
}

export const isDateBefore = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return isBefore(d1, d2)
}

export const isDateAfter = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return isAfter(d1, d2)
}
