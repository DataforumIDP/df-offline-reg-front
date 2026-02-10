import { useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { useAppSelector } from '@/store/hooks'
import { useParticipantsQuery } from '@/hooks/queries/useParticipantQueries'
import { previewBadgePdf, PrintTemplate } from '@/services/printService'

export const useTestPrint = (projectId: number | undefined) => {
    const { enqueueSnackbar } = useSnackbar()

    const { canvas, elements } = useAppSelector((state) => state.templateEditor)
    const { widthMm: canvasWidthMm, heightMm: canvasHeightMm } = canvas

    // Запрос участников для пробной печати
    const { data: participantsData } = useParticipantsQuery(Number(projectId), {
        page: 1,
        limit: 50,
    })

    const handleTestPrint = useCallback(async () => {
        const participants = participantsData?.records || []

        if (participants.length === 0) {
            enqueueSnackbar('В проекте нет участников для пробной печати', { variant: 'warning' })
            return
        }

        if (elements.length === 0) {
            enqueueSnackbar('Добавьте хотя бы один элемент в шаблон', { variant: 'warning' })
            return
        }

        // Выбираем случайного участника
        const randomIndex = Math.floor(Math.random() * participants.length)
        const participant = participants[randomIndex]

        // Формируем шаблон и данные
        const template: PrintTemplate = {
            widthMm: canvasWidthMm,
            heightMm: canvasHeightMm,
            elements: elements,
        }

        try {
            await previewBadgePdf(template, participant.data)
        } catch (err) {
            console.error('Preview error:', err)
            enqueueSnackbar(
                `Ошибка при генерации PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
                { variant: 'error' },
            )
        }
    }, [participantsData, elements, canvasWidthMm, canvasHeightMm, enqueueSnackbar])

    return { handleTestPrint }
}
