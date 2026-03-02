import { useState } from 'react'
import * as XLSX from 'xlsx'

export interface ExcelRow {
    date: string
    time: string
    zone: string
    title: string
    isValid: boolean
    error?: string
}

// Функция для конвертации Excel serial number в дату
const parseExcelDate = (value: any): string => {
    if (typeof value === 'number') {
        // Excel serial date number
        const date = XLSX.SSF.parse_date_code(value)
        if (date) {
            const day = String(date.d).padStart(2, '0')
            const month = String(date.m).padStart(2, '0')
            const year = date.y
            return `${day}.${month}.${year}`
        }
    }
    return String(value)
}

// Функция для конвертации Excel serial number в время
const parseExcelTime = (value: any): string => {
    if (typeof value === 'number') {
        // Если это дробное число (время хранится как доля дня)
        if (value < 1) {
            const totalMinutes = Math.round(value * 24 * 60)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        }
        // Если это полная дата со временем
        const date = XLSX.SSF.parse_date_code(value)
        if (date) {
            const hours = String(date.H || 0).padStart(2, '0')
            const minutes = String(date.M || 0).padStart(2, '0')
            return `${hours}:${minutes}`
        }
    }
    return String(value)
}

export const useExcelUpload = () => {
    const [excelRows, setExcelRows] = useState<ExcelRow[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleExcelUpload = (file: File | null) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary', cellDates: false })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: true })

                const rows: ExcelRow[] = jsonData.map((row) => {
                    const dateRaw = row['Дата'] || row['Date'] || ''
                    const timeRaw = row['Время'] || row['Time'] || ''
                    const zone = row['Зал'] || row['Zone'] || ''
                    const title = row['Название'] || row['Title'] || ''

                    const date = parseExcelDate(dateRaw)
                    const time = parseExcelTime(timeRaw)

                    let error = ''
                    let isValid = true

                    if (!date || !time || !zone || !title) {
                        error = 'Не все поля заполнены'
                        isValid = false
                    } else if (title.length > 31) {
                        error = 'Название листа должно быть не длиннее 31 символа'
                        isValid = false
                    }

                    return {
                        date: String(date),
                        time: String(time),
                        zone: String(zone),
                        title: String(title),
                        isValid,
                        error,
                    }
                })

                setExcelRows(rows)
                setShowPreview(true)
                setError(null)
            } catch (err) {
                setError('Ошибка чтения файла Excel')
                console.error(err)
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleTitleChange = (index: number, newTitle: string) => {
        setExcelRows((prev) => {
            const updated = [...prev]
            const row = { ...updated[index] }
            row.title = newTitle

            let error = ''
            let isValid = true

            if (!row.date || !row.time || !row.zone || !row.title) {
                error = 'Не все поля заполнены'
                isValid = false
            } else if (row.title.length > 31) {
                error = 'Название листа должно быть не длиннее 31 символа'
                isValid = false
            }

            row.error = error
            row.isValid = isValid
            updated[index] = row
            return updated
        })
    }

    const reset = () => {
        setExcelRows([])
        setShowPreview(false)
        setError(null)
    }

    const allRowsValid = excelRows.length > 0 && excelRows.every((r) => r.isValid)

    return {
        excelRows,
        showPreview,
        error,
        setError,
        allRowsValid,
        handleExcelUpload,
        handleTitleChange,
        setShowPreview,
        reset,
    }
}
