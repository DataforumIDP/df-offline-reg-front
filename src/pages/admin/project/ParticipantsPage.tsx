import { Text, Button, Loader, Tooltip, Hotkey, Dialog, Alert } from '@gravity-ui/uikit'
import { Plus, Printer, Magnifier, TrashBin } from '@gravity-ui/icons'
import { useMemo, useCallback, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useQueryClient } from '@tanstack/react-query'
import { PageWrapper, PageHeader, PageHeaderActions, SearchInput } from '@/components/atoms'
import { ParticipantsTable } from '@/components/organisms/ParticipantsTable'
import { ParticipantModal } from '@/components/organisms/ParticipantModal'
import { CreateParticipantModal } from '@/components/organisms/CreateParticipantModal'
import SearchByCodeModal from '@/components/organisms/SearchByCodeModal'
import { useParticipantsQuery } from '@/hooks/queries/useParticipantQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { useParticipantsState, useParticipantsHotkeys, useMassPrint } from '@/hooks'
import { useQrScanner } from '@/hooks/useQrScanner'
import { fetchDeleteParticipants, type Participant } from '@/services/api/participants'
import { getProjectPrintCopies } from '@/utils/projectPrintSettings'

const ProjectParticipantsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()
    const queryClient = useQueryClient()
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    // Хук управления состоянием с синхронизацией URL
    const state = useParticipantsState({
        projectId: projectId || '',
    })

    // Запросы данных
    const { data: schemeData, isLoading: schemeLoading } = useSchemeQuery(projectId || '')
    const { data: projectData } = useProjectQuery(projectId ? Number(projectId) : 0)

    const {
        data: participantsData,
        isLoading: participantsLoading,
        isFetching,
    } = useParticipantsQuery(projectId ? Number(projectId) : 0, {
        page: state.page,
        limit: state.recordsPerPage,
        search: state.search || undefined,
        order: state.sortColumn,
        direction: state.sortDirection,
        filters: state.queryFilters,
    })

    const isLoading = schemeLoading || participantsLoading
    const isRefetching = isFetching && !participantsLoading
    const scheme = schemeData?.fields || []
    const participants = participantsData?.records || []
    const totalRecords = participantsData?.totalRecords || 0
    const totalPages = participantsData?.totalPages || 1
    const recordsPerPageResp = participantsData?.recordsPerPage || state.recordsPerPage
    const printCopies = getProjectPrintCopies(projectData)

    // Проверяем наличие полей типа code в схеме
    const hasCodeField = useMemo(() => {
        return scheme.some((field: any) => field.config?.type === 'code')
    }, [scheme])

    // Хук массовой печати
    const { handleMassPrint } = useMassPrint({
        projectId: projectId || '',
        participants,
        selectedIds: state.selectedIds,
        printCopies,
        setSelectedIds: state.setSelectedIds,
        setIsPrinting: state.setIsPrinting,
    })

    // Хук QR-сканера
    useQrScanner({
        projectId: projectId || '',
        scanActionRules: projectData?.scanActionRules,
        printCopies,
        openParticipantModal: state.openParticipantModal,
        enabled: hasCodeField,
    })

    // Хук горячих клавиш
    useParticipantsHotkeys({
        hasCodeField,
        selectedIdsLength: state.selectedIds.length,
        onCreateOpen: () => state.setCreateModalOpen(true),
        onSearchByCodeOpen: () => state.setSearchByCodeModalOpen(true),
        onMassPrint: handleMassPrint,
        onResetFilters: state.resetFilters,
    })

    // Обработчик клика по строке
    const handleRowClick = useCallback(
        (participant: Participant) => {
            state.openParticipantModal(participant.id)
        },
        [state],
    )

    const handleBulkDelete = async () => {
        const participantIds = state.selectedIds.map(Number)
        if (
            participantIds.length === 0 ||
            participantIds.some(
                (participantId) => !Number.isInteger(participantId) || participantId <= 0,
            )
        ) {
            enqueueSnackbar('Не удалось определить выбранных участников', { variant: 'error' })
            return
        }

        setIsBulkDeleting(true)
        try {
            const result = await fetchDeleteParticipants(Number(projectId), participantIds)
            enqueueSnackbar(result.message, { variant: 'success' })
            state.setSelectedIds([])
            setIsBulkDeleteModalOpen(false)
            await queryClient.invalidateQueries({ queryKey: ['participants', Number(projectId)] })
            await queryClient.invalidateQueries({ queryKey: ['participant-logs-stats', Number(projectId)] })
        } catch (error) {
            console.error('Bulk participant delete failed:', error)
            const responseData = axios.isAxiosError(error)
                ? (error.response?.data as
                      | { message?: unknown; errors?: unknown }
                      | undefined)
                : undefined
            const responseErrors =
                responseData?.errors && typeof responseData.errors === 'object'
                    ? Object.values(responseData.errors as Record<string, unknown>).flatMap(
                          (value) => {
                              if (typeof value === 'string') {
                                  return [value]
                              }
                              if (value && typeof value === 'object') {
                                  return Object.values(value as Record<string, unknown>).filter(
                                      (nested): nested is string => typeof nested === 'string',
                                  )
                              }
                              return []
                          },
                      )
                    : []
            const message =
                (typeof responseData?.message === 'string' && responseData.message) ||
                responseErrors.join('\n') ||
                (error instanceof Error
                    ? error.message
                    : 'Не удалось удалить выбранных участников')
            enqueueSnackbar(
                message,
                { variant: 'error' },
            )
        } finally {
            setIsBulkDeleting(false)
        }
    }

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Участники</Text>
                <PageHeaderActions>
                    {isRefetching && <Loader size="s" />}
                    {state.selectedIds.length > 0 && (
                        <Tooltip content={<Hotkey view="dark" value="alt+p" />} placement="top">
                            <Button
                                view="outlined"
                                size="l"
                                onClick={handleMassPrint}
                                loading={state.isPrinting}
                            >
                                <Button.Icon>
                                    <Printer />
                                </Button.Icon>
                                Печать ({state.selectedIds.length})
                            </Button>
                        </Tooltip>
                    )}
                    {state.selectedIds.length > 0 && (
                        <Button
                            view="outlined-danger"
                            size="l"
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            disabled={state.isPrinting}
                        >
                            <Button.Icon>
                                <TrashBin />
                            </Button.Icon>
                            Удалить ({state.selectedIds.length})
                        </Button>
                    )}
                    {hasCodeField && (
                        <Tooltip content={<Hotkey view="dark" value="alt+f" />} placement="top">
                            <Button
                                view="outlined"
                                size="l"
                                onClick={() => state.setSearchByCodeModalOpen(true)}
                            >
                                <Button.Icon>
                                    <Magnifier />
                                </Button.Icon>
                                Поиск по коду
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip content={<Hotkey view="dark" value="alt+c" />} placement="top">
                        <Button
                            view="action"
                            size="l"
                            onClick={() => state.setCreateModalOpen(true)}
                        >
                            <Button.Icon>
                                <Plus />
                            </Button.Icon>
                            Добавить участника
                        </Button>
                    </Tooltip>
                </PageHeaderActions>
            </PageHeader>

            <div style={{ flexShrink: 0 }}>
                <SearchInput
                    value={state.search}
                    onUpdate={state.setSearch}
                    placeholder="Поиск участников..."
                    fullWidth
                    debounceMs={400}
                    getSearchHistory={state.getSearchHistory}
                    onApplyHistory={state.applyHistoryEntry}
                    showClear
                />
            </div>

            {isLoading ? (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    <Loader size="l" />
                </div>
            ) : (
                <ParticipantsTable
                    participants={participants}
                    scheme={scheme}
                    projectId={projectId || ''}
                    selectedIds={state.selectedIds}
                    onSelectionChange={state.setSelectedIds}
                    onRowClick={handleRowClick}
                    sortColumn={state.sortColumn}
                    sortDirection={state.sortDirection}
                    onSortChange={state.handleSortChange}
                    page={state.page}
                    totalPages={totalPages}
                    onPageChange={state.handlePageChange}
                    totalRecords={totalRecords}
                    recordsPerPage={recordsPerPageResp}
                    onRecordsPerPageChange={state.handleRecordsPerPageChange}
                    filters={state.filters}
                    onFiltersChange={state.handleFiltersChange}
                    colorRow={projectData?.colorRow}
                />
            )}

            <ParticipantModal
                open={state.modalOpen}
                onClose={state.closeParticipantModal}
                participantId={state.selectedParticipant}
                projectId={projectId || ''}
                scheme={scheme}
            />

            <CreateParticipantModal
                open={state.createModalOpen}
                onClose={() => state.setCreateModalOpen(false)}
                projectId={projectId || ''}
                scheme={scheme}
                printCopies={printCopies}
            />

            <SearchByCodeModal
                open={state.searchByCodeModalOpen}
                onClose={() => state.setSearchByCodeModalOpen(false)}
                projectId={projectId || ''}
                onParticipantFound={state.openParticipantModal}
            />

            <Dialog
                open={isBulkDeleteModalOpen}
                onClose={() => {
                    if (!isBulkDeleting) {
                        setIsBulkDeleteModalOpen(false)
                    }
                }}
            >
                <Dialog.Header caption="Удалить выбранных участников?" />
                <Dialog.Body>
                    <div style={{ minWidth: '350px' }}>
                        <Alert
                            theme="danger"
                            message={`Будет удалено участников: ${state.selectedIds.length}. Это действие нельзя отменить.`}
                        />
                    </div>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setIsBulkDeleteModalOpen(false)}
                    onClickButtonApply={handleBulkDelete}
                    textButtonCancel="Отмена"
                    textButtonApply={`Удалить ${state.selectedIds.length}`}
                    propsButtonCancel={{ disabled: isBulkDeleting }}
                    propsButtonApply={{
                        loading: isBulkDeleting,
                        view: 'outlined-danger',
                    }}
                />
            </Dialog>
        </PageWrapper>
    )
}

export default ProjectParticipantsPage
