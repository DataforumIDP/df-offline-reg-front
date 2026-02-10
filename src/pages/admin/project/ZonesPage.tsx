import { useState, useCallback, useMemo } from 'react'
import { Text, Button, Loader, Card, Label, Select } from '@gravity-ui/uikit'
import { Plus, Gear } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { PageWrapper, PageHeader, PageHeaderActions } from '@/components/atoms'
import { useZonesQuery } from '@/hooks/queries/useZoneQueries'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useProjectQuery } from '@/hooks/queries/useProjectQueries'
import { useUpdateProjectMutation } from '@/hooks/mutations/useProjectMutations'
import {
    useCreateZoneMutation,
    useUpdateZoneMutation,
    useDeleteZoneMutation,
    useCreateZoneRuleMutation,
    useDeleteZoneRuleMutation,
} from '@/hooks/mutations/useZoneMutations'
import ZoneEditModal from './components/ZoneEditModal'
import AccessRulesModal from './components/AccessRulesModal'
import type { Zone } from '@/services/api/zones'
import styles from './ZonesPage.module.css'

const ProjectZonesPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()

    // Запросы данных
    const { data: zones, isLoading: zonesLoading } = useZonesQuery(Number(projectId))
    const { data: scheme } = useSchemeQuery(projectId || '')
    const { data: project } = useProjectQuery(projectId || '')

    // Мутации
    const updateProjectMutation = useUpdateProjectMutation()
    const createZoneMutation = useCreateZoneMutation()
    const updateZoneMutation = useUpdateZoneMutation()
    const deleteZoneMutation = useDeleteZoneMutation()
    const createRuleMutation = useCreateZoneRuleMutation()
    const deleteRuleMutation = useDeleteZoneRuleMutation()

    // Состояния модалок
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [accessModalOpen, setAccessModalOpen] = useState(false)

    // Получаем поля типа list из схемы
    const listFields = useMemo(() => {
        if (!scheme?.fields) {
            return []
        }
        return scheme.fields.filter((f: SchemeField) => f.config.type === 'list')
    }, [scheme])

    // Текущее ключевое поле
    const rulesField = useMemo(() => {
        if (!project?.rulesField || !scheme?.fields) {
            return null
        }
        return scheme.fields.find((f: SchemeField) => f.key === project.rulesField) || null
    }, [project, scheme])

    // Опции для селекта
    const selectOptions = useMemo(() => {
        return listFields.map((f: SchemeField) => ({
            value: f.key,
            content: f.label,
        }))
    }, [listFields])

    // Опции для селекта режима сканирования
    const scanModeOptions = [
        { value: 'base', content: 'Быстрый' },
        { value: 'direction', content: 'С указанием направления' },
        { value: 'view', content: 'Просмотр данных' },
    ]

    // Обработка изменения режима сканирования
    const handleScanModeChange = useCallback(
        async (values: string[]) => {
            const value = values[0] || 'base'
            try {
                await updateProjectMutation.mutateAsync({
                    id: Number(projectId),
                    data: { scanMode: value as 'base' | 'direction' | 'view' },
                })
                enqueueSnackbar('Режим сканирования обновлён', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar('Ошибка обновления', { variant: 'error' })
            }
        },
        [projectId, updateProjectMutation, enqueueSnackbar],
    )

    // Обработка изменения ключевого поля
    const handleRulesFieldChange = useCallback(
        async (values: string[]) => {
            const value = values[0] || null
            try {
                await updateProjectMutation.mutateAsync({
                    id: Number(projectId),
                    data: { rulesField: value },
                })
                enqueueSnackbar('Ключевое поле обновлено', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar('Ошибка обновления', { variant: 'error' })
            }
        },
        [projectId, updateProjectMutation, enqueueSnackbar],
    )

    // Открытие модалки создания
    const handleCreateClick = useCallback(() => {
        setSelectedZone(null)
        setIsCreating(true)
        setEditModalOpen(true)
    }, [])

    // Открытие модалки редактирования
    const handleZoneClick = useCallback((zone: Zone) => {
        setSelectedZone(zone)
        setIsCreating(false)
        setEditModalOpen(true)
    }, [])

    // Закрытие модалки
    const handleEditModalClose = useCallback(() => {
        setEditModalOpen(false)
        setSelectedZone(null)
    }, [])

    // Сохранение зоны
    const handleSaveZone = useCallback(
        async (data: { name: string; free: boolean }) => {
            try {
                if (isCreating) {
                    await createZoneMutation.mutateAsync({
                        projectId: Number(projectId),
                        name: data.name,
                        free: data.free,
                    })
                    enqueueSnackbar('Зона создана', { variant: 'success' })
                } else if (selectedZone) {
                    await updateZoneMutation.mutateAsync({
                        zoneId: selectedZone.id,
                        data: { name: data.name, free: data.free },
                        projectId: Number(projectId),
                    })
                    enqueueSnackbar('Зона обновлена', { variant: 'success' })
                }
                handleEditModalClose()
            } catch (e) {
                enqueueSnackbar('Ошибка сохранения', { variant: 'error' })
            }
        },
        [
            isCreating,
            selectedZone,
            projectId,
            createZoneMutation,
            updateZoneMutation,
            enqueueSnackbar,
            handleEditModalClose,
        ],
    )

    // Удаление зоны
    const handleDeleteZone = useCallback(async () => {
        if (!selectedZone) {
            return
        }
        try {
            await deleteZoneMutation.mutateAsync({
                zoneId: selectedZone.id,
                projectId: Number(projectId),
            })
            enqueueSnackbar('Зона удалена', { variant: 'success' })
            handleEditModalClose()
        } catch (e) {
            enqueueSnackbar('Ошибка удаления', { variant: 'error' })
        }
    }, [selectedZone, projectId, deleteZoneMutation, enqueueSnackbar, handleEditModalClose])

    // Создание правила доступа
    const handleCreateRule = useCallback(
        async (zoneId: number, listItem: string) => {
            try {
                await createRuleMutation.mutateAsync({
                    zoneId,
                    listItem,
                    projectId: Number(projectId),
                })
                enqueueSnackbar('Правило добавлено', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar('Ошибка добавления правила', { variant: 'error' })
            }
        },
        [projectId, createRuleMutation, enqueueSnackbar],
    )

    // Удаление правила доступа
    const handleDeleteRule = useCallback(
        async (zoneId: number, ruleId: number) => {
            try {
                await deleteRuleMutation.mutateAsync({
                    zoneId,
                    ruleId,
                    projectId: Number(projectId),
                })
                enqueueSnackbar('Правило удалено', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar('Ошибка удаления правила', { variant: 'error' })
            }
        },
        [projectId, deleteRuleMutation, enqueueSnackbar],
    )

    const isLoading = zonesLoading

    return (
        <PageWrapper>
            {/* Шапка */}
            <PageHeader>
                <Text variant="display-1">Зоны</Text>
                <PageHeaderActions>
                    <div className={styles.rulesFieldSelect}>
                        <Text variant="body-2" color="secondary">
                            Режим сканирования:
                        </Text>
                        <Select
                            value={[project?.scanMode || 'base']}
                            onUpdate={handleScanModeChange}
                            options={scanModeOptions}
                            width={240}
                        />
                    </div>
                    <div className={styles.rulesFieldSelect}>
                        <Text variant="body-2" color="secondary">
                            Ключевое поле:
                        </Text>
                        <Select
                            value={project?.rulesField ? [project.rulesField] : []}
                            onUpdate={handleRulesFieldChange}
                            options={selectOptions}
                            placeholder="Не выбрано"
                            width={200}
                            disabled={listFields.length === 0}
                        />
                    </div>
                    {project?.rulesField && (
                        <Button view="outlined" size="l" onClick={() => setAccessModalOpen(true)}>
                            <Button.Icon>
                                <Gear />
                            </Button.Icon>
                            Настройки доступа
                        </Button>
                    )}
                </PageHeaderActions>
            </PageHeader>

            {/* Контент */}
            {isLoading ? (
                <div className={styles.loading}>
                    <Loader size="l" />
                </div>
            ) : (
                <div className={styles.grid}>
                    {/* Карточка добавления */}
                    <Card type="action" className={styles.addCard} onClick={handleCreateClick}>
                        <div className={styles.addCardContent}>
                            <Plus width={32} height={32} />
                            <Text variant="subheader-2">Добавить зону</Text>
                        </div>
                    </Card>

                    {/* Карточки зон */}
                    {zones?.map((zone) => (
                        <Card
                            key={zone.id}
                            type="action"
                            className={styles.zoneCard}
                            onClick={() => handleZoneClick(zone)}
                        >
                            <div className={styles.zoneCardContent}>
                                <Text variant="subheader-2" className={styles.zoneName}>
                                    {zone.name}
                                </Text>
                                <Label theme={zone.free ? 'success' : 'danger'} size="s">
                                    {zone.free ? 'Свободный вход' : 'Ограниченный доступ'}
                                </Label>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Модалка редактирования */}
            <ZoneEditModal
                open={editModalOpen}
                onClose={handleEditModalClose}
                zone={selectedZone}
                onSave={handleSaveZone}
                onDelete={handleDeleteZone}
                isLoading={createZoneMutation.isPending || updateZoneMutation.isPending}
                isCreate={isCreating}
            />

            {/* Модалка настройки доступа */}
            <AccessRulesModal
                open={accessModalOpen}
                onClose={() => setAccessModalOpen(false)}
                zones={zones || []}
                rulesField={rulesField}
                onCreateRule={handleCreateRule}
                onDeleteRule={handleDeleteRule}
                isLoading={createRuleMutation.isPending || deleteRuleMutation.isPending}
            />
        </PageWrapper>
    )
}

export default ProjectZonesPage
