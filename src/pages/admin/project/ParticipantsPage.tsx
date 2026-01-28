import { Text, Button, Loader } from '@gravity-ui/uikit'
import { Plus, Printer } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { SearchInput } from '@/components/atoms'
import { ParticipantsTable, type FiltersState } from '@/components/organisms/ParticipantsTable'
import { ParticipantModal } from '@/components/organisms/ParticipantModal'
import { CreateParticipantModal } from '@/components/organisms/CreateParticipantModal'
import { useParticipantsQuery } from '@/hooks/queries/useParticipantQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useAppSelector } from '@/store/hooks'
import { generateMultipleBadgesPdf, PrintTemplate, PrintData } from '@/services/printService'
import type { Participant } from '@/services/api/participants'

const ProjectParticipantsPage = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const { enqueueSnackbar } = useSnackbar()
  const templateEditor = useAppSelector((state) => state.templateEditor)
  
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
  const limit = 20
  
  // Состояние модалки редактирования
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)
  
  // Состояние модалки создания
  const [createModalOpen, setCreateModalOpen] = useState(false)
  
  // Состояние массовой печати
  const [isPrinting, setIsPrinting] = useState(false)

  // Запросы данных
  const { data: schemeData, isLoading: schemeLoading } = useSchemeQuery(projectId || '')
  
  const { data: participantsData, isLoading: participantsLoading, isFetching } = useParticipantsQuery(
    projectId ? Number(projectId) : 0,
    {
      page,
      limit,
      search: search || undefined,
      order: sortColumn,
      direction: sortDirection,
      // Преобразуем фильтры: убираем undefined значения
      filters: Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && (Array.isArray(value) ? value.length > 0 : value !== '')) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string | string[]>),
    }
  )

  const isLoading = schemeLoading || participantsLoading
  const isRefetching = isFetching && !participantsLoading // Загрузка при наличии предыдущих данных
  const scheme = schemeData?.fields || []
  const participants = participantsData?.records || []
  const totalRecords = participantsData?.totalRecords || 0
  const totalPages = participantsData?.totalPages || 1
  const recordsPerPage = participantsData?.recordsPerPage || limit

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

  const handleCreateModalClose = useCallback(() => {
    setCreateModalOpen(false)
  }, [])

  // Массовая печать - генерация одного PDF со всеми выбранными бейджами
  const handleMassPrint = useCallback(async () => {
    if (selectedIds.length === 0) return
    
    const { canvas, elements } = templateEditor
    
    if (elements.length === 0) {
      enqueueSnackbar('Добавьте элементы в шаблон печати', { variant: 'warning' })
      return
    }
    
    // Находим выбранных участников
    const selectedParticipants = participants.filter((p: Participant) => selectedIds.includes(String(p.id)))
    
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
      const dataList: PrintData[] = selectedParticipants.map((p: Participant) => p.data as PrintData)
      
      // Генерируем PDF с несколькими страницами
      const blob = await generateMultipleBadgesPdf(template, dataList)
      
      // Открываем PDF в новой вкладке
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      
      enqueueSnackbar(`PDF создан для ${selectedParticipants.length} участников`, { variant: 'success' })
      
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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Text variant="display-1">Участники</Text>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isRefetching && <Loader size="s" />}
          {selectedIds.length > 0 && (
            <Button view="outlined" size="l" onClick={handleMassPrint} loading={isPrinting}>
              <Button.Icon>
                <Printer />
              </Button.Icon>
              Печать ({selectedIds.length})
            </Button>
          )}
          <Button view="action" size="l" onClick={handleCreateModalOpen}>
            <Button.Icon>
              <Plus />
            </Button.Icon>
            Добавить участника
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
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
          recordsPerPage={recordsPerPage}
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
    </div>
  )
}

export default ProjectParticipantsPage
