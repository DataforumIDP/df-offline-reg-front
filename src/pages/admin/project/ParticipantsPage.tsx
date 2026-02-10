import { Text, Button, Loader, Tooltip, Hotkey } from '@gravity-ui/uikit'
import { Plus, Printer, Magnifier } from '@gravity-ui/icons'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { PageWrapper, PageHeader, PageHeaderActions, SearchInput } from '@/components/atoms'
import { ParticipantsTable, type FiltersState } from '@/components/organisms/ParticipantsTable'
import { ParticipantModal } from '@/components/organisms/ParticipantModal'
import { CreateParticipantModal } from '@/components/organisms/CreateParticipantModal'
import SearchByCodeModal from '@/components/organisms/SearchByCodeModal'
import { useParticipantsQuery } from '@/hooks/queries/useParticipantQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
    generateMultipleBadgesPdf,
    printOrSend,
    PrintTemplate,
    PrintData,
} from '@/services/printService'
import {
    setCanvasSize,
    setElements,
    setTemplateId,
    setTemplateName,
} from '@/store/slices/templateEditorSlice'
import { useProjectPrintTemplate } from '@/hooks/queries/useTemplateQueries'
import { fetchPrintParticipant, type Participant } from '@/services/api/participants'

const ProjectParticipantsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
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

    // Состояние поиска
    const [search, setSearch] = useState('')

    // Состояние фильтров
    const [filters, setFilters] = useState<FiltersState>({})

    // Состояние выделения
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Состояние сортировки
    const [sortColumn, setSortColumn] = useState('id')
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC')

    // Состояние пагинации
    const [page, setPage] = useState(1)
    const [recordsPerPage, setRecordsPerPage] = useState(20)

    // Состояние модалки редактирования
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)

    // Состояние модалки создания
    const [createModalOpen, setCreateModalOpen] = useState(false)

    // Состояние модалки поиска по коду
    const [searchByCodeModalOpen, setSearchByCodeModalOpen] = useState(false)

    // Состояние массовой печати
    const [isPrinting, setIsPrinting] = useState(false)

    // Запросы данных
    const { data: schemeData, isLoading: schemeLoading } = useSchemeQuery(projectId || '')

    const {
        data: participantsData,
        isLoading: participantsLoading,
        isFetching,
    } = useParticipantsQuery(projectId ? Number(projectId) : 0, {
        page,
        limit: recordsPerPage,
        search: search || undefined,
        order: sortColumn,
        direction: sortDirection,
        // Преобразуем фильтры: убираем undefined значения
        filters: Object.entries(filters).reduce(
            (acc, [key, value]) => {
                if (
                    value !== undefined &&
                    (Array.isArray(value) ? value.length > 0 : value !== '')
                ) {
                    acc[key] = value
                }
                return acc
            },
            {} as Record<string, string | string[]>,
        ),
    })

    const isLoading = schemeLoading || participantsLoading
    const isRefetching = isFetching && !participantsLoading // Загрузка при наличии предыдущих данных
    const scheme = schemeData?.fields || []
    const participants = participantsData?.records || []
    const totalRecords = participantsData?.totalRecords || 0
    const totalPages = participantsData?.totalPages || 1
    const recordsPerPageResp = participantsData?.recordsPerPage || recordsPerPage

    // Проверяем наличие полей типа code в схеме
    const hasCodeField = useMemo(() => {
        return scheme.some((field: any) => field.config?.type === 'code')
    }, [scheme])

    // Обработчики
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value)
        setPage(1) // Сброс страницы при поиске
    }, [])

    const handleFiltersChange = useCallback((newFilters: FiltersState) => {
        setFilters(newFilters)
        setPage(1) // Сброс страницы при изменении фильтров
    }, [])

    const handleSortChange = useCallback((column: string, direction: 'ASC' | 'DESC') => {
        setSortColumn(column)
        setSortDirection(direction)
        setPage(1) // Сброс страницы при смене сортировки
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
    }, [])

    const handleRecordsPerPageChange = useCallback((n: number) => {
        setRecordsPerPage(n)
        setPage(1)
    }, [])

    const handleRowClick = useCallback((participant: Participant) => {
        setSelectedParticipant(participant.id)
        setModalOpen(true)
    }, [])

    const handleModalClose = useCallback(() => {
        setModalOpen(false)
        setSelectedParticipant(null)
    }, [])

    const handleCreateModalOpen = useCallback(() => {
        setCreateModalOpen(true)
    }, [])

    const handleSearchByCodeModalOpen = useCallback(() => {
        setSearchByCodeModalOpen(true)
    }, [])

    const handleSearchByCodeModalClose = useCallback(() => {
        setSearchByCodeModalOpen(false)
    }, [])

    const handleParticipantFoundByCode = useCallback((participantId: number) => {
        setSelectedParticipant(participantId)
        setModalOpen(true)
    }, [])

    // Горячая клавиша Alt+C для открытия модалки создания участника
    const handleHotkey = useCallback((e: KeyboardEvent) => {
        try {
            // игнорируем если ввод в поле (input/textarea/contentEditable)
            const active = document.activeElement as HTMLElement | null
            if (active) {
                const tag = active.tagName.toLowerCase()
                const isEditable = active.isContentEditable
                if (tag === 'input' || tag === 'textarea' || isEditable) {
                    return
                }
            }

            // Используем физическую клавишу: e.code (KeyC) — устойчиво для любых раскладок.
            // В качестве запасного варианта проверяем numeric keyCode (67).
            if (e.altKey && (e.code === 'KeyC' || (e as any).keyCode === 67)) {
                e.preventDefault()
                setCreateModalOpen(true)
            }
        } catch (err) {
            // ignore
        }
    }, [])

    // Регистрируем слушатель горячей клавиши
    useEffect(() => {
        window.addEventListener('keydown', handleHotkey)
        return () => window.removeEventListener('keydown', handleHotkey)
    }, [handleHotkey])

    const handleCreateModalClose = useCallback(() => {
        setCreateModalOpen(false)
    }, [])

    // Массовая печать - генерация одного PDF со всеми выбранными бейджами
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
    }, [selectedIds, participants, templateEditor, enqueueSnackbar])

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Участники</Text>
                <PageHeaderActions>
                    {isRefetching && <Loader size="s" />}
                    {selectedIds.length > 0 && (
                        <Button
                            view="outlined"
                            size="l"
                            onClick={handleMassPrint}
                            loading={isPrinting}
                        >
                            <Button.Icon>
                                <Printer />
                            </Button.Icon>
                            Печать ({selectedIds.length})
                        </Button>
                    )}
                    {hasCodeField && (
                        <Button view="outlined" size="l" onClick={handleSearchByCodeModalOpen}>
                            <Button.Icon>
                                <Magnifier />
                            </Button.Icon>
                            Поиск по коду
                        </Button>
                    )}
                    <Tooltip content={<Hotkey view="dark" value="alt+c" />} placement="top">
                        <Button view="action" size="l" onClick={handleCreateModalOpen}>
                            <Button.Icon>
                                <Plus />
                            </Button.Icon>
                            Добавить участника
                        </Button>
                    </Tooltip>
                </PageHeaderActions>
            </PageHeader>

            <div style={{ marginBottom: 24 }}>
                <SearchInput
                    value={search}
                    onUpdate={handleSearchChange}
                    placeholder="Поиск участников..."
                    fullWidth
                    debounceMs={400}
                />
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Loader size="l" />
                </div>
            ) : (
                <ParticipantsTable
                    participants={participants}
                    scheme={scheme}
                    projectId={projectId || ''}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onRowClick={handleRowClick}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalRecords={totalRecords}
                    recordsPerPage={recordsPerPageResp}
                    onRecordsPerPageChange={handleRecordsPerPageChange}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />
            )}

            <ParticipantModal
                open={modalOpen}
                onClose={handleModalClose}
                participantId={selectedParticipant}
                projectId={projectId || ''}
                scheme={scheme}
            />

            <CreateParticipantModal
                open={createModalOpen}
                onClose={handleCreateModalClose}
                projectId={projectId || ''}
                scheme={scheme}
            />

            <SearchByCodeModal
                open={searchByCodeModalOpen}
                onClose={handleSearchByCodeModalClose}
                projectId={projectId || ''}
                onParticipantFound={handleParticipantFoundByCode}
            />
        </PageWrapper>
    )
}

export default ProjectParticipantsPage
