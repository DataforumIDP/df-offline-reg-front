import { useEffect, useRef, useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { useAppSelector } from '@/store/hooks'
import {
    generateMultipleBadgesPdf,
    printOrSend,
    type PrintTemplate,
    type PrintData,
} from '@/services/printService'
import {
    fetchParticipantByCode,
    fetchUpdateParticipant,
    fetchPrintParticipant,
    type Participant,
} from '@/services/api/participants'
import { type ScanActionRule } from '@/services/api/projects'

// Карта замены кириллических символов на латинские (раскладка ЙЦУКЕН -> QWERTY)
const CYRILLIC_TO_LATIN: Record<string, string> = {
    й: 'q', ц: 'w', у: 'e', к: 'r', е: 't', н: 'y', г: 'u',
    ш: 'i', щ: 'o', з: 'p', х: '[', ъ: ']', ф: 'a', ы: 's',
    в: 'd', а: 'f', п: 'g', р: 'h', о: 'j', л: 'k', д: 'l',
    ж: ';', э: "'", я: 'z', ч: 'x', с: 'c', м: 'v', и: 'b',
    т: 'n', ь: 'm', б: ',', ю: '.',
}

function convertCyrillicToLatin(input: string): string {
    return input
        .split('')
        .map((char) => {
            const lower = char.toLowerCase()
            const replacement = CYRILLIC_TO_LATIN[lower]
            if (replacement !== undefined) {
                return char === lower ? replacement : replacement.toUpperCase()
            }
            return char
        })
        .join('')
}

const SCANNER_TIMEOUT_MS = 500

export interface UseQrScannerOptions {
    projectId: string
    scanActionRules: ScanActionRule[] | null | undefined
    printCopies?: number
    // Открыть модалку участника по ID
    openParticipantModal: (id: number) => void
    // false — хук не регистрирует слушатель (например, нет поля code)
    enabled?: boolean
}

/**
 * Хук для фонового сбора символов от USB/Bluetooth QR-сканера.
 *
 * Алгоритм:
 * 1. Слушаем keydown на document.
 * 2. Если активный элемент — текстовый инпут/textarea/contenteditable → игнорируем.
 * 3. Если между нажатиями прошло > SCANNER_TIMEOUT_MS — сбрасываем буфер (новый ввод).
 * 4. Enter завершает ввод немедленно.
 * 5. Проверяет совпадение префиксов из scanActionRules — выполняет соответствующее действие.
 *    Префикс "_" работает как fallback для считанных кодов длиной от 8 символов.
 * 6. Если ни один префикс не совпал — сбрасывает тихо.
 *
 * Требует, чтобы на странице уже работал useMassPrint (он инициализирует templateEditor в Redux).
 */
export const useQrScanner = ({
    projectId,
    scanActionRules,
    printCopies = 1,
    openParticipantModal,
    enabled = true,
}: UseQrScannerOptions) => {
    const { enqueueSnackbar } = useSnackbar()
    const templateEditor = useAppSelector((state) => state.templateEditor)

    const bufferRef = useRef<string>('')
    const lastKeyTimeRef = useRef<number>(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Выполнение действия ──────────────────────────────────────────────────

    const executeScanAction = useCallback(
        async (rawCode: string) => {
            const code = convertCyrillicToLatin(rawCode.trim())

            // Нет правил — ничего не делаем
            if (!scanActionRules || scanActionRules.length === 0) {
                return
            }

            // Сначала ищем точное префиксное правило; "_" используется как fallback без префикса.
            const rule =
                scanActionRules.find(
                    (candidate) =>
                        candidate.prefix.trim() !== '_' &&
                        candidate.prefix.length > 0 &&
                        code.startsWith(candidate.prefix),
                ) ??
                (code.length >= 8
                    ? scanActionRules.find((candidate) => candidate.prefix.trim() === '_')
                    : undefined)
            if (!rule || rule.type === 'none') {
                return
            }

            const bareCode =
                rule.prefix.trim() === '_' ? code : code.slice(rule.prefix.length)

            let participant: Participant
            try {
                participant = await fetchParticipantByCode(Number(projectId), bareCode)
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    enqueueSnackbar('Участник с указанным кодом не найден', { variant: 'error' })
                } else {
                    enqueueSnackbar('Ошибка при поиске участника', { variant: 'error' })
                }
                return
            }

            if (rule.type === 'view') {
                openParticipantModal(participant.id)
                return
            }

            if (rule.type === 'print') {
                // Сначала открываем карточку для сверки
                openParticipantModal(participant.id)

                const { canvas, elements } = templateEditor
                if (elements.length === 0) {
                    enqueueSnackbar('Шаблон печати не настроен', { variant: 'warning' })
                    return
                }

                try {
                    const template: PrintTemplate = {
                        widthMm: canvas.widthMm,
                        heightMm: canvas.heightMm,
                        elements,
                    }
                    const blob = await generateMultipleBadgesPdf(template, [
                        participant.data as PrintData,
                    ])
                    await printOrSend(blob, printCopies)
                    await fetchPrintParticipant(Number(projectId), participant.id).catch(() => {})
                    enqueueSnackbar('Бейдж отправлен на печать', { variant: 'success' })
                } catch (error) {
                    enqueueSnackbar(
                        error instanceof Error ? error.message : 'Ошибка при печати',
                        { variant: 'error' },
                    )
                }

                return
            }

            if (rule.type === 'change' && rule.fieldKey) {
                const updatedData = {
                    ...participant.data,
                    [rule.fieldKey]: rule.value,
                }

                try {
                    await fetchUpdateParticipant(Number(projectId), participant.id, updatedData)
                    enqueueSnackbar('Данные участника обновлены', { variant: 'success' })
                } catch {
                    enqueueSnackbar('Ошибка при обновлении участника', { variant: 'error' })
                }
            }
        },
        [projectId, scanActionRules, printCopies, openParticipantModal, templateEditor, enqueueSnackbar],
    )

    // ── Слушатель клавиатуры ─────────────────────────────────────────────────

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // Не перехватываем когда фокус в текстовом поле
            const active = document.activeElement as HTMLElement | null
            const isTextInput =
                active &&
                ((active.tagName.toLowerCase() === 'input' &&
                    !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(
                        (active as HTMLInputElement).type,
                    )) ||
                    active.tagName.toLowerCase() === 'textarea' ||
                    active.isContentEditable)

            if (isTextInput) return

            // Пропускаем сочетания с модификаторами (кроме Shift — он нужен для заглавных)
            if (e.ctrlKey || e.altKey || e.metaKey) return

            const isPrintable = e.key.length === 1
            const isEnter = e.key === 'Enter'

            if (!isPrintable && !isEnter) return

            const now = Date.now()

            // Если пауза слишком большая — это новый ввод, сбрасываем буфер
            if (now - lastKeyTimeRef.current > SCANNER_TIMEOUT_MS) {
                bufferRef.current = ''
            }
            lastKeyTimeRef.current = now

            if (isEnter) {
                const captured = bufferRef.current
                bufferRef.current = ''
                if (timerRef.current) {
                    clearTimeout(timerRef.current)
                    timerRef.current = null
                }
                if (captured.length > 0) {
                    void executeScanAction(captured)
                }
                return
            }

            bufferRef.current += e.key

            // Таймер сработает если Enter не придёт (нестандартный сканер без Enter)
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                const captured = bufferRef.current
                bufferRef.current = ''
                timerRef.current = null
                if (captured.length > 0) {
                    void executeScanAction(captured)
                }
            }, SCANNER_TIMEOUT_MS)
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [enabled, executeScanAction])
}
