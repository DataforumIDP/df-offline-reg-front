import { useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
    setCanvasSize,
    setElements,
    setTemplateId,
    setTemplateName,
} from '@/store/slices/templateEditorSlice'
import {
    generateMultipleBadgesPdf,
    printOrSend,
    PrintTemplate,
    PrintData,
} from '@/services/printService'
import { fetchPrintParticipant, type Participant } from '@/services/api/participants'
import { useProjectPrintTemplate } from '@/hooks/queries/useTemplateQueries'
import { useEffect } from 'react'

interface UseMassPrintOptions {
    projectId: string
    participants: Participant[]
    selectedIds: string[]
    setSelectedIds: (ids: string[]) => void
    setIsPrinting: (printing: boolean) => void
}

/**
 * Хук для массовой печати участников
 */
export const useMassPrint = ({
    projectId,
    participants,
    selectedIds,
    setSelectedIds,
    setIsPrinting,
}: UseMassPrintOptions) => {
    const { enqueueSnackbar } = useSnackbar()
    const templateEditor = useAppSelector((state) => state.templateEditor)
    const dispatch = useAppDispatch()

    // Получаем шаблон проекта (если назначен)
    const { data: projectTemplateData } = useProjectPrintTemplate(
        projectId ? Number(projectId) : undefined,
    )

    // Если elements пустой, пробуем загрузить шаблон проекта и инициализировать редактор
    useEffect(() => {
        if (
            templateEditor.elements.length === 0 &&
            projectTemplateData &&
            projectTemplateData.template &&
            projectTemplateData.template.settings &&
            Array.isArray(projectTemplateData.template.settings.elements) &&
            projectTemplateData.template.settings.elements.length > 0
        ) {
            const settings = projectTemplateData.template.settings
            dispatch(setCanvasSize({ widthMm: settings.widthMm, heightMm: settings.heightMm }))
            dispatch(setElements(settings.elements))
            dispatch(setTemplateId(projectTemplateData.template.id))
            dispatch(setTemplateName(projectTemplateData.template.name))
        }
    }, [templateEditor.elements.length, projectTemplateData, dispatch])

    const handleMassPrint = useCallback(async () => {
        if (selectedIds.length === 0) {
            return
        }

        const { canvas, elements } = templateEditor

        if (elements.length === 0) {
            enqueueSnackbar('Добавьте элементы в шаблон печати', { variant: 'warning' })
            return
        }

        // Находим выбранных участников
        const selectedParticipants = participants.filter((p: Participant) =>
            selectedIds.includes(String(p.id)),
        )

        if (selectedParticipants.length === 0) {
            enqueueSnackbar('Не найдены выбранные участники', { variant: 'error' })
            return
        }

        setIsPrinting(true)

        try {
            const template: PrintTemplate = {
                widthMm: canvas.widthMm,
                heightMm: canvas.heightMm,
                elements: elements,
            }

            // Собираем данные всех участников
            const dataList: PrintData[] = selectedParticipants.map(
                (p: Participant) => p.data as PrintData,
            )

            // Генерируем PDF с несколькими страницами
            const blob = await generateMultipleBadgesPdf(template, dataList)

            // Печатаем или открываем в зависимости от настроек
            const result = await printOrSend(blob)

            // Отправляем запросы о печати для каждого участника
            await Promise.all(
                selectedParticipants.map((p: Participant) =>
                    fetchPrintParticipant(Number(projectId), p.id).catch((err) => {
                        console.error(`Failed to log print for participant ${p.id}:`, err)
                    }),
                ),
            )

            enqueueSnackbar(
                result.mode === 'server'
                    ? `Отправлено на печать (${selectedParticipants.length} бейджей)`
                    : `PDF создан для ${selectedParticipants.length} участников`,
                { variant: 'success' },
            )

            // Сбрасываем выделение
            setSelectedIds([])
        } catch (err) {
            console.error('Mass print error:', err)
            enqueueSnackbar('Ошибка при генерации PDF', { variant: 'error' })
        } finally {
            setIsPrinting(false)
        }
    }, [selectedIds, participants, templateEditor, enqueueSnackbar, projectId, setSelectedIds, setIsPrinting])

    return { handleMassPrint }
}

export default useMassPrint
