import { useState } from 'react'
import { Dayjs } from 'dayjs'
import { fetchExportScans, ExportScansParams } from '@/services/api/participants'
import { saveAs } from 'file-saver'
import { getActiveServerUrl } from '@/services/serverStorage'
import type { ExcelRow } from './useExcelUpload'

interface UseExportScansParams {
    projectId: number
    projectTitle: string
    selectedKeys: string[]
    selectedZones: string[]
    dateStart: Dayjs | null
    dateEnd: Dayjs | null
    filters: Record<string, string[]>
    addPrints: boolean
    inclusive: boolean
}

export const useExportScans = (onClose: () => void) => {
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleManualExport = async (params: UseExportScansParams) => {
        if (params.selectedKeys.length === 0) {
            setError('Выберите хотя бы одно поле для экспорта')
            return
        }

        setIsExporting(true)
        setError(null)

        try {
            const exportParams: ExportScansParams = {
                keys: params.selectedKeys,
                addPrints: params.addPrints,
                inclusive: params.inclusive,
            }

            // Зоны (если выбраны конкретные)
            if (params.selectedZones.length > 0) {
                exportParams.zones = params.selectedZones.map(Number)
            }

            // Временной диапазон
            if (params.dateStart || params.dateEnd) {
                exportParams.timeRange = [
                    params.dateStart ? params.dateStart.toISOString() : new Date(0).toISOString(),
                    params.dateEnd ? params.dateEnd.toISOString() : new Date().toISOString(),
                ]
            }

            // Фильтры
            if (Object.keys(params.filters).length > 0) {
                exportParams.filter = Object.entries(params.filters).map(([key, value]) => ({
                    [key]: value,
                }))
            }

            const blob = await fetchExportScans(params.projectId, exportParams)
            const filename = `scans_${params.projectTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
            saveAs(blob, filename)
            onClose()
        } catch (err: any) {
            console.error('Export error:', err)
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Ошибка экспорта'
            setError(message)
        } finally {
            setIsExporting(false)
        }
    }

    const handleExcelExport = async (
        projectId: number,
        projectTitle: string,
        excelRows: ExcelRow[],
        selectedKeys: string[],
        addPrints: boolean,
        inclusive: boolean,
        allRowsValid: boolean
    ) => {
        if (!allRowsValid) {
            setError('Исправьте ошибки в таблице перед экспортом')
            return
        }

        setIsExporting(true)
        setError(null)

        try {
            const token = localStorage.getItem('accessToken')
            const response = await fetch(
                `${getActiveServerUrl()}/projects/${projectId}/scanners/logs/mass`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items: excelRows.map((r) => ({
                            date: r.date,
                            time: r.time,
                            zone: r.zone,
                            title: r.title,
                        })),
                        keys: selectedKeys.length > 0 ? selectedKeys : undefined,
                        addPrints,
                        inclusive,
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || 'Ошибка экспорта')
            }

            const blob = await response.blob()
            const filename = `mass_scans_${projectTitle}_${new Date().toISOString().split('T')[0]}.xlsx`
            saveAs(blob, filename)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Ошибка экспорта')
        } finally {
            setIsExporting(false)
        }
    }

    return {
        isExporting,
        error,
        setError,
        handleManualExport,
        handleExcelExport,
    }
}
