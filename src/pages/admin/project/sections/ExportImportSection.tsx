import { useState, useRef, useCallback } from 'react'
import { Text, Button, Card, Loader } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { saveAs } from 'file-saver'
import {
    fetchExcelTemplate,
    fetchImportExcel,
    fetchClearParticipants,
    fetchClearPrintMarks,
    fetchClearScannerLogs,
    ImportExcelResult,
} from '@/services/api/participants'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import ExportModal from '@/components/organisms/ExportModal'
import ExportScansModal from '@/components/organisms/ExportScansModal'
import ClearConfirmModal from '@/components/organisms/ClearConfirmModal'
import styles from './ExportImportSection.module.css'

const ExportImportSection = () => {
    const { id } = useParams<{ id: string }>()
    const projectIdNum = Number(id)
    const queryClient = useQueryClient()
    const { enqueueSnackbar } = useSnackbar()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Получаем данные проекта
    const { data: project } = useProjectQuery(id!)

    // Состояния загрузки
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [isClearingPrints, setIsClearingPrints] = useState(false)
    const [isClearingScannerLogs, setIsClearingScannerLogs] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Состояния модалок
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isExportScansModalOpen, setIsExportScansModalOpen] = useState(false)
    const [isClearModalOpen, setIsClearModalOpen] = useState(false)
    const [isClearPrintsModalOpen, setIsClearPrintsModalOpen] = useState(false)
    const [isClearScannerLogsModalOpen, setIsClearScannerLogsModalOpen] = useState(false)

    // Скачать шаблон
    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true)
        try {
            const blob = await fetchExcelTemplate(projectIdNum)
            const filename = `template_${project?.title || 'project'}.xlsx`
            saveAs(blob, filename)
            enqueueSnackbar('Шаблон скачан', { variant: 'success' })
        } catch (error) {
            console.error('Download template error:', error)
            enqueueSnackbar('Ошибка скачивания шаблона', { variant: 'error' })
        } finally {
            setIsDownloadingTemplate(false)
        }
    }

    // Обработка загрузки файла
    const handleFileUpload = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            enqueueSnackbar('Поддерживаются только Excel файлы (.xlsx, .xls)', { variant: 'error' })
            return
        }

        setIsUploading(true)
        try {
            const result: ImportExcelResult = await fetchImportExcel(projectIdNum, file)

            if (result.success) {
                enqueueSnackbar(`Импортировано ${result.imported} участников`, {
                    variant: 'success',
                })
                queryClient.invalidateQueries({ queryKey: ['participants', projectIdNum] })
            } else if (result.errors && result.errors.length > 0) {
                // Показываем первые 3 ошибки
                const errorMessages = result.errors
                    .slice(0, 3)
                    .map((e) => `Строка ${e.row}, ${e.field}: ${e.message}`)
                if (result.errors.length > 3) {
                    errorMessages.push(`...и ещё ${result.errors.length - 3} ошибок`)
                }
                enqueueSnackbar(errorMessages.join('\n'), {
                    variant: 'error',
                    style: { whiteSpace: 'pre-line' },
                })
            }
        } catch (error: any) {
            const errorData = error.response?.data
            if (errorData?.errors) {
                const errors = Array.isArray(errorData.errors)
                    ? errorData.errors
                    : [errorData.errors]
                const errorMessages = errors
                    .slice(0, 3)
                    .map((e: any) => (typeof e === 'string' ? e : `Строка ${e.row}: ${e.message}`))
                enqueueSnackbar(errorMessages.join('\n'), {
                    variant: 'error',
                    style: { whiteSpace: 'pre-line' },
                })
            } else {
                enqueueSnackbar('Ошибка импорта', { variant: 'error' })
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // Обработчик выбора файла
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file)
        }
    }

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const file = e.dataTransfer.files?.[0]
            if (file) {
                handleFileUpload(file)
            }
        },
        [projectIdNum],
    )

    // Очистка участников
    const handleClear = async () => {
        setIsClearing(true)
        try {
            const result = await fetchClearParticipants(projectIdNum)
            enqueueSnackbar(result.message, { variant: 'success' })
            queryClient.invalidateQueries({ queryKey: ['participants', projectIdNum] })
            setIsClearModalOpen(false)
        } catch (error) {
            console.error('Clear error:', error)
            enqueueSnackbar('Ошибка очистки', { variant: 'error' })
            throw error
        } finally {
            setIsClearing(false)
        }
    }

    // Очистка отметок печати
    const handleClearPrints = async () => {
        setIsClearingPrints(true)
        try {
            const result = await fetchClearPrintMarks(projectIdNum)
            enqueueSnackbar(result.message, { variant: 'success' })
            queryClient.invalidateQueries({ queryKey: ['participants', projectIdNum] })
            queryClient.invalidateQueries({ queryKey: ['participantLogs', projectIdNum] })
            setIsClearPrintsModalOpen(false)
        } catch (error) {
            console.error('Clear prints error:', error)
            enqueueSnackbar('Ошибка очистки отметок печати', { variant: 'error' })
            throw error
        } finally {
            setIsClearingPrints(false)
        }
    }

    // Очистка логов сканеров
    const handleClearScannerLogs = async () => {
        setIsClearingScannerLogs(true)
        try {
            const result = await fetchClearScannerLogs(projectIdNum)
            enqueueSnackbar(result.message, { variant: 'success' })
            queryClient.invalidateQueries({ queryKey: ['scannerLogs', projectIdNum] })
            setIsClearScannerLogsModalOpen(false)
        } catch (error) {
            console.error('Clear scanner logs error:', error)
            enqueueSnackbar('Ошибка очистки логов сканеров', { variant: 'error' })
            throw error
        } finally {
            setIsClearingScannerLogs(false)
        }
    }

    return (
        <>
            <Card style={{ padding: '24px' }}>
                <Text variant="header-2" style={{ marginBottom: '16px', display: 'block' }}>
                    Экспорт и импорт
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        view="outlined"
                        size="l"
                        onClick={handleDownloadTemplate}
                        loading={isDownloadingTemplate}
                    >
                        Скачать шаблон импорта
                    </Button>

                    {/* Зона загрузки файла */}
                    <div
                        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className={styles.uploadLoader}>
                                <Loader size="s" />
                                <Text variant="body-1">Загрузка...</Text>
                            </div>
                        ) : (
                            <Text variant="body-1" color="secondary">
                                {isDragging
                                    ? 'Отпустите файл для загрузки'
                                    : 'Нажмите или перетащите Excel файл'}
                            </Text>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <Button view="outlined" size="l" onClick={() => setIsExportModalOpen(true)}>
                        Выгрузка участников
                    </Button>

                    <Button view="outlined" size="l" onClick={() => setIsExportScansModalOpen(true)}>
                        Выгрузка сканов
                    </Button>

                    <Button
                        view="outlined-danger"
                        size="l"
                        onClick={() => setIsClearModalOpen(true)}
                    >
                        Очистить список пользователей
                    </Button>

                    <Button
                        view="outlined-danger"
                        size="l"
                        onClick={() => setIsClearPrintsModalOpen(true)}
                    >
                        Очистить отметки печати
                    </Button>

                    <Button
                        view="outlined-danger"
                        size="l"
                        onClick={() => setIsClearScannerLogsModalOpen(true)}
                    >
                        Очистить логи сканеров
                    </Button>
                </div>
            </Card>

            {/* Модалка экспорта */}
            <ExportModal
                open={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                projectId={projectIdNum}
                projectTitle={project?.title || ''}
            />

            {/* Модалка экспорта сканов */}
            <ExportScansModal
                open={isExportScansModalOpen}
                onClose={() => setIsExportScansModalOpen(false)}
                projectId={projectIdNum}
                projectTitle={project?.title || ''}
            />

            {/* Модалка подтверждения очистки */}
            <ClearConfirmModal
                open={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleClear}
                projectTitle={project?.title || ''}
                isLoading={isClearing}
            />

            {/* Модалка подтверждения очистки отметок печати */}
            <ClearConfirmModal
                open={isClearPrintsModalOpen}
                onClose={() => setIsClearPrintsModalOpen(false)}
                onConfirm={handleClearPrints}
                projectTitle={project?.title || ''}
                isLoading={isClearingPrints}
                title="Очистка отметок печати"
                warningMessage="Это действие необратимо! Все отметки печати будут удалены без возможности восстановления. Участники смогут печатать бейджи повторно."
            />

            {/* Модалка подтверждения очистки логов сканеров */}
            <ClearConfirmModal
                open={isClearScannerLogsModalOpen}
                onClose={() => setIsClearScannerLogsModalOpen(false)}
                onConfirm={handleClearScannerLogs}
                projectTitle={project?.title || ''}
                isLoading={isClearingScannerLogs}
                title="Очистка логов сканеров"
                warningMessage="Это действие необратимо! Все логи сканеров будут удалены без возможности восстановления."
            />
        </>
    )
}

export default ExportImportSection
