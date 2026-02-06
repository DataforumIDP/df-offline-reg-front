import { Text, Card, Button, DropdownMenu, Dialog, Label } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { useDeleteSchemeMutation } from '@/hooks/mutations/useSchemeMutations'
import CreateSchemeModal from './CreateSchemeModal'
import EditSchemeModal from './EditSchemeModal'

const typeNames: Record<string, string> = {
    text: 'Текст',
    list: 'Список',
    bool: 'Чекбокс',
    id: 'Идентификатор',
    img: 'Изображение',
    code: 'Код',
}

const typeThemes: Record<
    string,
    'normal' | 'info' | 'success' | 'warning' | 'danger' | 'utility' | 'unknown' | 'clear'
> = {
    text: 'info',
    list: 'success',
    bool: 'warning',
    id: 'utility',
    img: 'unknown',
    code: 'danger',
}

const ProjectSchemeSection = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { data: schemeData, isLoading } = useSchemeQuery(projectId || '')
    const deleteFieldMutation = useDeleteSchemeMutation(projectId || '')
    const { enqueueSnackbar } = useSnackbar()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingField, setEditingField] = useState<any>(null)
    const [deleteConfirmFieldId, setDeleteConfirmFieldId] = useState<number | null>(null)

    const handleDeleteField = (fieldId: number) => {
        deleteFieldMutation.mutate(fieldId, {
            onSuccess: () => {
                enqueueSnackbar('Поле удалено', { variant: 'success' })
                setDeleteConfirmFieldId(null)
            },
            onError: () => {
                enqueueSnackbar('Ошибка при удалении поля', { variant: 'error' })
            },
        })
    }

    const handleEditField = (field: any) => {
        setEditingField(field)
        setIsEditModalOpen(true)
    }

    const fields = schemeData?.fields || []

    return (
        <Card style={{ padding: '24px' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                }}
            >
                <Text variant="header-2">Схема проекта</Text>
                <Button onClick={() => setIsCreateModalOpen(true)} size="l">
                    Добавить
                </Button>
            </div>

            {isLoading ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                    <Text variant="body-1" color="secondary">
                        Загрузка...
                    </Text>
                </div>
            ) : fields.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                    <Text variant="body-1" color="secondary">
                        Поля не добавлены. Нажмите "Добавить" чтобы создать первое поле
                    </Text>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {fields.map((field: any) => (
                        <div
                            key={field.id}
                            style={{
                                borderRadius: '4px',
                            }}
                        >
                            <Card
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: 'var(--g-color-bg-secondary)',
                                    borderRadius: '4px',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        <Text variant="body-1">{field.label}</Text>
                                        <Label theme={typeThemes[field.config.type]} size="s">
                                            {typeNames[field.config.type]}
                                        </Label>
                                        {field.config.uniq && (
                                            <Label theme="normal" size="s">
                                                Уникальное
                                            </Label>
                                        )}
                                    </div>
                                    <Text variant="caption-2" color="secondary">
                                        {field.key}
                                    </Text>
                                </div>

                                <DropdownMenu
                                    items={[
                                        {
                                            action: () => handleEditField(field),
                                            text: 'Изменить',
                                        },
                                        {
                                            action: () => setDeleteConfirmFieldId(field.id),
                                            text: 'Удалить',
                                            theme: 'danger',
                                        },
                                    ]}
                                />
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            <CreateSchemeModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectId || ''}
            />

            <EditSchemeModal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingField(null)
                }}
                field={editingField}
                projectId={projectId || ''}
            />

            <Dialog
                open={deleteConfirmFieldId !== null}
                onClose={() => setDeleteConfirmFieldId(null)}
                aria-labelledby="delete-field-dialog-title"
            >
                <Dialog.Header caption="Удалить поле?" id="delete-field-dialog-title" />
                <Dialog.Body>
                    <Text variant="body-1">
                        Вы уверены, что хотите удалить это поле? Это действие невозможно отменить.
                    </Text>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setDeleteConfirmFieldId(null)}
                    onClickButtonApply={() =>
                        deleteConfirmFieldId && handleDeleteField(deleteConfirmFieldId)
                    }
                    textButtonCancel="Отмена"
                    textButtonApply="Удалить"
                    propsButtonApply={{ loading: deleteFieldMutation.isPending }}
                />
            </Dialog>
        </Card>
    )
}

export default ProjectSchemeSection
