import { useState } from 'react'
import { Button, Dialog, Label, Spin, Text, TextInput } from '@gravity-ui/uikit'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSnackbar } from 'notistack'
import {
    useClearProjectRuntimeRuns,
    useProjectRuntimeRunsQuery,
} from '@/hooks/queries/useProjectScriptsQueries'
import './RuntimeLogsDialog.css'

interface RuntimeLogsDialogProps {
    open: boolean
    onClose: () => void
    projectId: number
}

const formatDate = (value: string) =>
    new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })

export const RuntimeLogsDialog = ({
    open,
    onClose,
    projectId,
}: RuntimeLogsDialogProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const [search, setSearch] = useState('')
    const [confirmClear, setConfirmClear] = useState(false)
    const { data: runs, isLoading, isError } = useProjectRuntimeRunsQuery(
        projectId,
        search.trim(),
        open,
    )
    const clearMutation = useClearProjectRuntimeRuns(projectId)

    const handleClear = () => {
        clearMutation.mutate(undefined, {
            onSuccess: ({ deleted }) => {
                setConfirmClear(false)
                setSearch('')
                enqueueSnackbar(`История запусков очищена. Удалено записей: ${deleted}.`, {
                    variant: 'success',
                })
            },
            onError: (error) => {
                const responseMessage = (
                    error as { response?: { data?: { error?: string } } }
                ).response?.data?.error
                enqueueSnackbar(
                    responseMessage || error.message || 'Не удалось очистить историю запусков',
                    { variant: 'error' },
                )
            },
        })
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <Dialog.Header caption="Логи runtime-скриптов" />
            <Dialog.Body>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: 'min(900px, 80vw)',
                    }}
                >
                    <TextInput
                        value={search}
                        onUpdate={setSearch}
                        placeholder="Поиск по логам..."
                        size="l"
                        hasClear
                    />

                    {confirmClear ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                padding: '12px',
                                border: '1px solid var(--g-color-line-danger)',
                                borderRadius: '8px',
                            }}
                        >
                            <Text color="danger">
                                Удалить всю историю запусков и логи этого проекта? Это действие нельзя отменить.
                            </Text>
                            <div style={{ display: 'flex', flexShrink: 0, gap: '8px' }}>
                                <Button
                                    view="flat"
                                    size="m"
                                    disabled={clearMutation.isPending}
                                    onClick={() => setConfirmClear(false)}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    view="outlined-danger"
                                    size="m"
                                    loading={clearMutation.isPending}
                                    disabled={clearMutation.isPending}
                                    onClick={handleClear}
                                >
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                view="outlined-danger"
                                size="m"
                                disabled={!runs?.length || isLoading}
                                onClick={() => setConfirmClear(true)}
                            >
                                Очистить историю
                            </Button>
                        </div>
                    )}

                    <div
                        style={{
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            maxHeight: '65vh',
                            paddingRight: '4px',
                        }}
                    >
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                                <Spin size="m" />
                            </div>
                        )}
                        {isError && (
                            <Text color="danger">
                                Не удалось загрузить логи запусков.
                            </Text>
                        )}
                        {!isLoading && !isError && runs?.length === 0 && (
                            <Text
                                color="secondary"
                                style={{ textAlign: 'center', padding: '24px 0' }}
                            >
                                {search.trim()
                                    ? 'По запросу ничего не найдено'
                                    : 'Запусков пока нет'}
                            </Text>
                        )}

                        {runs?.map((run) => (
                            <section
                                key={run.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '12px',
                                    border: '1px solid var(--g-color-line-generic)',
                                    borderRadius: '8px',
                                    background: 'var(--g-color-base-generic)',
                                }}
                            >
                                <header
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Label
                                            theme={
                                                run.status === 'succeeded'
                                                    ? 'success'
                                                    : run.status === 'failed'
                                                      ? 'danger'
                                                      : 'warning'
                                            }
                                            size="xs"
                                        >
                                            {run.status === 'succeeded'
                                                ? 'Успешно'
                                                : run.status === 'failed'
                                                  ? 'Ошибка'
                                                  : 'Выполняется'}
                                        </Label>
                                        <Text variant="body-2">
                                            Запуск #{run.id}
                                        </Text>
                                    </div>
                                    <Text variant="caption-2" color="secondary">
                                        {formatDate(run.startedAt)}
                                    </Text>
                                </header>

                                {run.result && (
                                    <Text variant="caption-2" color="secondary">
                                        Обработано: {run.result.processed}; изменено:{' '}
                                        {run.result.updated}
                                        {run.result.participantId !== undefined
                                            ? `; участник #${run.result.participantId}`
                                            : ''}
                                        {run.result.error ? `; ${run.result.error}` : ''}
                                    </Text>
                                )}

                                {run.logs.length === 0 ? (
                                    <Text variant="caption-2" color="secondary">
                                        Скрипт не записал сообщений в лог.
                                    </Text>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                        }}
                                    >
                                        {run.logs.map((entry, index) => (
                                            <article
                                                key={`${entry.participantId}-${index}`}
                                                style={{
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    background: 'var(--g-color-base-background)',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                <Text
                                                    variant="caption-2"
                                                    color="secondary"
                                                    style={{ display: 'block', marginBottom: '6px' }}
                                                >
                                                    Участник #{entry.participantId}
                                                </Text>
                                                <div className="runtime-markdown">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {entry.text}
                                                    </ReactMarkdown>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                textButtonCancel="Закрыть"
                propsButtonCancel={{ view: 'normal' }}
            />
        </Dialog>
    )
}

export default RuntimeLogsDialog
