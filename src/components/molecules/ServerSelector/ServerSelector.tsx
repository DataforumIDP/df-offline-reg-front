import { useState, useEffect, useRef } from 'react'
import { Button, Text, TextInput, Icon, Popup, Modal } from '@gravity-ui/uikit'
import { ChevronDown, Plus, TrashBin, Globe } from '@gravity-ui/icons'
import {
    getAllServers,
    getActiveServerUrl,
    setActiveServer,
    addCustomServer,
    removeCustomServer,
    type ServerEntry,
} from '@/services/serverStorage'

interface AddServerForm {
    label: string
    url: string
}

export const ServerSelector = () => {
    const [servers, setServers] = useState<ServerEntry[]>([])
    const [activeUrl, setActiveUrl] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form, setForm] = useState<AddServerForm>({ label: '', url: '' })
    const anchorRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        setServers(getAllServers())
        setActiveUrl(getActiveServerUrl())
    }, [])

    const activeServer = servers.find((s) => s.url === activeUrl) || servers[0]

    const handleSelect = (url: string) => {
        setActiveServer(url)
        setActiveUrl(url)
        setIsOpen(false)
        // Перезагружаем, чтобы axios подхватил новый baseURL
        window.location.reload()
    }

    const handleRemove = (e: React.MouseEvent, url: string) => {
        e.stopPropagation()
        removeCustomServer(url)
        const updated = getAllServers()
        setServers(updated)
        // Если удалили активный — переключаемся на дефолт и перезагружаем
        if (url === activeUrl) {
            setActiveUrl(updated[0].url)
            window.location.reload()
        }
    }

    const handleAddServer = () => {
        if (!form.label.trim() || !form.url.trim()) return

        let url = form.url.trim()
        // Убираем слеш в конце
        if (url.endsWith('/')) url = url.slice(0, -1)

        addCustomServer(form.label.trim(), url)
        setServers(getAllServers())
        setForm({ label: '', url: '' })
        setIsModalOpen(false)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setForm({ label: '', url: '' })
    }

    return (
        <>
            <Button
                ref={anchorRef}
                view="flat"
                size="s"
                onClick={() => setIsOpen(!isOpen)}
                style={{ marginTop: '12px', width: '100%' }}
            >
                <Icon data={Globe} size={14} />
                <Text variant="caption-2" color="secondary" style={{ marginLeft: '4px' }}>
                    {activeServer?.label || 'Сервер'}
                </Text>
                <Icon
                    data={ChevronDown}
                    size={12}
                    style={{
                        marginLeft: '4px',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                />
            </Button>

            <Popup
                open={isOpen}
                anchorRef={anchorRef}
                placement="bottom"
                onClose={() => setIsOpen(false)}
            >
                <div style={{ padding: '4px 0', minWidth: '280px' }}>
                    {servers.map((server) => (
                        <div
                            key={server.url}
                            onClick={() => handleSelect(server.url)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                backgroundColor:
                                    server.url === activeUrl
                                        ? 'var(--g-color-base-selection)'
                                        : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                                if (server.url !== activeUrl) {
                                    e.currentTarget.style.backgroundColor =
                                        'var(--g-color-base-simple-hover)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (server.url !== activeUrl) {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }
                            }}
                        >
                            <div>
                                <Text variant="body-1">{server.label}</Text>
                                <Text
                                    variant="caption-2"
                                    color="secondary"
                                    style={{ display: 'block' }}
                                >
                                    {server.url}
                                </Text>
                            </div>
                            {!server.isDefault && (
                                <Button
                                    view="flat"
                                    size="xs"
                                    onClick={(e) => handleRemove(e, server.url)}
                                >
                                    <Icon data={TrashBin} size={14} />
                                </Button>
                            )}
                        </div>
                    ))}

                    <div
                        style={{
                            borderTop: '1px solid var(--g-color-line-generic)',
                            marginTop: '4px',
                            paddingTop: '4px',
                        }}
                    >
                        <Button
                            view="flat"
                            size="s"
                            width="max"
                            onClick={() => {
                                setIsOpen(false)
                                setIsModalOpen(true)
                            }}
                        >
                            <Icon data={Plus} size={14} />
                            Добавить сервер
                        </Button>
                    </div>
                </div>
            </Popup>

            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <div style={{ padding: '24px', width: '360px' }}>
                    <Text variant="subheader-2" style={{ marginBottom: '16px', display: 'block' }}>
                        Добавить сервер
                    </Text>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <Text
                                variant="caption-2"
                                color="secondary"
                                style={{ marginBottom: '4px', display: 'block' }}
                            >
                                Название
                            </Text>
                            <TextInput
                                value={form.label}
                                onUpdate={(v) => setForm((f) => ({ ...f, label: v }))}
                                placeholder="Мой сервер"
                                size="l"
                            />
                        </div>

                        <div>
                            <Text
                                variant="caption-2"
                                color="secondary"
                                style={{ marginBottom: '4px', display: 'block' }}
                            >
                                URL сервера
                            </Text>
                            <TextInput
                                value={form.url}
                                onUpdate={(v) => setForm((f) => ({ ...f, url: v }))}
                                placeholder="https://example.com:3030"
                                size="l"
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'flex-end',
                                marginTop: '8px',
                            }}
                        >
                            <Button view="flat" size="l" onClick={handleCloseModal}>
                                Отмена
                            </Button>
                            <Button
                                view="action"
                                size="l"
                                onClick={handleAddServer}
                                disabled={!form.label.trim() || !form.url.trim()}
                            >
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}
