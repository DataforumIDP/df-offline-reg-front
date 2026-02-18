import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export type FiltersState = Record<string, string | string[] | undefined>

export interface SearchHistoryEntry {
    search: string
    filters: FiltersState
    sortColumn: string
    sortDirection: 'ASC' | 'DESC'
    timestamp: number
}

interface UseParticipantsStateOptions {
    projectId: string
    defaultRecordsPerPage?: number
    storageKeyPrefix?: string
}

const parseFilters = (str: string | null): FiltersState => {
    if (!str) return {}
    try {
        return JSON.parse(str)
    } catch {
        return {}
    }
}

const stringifyFilters = (filters: FiltersState): string => {
    const cleaned = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== '')) {
            acc[key] = value
        }
        return acc
    }, {} as FiltersState)
    
    if (Object.keys(cleaned).length === 0) return ''
    return JSON.stringify(cleaned)
}

/**
 * Хук для управления состоянием страницы участников с синхронизацией URL
 */
export const useParticipantsState = ({
    projectId,
    defaultRecordsPerPage = 100,
    storageKeyPrefix = 'participants',
}: UseParticipantsStateOptions) => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Читаем начальные значения из URL
    const initialSearch = searchParams.get('search') || ''
    const initialFilters = parseFilters(searchParams.get('filters'))
    const initialSortColumn = searchParams.get('sortColumn') || 'id'
    const initialSortDirection = (searchParams.get('sortDirection') as 'ASC' | 'DESC') || 'ASC'
    const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1
    const initialRecordsPerPage = parseInt(searchParams.get('limit') || String(defaultRecordsPerPage), 10) || defaultRecordsPerPage
    const initialModalId = searchParams.get('modalId') ? parseInt(searchParams.get('modalId')!, 10) : null

    // Состояние поиска
    const [search, setSearchState] = useState(initialSearch)

    // Состояние фильтров
    const [filters, setFiltersState] = useState<FiltersState>(initialFilters)

    // Состояние выделения
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Состояние сортировки
    const [sortColumn, setSortColumnState] = useState(initialSortColumn)
    const [sortDirection, setSortDirectionState] = useState<'ASC' | 'DESC'>(initialSortDirection)

    // Состояние пагинации
    const [page, setPageState] = useState(initialPage)
    const [recordsPerPage, setRecordsPerPageState] = useState(initialRecordsPerPage)

    // Состояние модалки редактирования
    const [modalOpen, setModalOpen] = useState(initialModalId !== null)
    const [selectedParticipant, setSelectedParticipant] = useState<number | null>(initialModalId)

    // Состояние модалки создания
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Состояние модалки поиска по коду
    const [searchByCodeModalOpen, setSearchByCodeModalOpen] = useState(false)

    // Состояние массовой печати
    const [isPrinting, setIsPrinting] = useState(false)

    // Ключ для истории поиска
    const historyKey = `${storageKeyPrefix}-search-history-${projectId}`

    // Синхронизация состояния с URL
    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === '' || value === 'null') {
                    newParams.delete(key)
                } else {
                    newParams.set(key, value)
                }
            })
            return newParams
        }, { replace: true })
    }, [setSearchParams])

    // Обработчики с синхронизацией URL
    const setSearch = useCallback((value: string) => {
        setSearchState(value)
        setPageState(1)
        updateUrl({ search: value || null, page: null })
    }, [updateUrl])

    const setFilters = useCallback((newFilters: FiltersState) => {
        setFiltersState(newFilters)
        setPageState(1)
        updateUrl({ filters: stringifyFilters(newFilters) || null, page: null })
    }, [updateUrl])

    const setPage = useCallback((newPage: number) => {
        setPageState(newPage)
        updateUrl({ page: newPage > 1 ? String(newPage) : null })
    }, [updateUrl])

    const setRecordsPerPage = useCallback((n: number) => {
        setRecordsPerPageState(n)
        setPageState(1)
        updateUrl({ limit: n !== defaultRecordsPerPage ? String(n) : null, page: null })
    }, [updateUrl, defaultRecordsPerPage])

    // Обработчики сортировки (объединённый)
    const handleSortChange = useCallback((column: string, direction: 'ASC' | 'DESC') => {
        setSortColumnState(column)
        setSortDirectionState(direction)
        setPageState(1)
        updateUrl({
            sortColumn: column !== 'id' ? column : null,
            sortDirection: direction !== 'ASC' ? direction : null,
            page: null,
        })
    }, [updateUrl])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [setPage])

    const handleRecordsPerPageChange = useCallback((n: number) => {
        setRecordsPerPage(n)
    }, [setRecordsPerPage])

    const handleFiltersChange = useCallback((newFilters: FiltersState) => {
        setFilters(newFilters)
    }, [setFilters])

    // Открытие модалки участника
    const openParticipantModal = useCallback((participantId: number) => {
        setSelectedParticipant(participantId)
        setModalOpen(true)
        updateUrl({ modalId: String(participantId) })
    }, [updateUrl])

    // Закрытие модалки участника
    const closeParticipantModal = useCallback(() => {
        setModalOpen(false)
        setSelectedParticipant(null)
        updateUrl({ modalId: null })
    }, [updateUrl])

    // Сброс всех фильтров и поиска
    const resetFilters = useCallback(() => {
        setSearchState('')
        setFiltersState({})
        setPageState(1)
        updateUrl({ search: null, filters: null, page: null })
    }, [updateUrl])

    // Сохранение в историю поиска
    const saveToSearchHistory = useCallback(() => {
        // Не сохраняем пустые состояния
        if (!search && Object.keys(filters).length === 0) return

        const entry: SearchHistoryEntry = {
            search,
            filters,
            sortColumn,
            sortDirection,
            timestamp: Date.now(),
        }

        try {
            const stored = localStorage.getItem(historyKey)
            const history: SearchHistoryEntry[] = stored ? JSON.parse(stored) : []
            
            // Проверяем, нет ли уже такого же состояния
            const isDuplicate = history.some(
                (h) =>
                    h.search === entry.search &&
                    JSON.stringify(h.filters) === JSON.stringify(entry.filters) &&
                    h.sortColumn === entry.sortColumn &&
                    h.sortDirection === entry.sortDirection
            )

            if (!isDuplicate) {
                const newHistory = [entry, ...history].slice(0, 6)
                localStorage.setItem(historyKey, JSON.stringify(newHistory))
            }
        } catch {
            // Игнорируем ошибки localStorage
        }
    }, [search, filters, sortColumn, sortDirection, historyKey])

    // Загрузка истории поиска
    const getSearchHistory = useCallback((): SearchHistoryEntry[] => {
        try {
            const stored = localStorage.getItem(historyKey)
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    }, [historyKey])

    // Автосохранение в историю при изменении поиска или фильтров (с дебаунсом)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
    useEffect(() => {
        // Очищаем предыдущий таймер
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current)
        }

        // Не сохраняем пустые состояния
        if (!search && Object.keys(filters).length === 0) return

        // Сохраняем с задержкой 1.5 секунды
        saveTimerRef.current = setTimeout(() => {
            saveToSearchHistory()
        }, 1500)

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
            }
        }
    }, [search, filters, saveToSearchHistory])

    // Применение записи из истории
    const applyHistoryEntry = useCallback((entry: SearchHistoryEntry) => {
        setSearchState(entry.search)
        setFiltersState(entry.filters)
        setSortColumnState(entry.sortColumn)
        setSortDirectionState(entry.sortDirection)
        setPageState(1)
        updateUrl({
            search: entry.search || null,
            filters: stringifyFilters(entry.filters) || null,
            sortColumn: entry.sortColumn !== 'id' ? entry.sortColumn : null,
            sortDirection: entry.sortDirection !== 'ASC' ? entry.sortDirection : null,
            page: null,
        })
    }, [updateUrl])

    // Параметры для запроса
    const queryFilters = useMemo(() => {
        return Object.entries(filters).reduce(
            (acc, [key, value]) => {
                if (value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== '')) {
                    acc[key] = value
                }
                return acc
            },
            {} as Record<string, string | string[]>,
        )
    }, [filters])

    return {
        // Состояния
        search,
        filters,
        selectedIds,
        sortColumn,
        sortDirection,
        page,
        recordsPerPage,
        modalOpen,
        selectedParticipant,
        createModalOpen,
        searchByCodeModalOpen,
        isPrinting,
        queryFilters,

        // Сеттеры
        setSearch,
        setFilters,
        setSelectedIds,
        setPage,
        setRecordsPerPage,
        setCreateModalOpen,
        setSearchByCodeModalOpen,
        setIsPrinting,

        // Обработчики
        handleSortChange,
        handlePageChange,
        handleRecordsPerPageChange,
        handleFiltersChange,
        openParticipantModal,
        closeParticipantModal,
        resetFilters,

        // История поиска
        saveToSearchHistory,
        getSearchHistory,
        applyHistoryEntry,
    }
}

export default useParticipantsState
