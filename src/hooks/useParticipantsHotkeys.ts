import { useCallback, useEffect } from 'react'

interface UseParticipantsHotkeysOptions {
    hasCodeField: boolean
    selectedIdsLength: number
    onCreateOpen: () => void
    onSearchByCodeOpen: () => void
    onMassPrint: () => void
    onResetFilters: () => void
}

/**
 * Хук для горячих клавиш на странице участников:
 * - Alt+C: создать участника
 * - Alt+F: поиск по коду (если есть поле code)
 * - Alt+P: массовая печать (если выбраны участники)
 * - Esc: сброс фильтров
 */
export const useParticipantsHotkeys = ({
    hasCodeField,
    selectedIdsLength,
    onCreateOpen,
    onSearchByCodeOpen,
    onMassPrint,
    onResetFilters,
}: UseParticipantsHotkeysOptions) => {
    const handleHotkey = useCallback(
        (e: KeyboardEvent) => {
            try {
                // Игнорируем если ввод в текстовое поле (но не checkbox/radio)
                const active = document.activeElement as HTMLElement | null
                const isTextInput =
                    active &&
                    ((active.tagName.toLowerCase() === 'input' &&
                        !['checkbox', 'radio'].includes((active as HTMLInputElement).type)) ||
                        active.tagName.toLowerCase() === 'textarea' ||
                        active.isContentEditable)

                // Esc - сброс фильтров (работает везде)
                if (e.key === 'Escape') {
                    e.preventDefault()
                    onResetFilters()
                    if (isTextInput && active) {
                        active.blur()
                    }
                    return
                }

                // Остальные хоткеи только вне текстовых инпутов
                if (isTextInput) return

                // Alt+C - создать участника
                if (e.altKey && (e.code === 'KeyC' || (e as any).keyCode === 67)) {
                    e.preventDefault()
                    onCreateOpen()
                    return
                }

                // Alt+F - поиск по коду
                if (e.altKey && (e.code === 'KeyF' || (e as any).keyCode === 70)) {
                    e.preventDefault()
                    if (hasCodeField) {
                        onSearchByCodeOpen()
                    }
                    return
                }

                // Alt+P - массовая печать
                if (e.altKey && (e.code === 'KeyP' || (e as any).keyCode === 80)) {
                    e.preventDefault()
                    if (selectedIdsLength > 0) {
                        onMassPrint()
                    }
                    return
                }
            } catch (err) {
                // ignore
            }
        },
        [hasCodeField, selectedIdsLength, onCreateOpen, onSearchByCodeOpen, onMassPrint, onResetFilters],
    )

    useEffect(() => {
        window.addEventListener('keydown', handleHotkey)
        return () => window.removeEventListener('keydown', handleHotkey)
    }, [handleHotkey])
}

export default useParticipantsHotkeys
