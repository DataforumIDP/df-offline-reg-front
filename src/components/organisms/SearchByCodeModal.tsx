import { Dialog, TextInput } from '@gravity-ui/uikit'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { fetchParticipantByCode } from '@/services/api/participants'

// Карта замены кириллических символов на латинские (раскладка ЙЦУКЕН -> QWERTY)
// Для USB сканеров, которые отправляют коды в неправильной раскладке
const CYRILLIC_TO_LATIN: Record<string, string> = {
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u',
    'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's',
    'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l',
    'ж': ';', 'э': "'", 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b',
    'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.',
}

/**
 * Конвертирует кириллические символы в латинские (для сканеров с неправильной раскладкой)
 */
function convertCyrillicToLatin(input: string): string {
    return input
        .split('')
        .map(char => {
            const lower = char.toLowerCase()
            const replacement = CYRILLIC_TO_LATIN[lower]
            if (replacement !== undefined) {
                // Сохраняем регистр
                return char === lower ? replacement : replacement.toUpperCase()
            }
            return char
        })
        .join('')
}

interface SearchByCodeModalProps {
    open: boolean
    onClose: () => void
    projectId: string
    onParticipantFound: (participantId: number) => void
}

const SearchByCodeModal = ({
    open,
    onClose,
    projectId,
    onParticipantFound,
}: SearchByCodeModalProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Фокус на поле при открытии модалки
    useEffect(() => {
        if (!open) return
        // Небольшая задержка для корректной работы с анимацией модалки
        const timer = setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [open])

    const handleClose = useCallback(() => {
        setCode('')
        onClose()
    }, [onClose])

    const handleSearch = useCallback(async () => {
        if (!code.trim()) {
            enqueueSnackbar('Введите код для поиска', { variant: 'warning' })
            return
        }

        // Конвертируем кириллицу в латиницу (для сканеров с неправильной раскладкой)
        const normalizedCode = convertCyrillicToLatin(code.trim())

        setIsSearching(true)
        try {
            const participant = await fetchParticipantByCode(Number(projectId), normalizedCode)
            handleClose()
            onParticipantFound(participant.id)
        } catch (error: any) {
            if (error?.response?.status === 404) {
                enqueueSnackbar('Участник с указанным кодом не найден', { variant: 'error' })
            } else {
                enqueueSnackbar('Ошибка при поиске участника', { variant: 'error' })
            }
        } finally {
            setIsSearching(false)
        }
    }, [code, projectId, handleClose, onParticipantFound, enqueueSnackbar])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleSearch()
            }
        },
        [handleSearch],
    )

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="search-by-code-modal-title">
            <Dialog.Header caption="Поиск по коду" id="search-by-code-modal-title" />
            <Dialog.Body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        minWidth: '300px',
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Введите код участника
                        </label>
                        <TextInput
                            value={code}
                            onUpdate={setCode}
                            onKeyDown={handleKeyDown}
                            placeholder="Код..."
                            size="l"
                            controlRef={inputRef}
                        />
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={handleClose}
                onClickButtonApply={handleSearch}
                textButtonCancel="Отмена"
                textButtonApply="Найти"
                propsButtonApply={{ loading: isSearching }}
            />
        </Dialog>
    )
}

export default SearchByCodeModal
