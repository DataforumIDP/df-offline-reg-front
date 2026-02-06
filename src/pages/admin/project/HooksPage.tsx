import { useState, useCallback } from 'react'
import { Text, Button, Loader, Card, Label } from '@gravity-ui/uikit'
import { Plus } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useWebhooksQuery } from '@/hooks/queries/useWebhookQueries'
import { WebhookModal } from '@/components/organisms/WebhookModal'
import type { Webhook } from '@/services/api/webhooks'

const ProjectHooksPage = () => {
    const { id: projectId } = useParams<{ id: string }>()

    // Запрос webhooks
    const { data: webhooks, isLoading } = useWebhooksQuery(Number(projectId))

    // Состояние модалки
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

    // Открыть модалку создания
    const handleCreateClick = useCallback(() => {
        setSelectedWebhook(null)
        setModalOpen(true)
    }, [])

    // Открыть модалку редактирования
    const handleWebhookClick = useCallback((webhook: Webhook) => {
        setSelectedWebhook(webhook)
        setModalOpen(true)
    }, [])

    // Закрыть модалку
    const handleModalClose = useCallback(() => {
        setModalOpen(false)
        setSelectedWebhook(null)
    }, [])

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Шапка */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="display-1">Вебхуки</Text>
                <Button view="action" size="l" onClick={handleCreateClick}>
                    <Button.Icon>
                        <Plus />
                    </Button.Icon>
                    Добавить вебхук
                </Button>
            </div>

            {/* Контент */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                    <Loader size="l" />
                </div>
            ) : !webhooks || webhooks.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '48px',
                        backgroundColor: 'var(--g-color-base-generic)',
                        borderRadius: '12px',
                    }}
                >
                    <Text variant="subheader-3" color="secondary">
                        Нет вебхуков
                    </Text>
                    <Text variant="body-1" color="secondary">
                        Создайте вебхук для приёма данных извне
                    </Text>
                    <Button view="outlined-action" size="l" onClick={handleCreateClick}>
                        <Button.Icon>
                            <Plus />
                        </Button.Icon>
                        Создать первый вебхук
                    </Button>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {webhooks.map((webhook) => (
                        <Card
                            key={webhook.id}
                            type="action"
                            onClick={() => handleWebhookClick(webhook)}
                            style={{
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Text
                                        variant="subheader-2"
                                        style={{ flex: 1, wordBreak: 'break-word' }}
                                    >
                                        {webhook.name}
                                    </Text>
                                    <Label theme={webhook.isActive ? 'success' : 'danger'} size="s">
                                        {webhook.isActive ? 'Активен' : 'Неактивен'}
                                    </Label>
                                </div>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    style={{ fontFamily: 'monospace' }}
                                >
                                    /webhooks/{webhook.slug}
                                </Text>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Модалка */}
            <WebhookModal
                open={modalOpen}
                onClose={handleModalClose}
                projectId={Number(projectId)}
                webhook={selectedWebhook}
            />
        </div>
    )
}

export default ProjectHooksPage
