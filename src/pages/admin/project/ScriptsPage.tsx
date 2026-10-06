import { useState, useEffect } from 'react'
import { Button, Dialog, Text } from '@gravity-ui/uikit'
import { useSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'
import { PageWrapper, PageHeader, PageHeaderActions, ScriptEditor } from '@/components/atoms'
import {
    useProjectScriptsQuery,
    useRunProjectRuntimeScript,
    useUpdateProjectScripts,
} from '@/hooks/queries/useProjectScriptsQueries'

const ProjectScriptsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()
    const pid = Number(projectId)

    const { data, isLoading } = useProjectScriptsQuery(pid)
    const updateMutation = useUpdateProjectScripts(pid)
    const runRuntimeMutation = useRunProjectRuntimeScript(pid)

    const [preScript, setPreScript] = useState<string | null>(null)
    const [postScript, setPostScript] = useState<string | null>(null)
    const [runtimeScript, setRuntimeScript] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>('pre')
    const [isRunConfirmOpen, setIsRunConfirmOpen] = useState(false)

    useEffect(() => {
        if (data) {
            setPreScript(data.preScript)
            setPostScript(data.postScript)
            setRuntimeScript(data.runtimeScript)
        }
    }, [data])

    const hasUnsavedChanges =
        preScript !== data?.preScript ||
        postScript !== data?.postScript ||
        runtimeScript !== data?.runtimeScript

    const handleSave = () => {
        updateMutation.mutate(
            { preScript, postScript, runtimeScript },
            {
                onSuccess: () => enqueueSnackbar('Скрипты сохранены', { variant: 'success' }),
                onError: () => enqueueSnackbar('Ошибка при сохранении', { variant: 'error' }),
            },
        )
    }

    const handleRunRuntime = () => {
        runRuntimeMutation.mutate(undefined, {
            onSuccess: (result) => {
                setIsRunConfirmOpen(false)
                enqueueSnackbar(
                    `Обработано участников: ${result.processed}. Изменено: ${result.updated}.`,
                    { variant: 'success' },
                )
            },
            onError: (error) => {
                const responseMessage = (error as { response?: { data?: { error?: string } } })
                    .response?.data?.error
                enqueueSnackbar(responseMessage || error.message || 'Ошибка runtime-скрипта', {
                    variant: 'error',
                })
            },
        })
    }

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Скрипты проекта</Text>
                <PageHeaderActions>
                    <Button
                        view="action"
                        size="l"
                        loading={updateMutation.isPending}
                        disabled={!hasUnsavedChanges || runRuntimeMutation.isPending}
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                    {activeTab === 'runtime' && (
                        <Button
                            view="outlined"
                            size="l"
                            disabled={
                                !runtimeScript?.trim() ||
                                hasUnsavedChanges ||
                                runRuntimeMutation.isPending
                            }
                            loading={runRuntimeMutation.isPending}
                            onClick={() => setIsRunConfirmOpen(true)}
                        >
                            Запустить runtime-скрипт
                        </Button>
                    )}
                </PageHeaderActions>
            </PageHeader>

            {!isLoading && (
                <>
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            borderBottom: '1px solid var(--g-color-line-generic)',
                            paddingBottom: '8px',
                        }}
                    >
                        <Button
                            view={activeTab === 'pre' ? 'normal' : 'flat'}
                            size="s"
                            onClick={() => setActiveTab('pre')}
                        >
                            Прескрипт
                            {preScript && (
                                <span
                                    style={{
                                        marginLeft: 6,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--g-color-text-positive)',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            )}
                        </Button>
                        <Button
                            view={activeTab === 'post' ? 'normal' : 'flat'}
                            size="s"
                            onClick={() => setActiveTab('post')}
                        >
                            Постскрипт
                            {postScript && (
                                <span
                                    style={{
                                        marginLeft: 6,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--g-color-text-positive)',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            )}
                        </Button>
                        <Button
                            view={activeTab === 'runtime' ? 'normal' : 'flat'}
                            size="s"
                            onClick={() => setActiveTab('runtime')}
                        >
                            Runtime-скрипт
                            {runtimeScript && (
                                <span
                                    style={{
                                        marginLeft: 6,
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--g-color-text-positive)',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            )}
                        </Button>
                    </div>

                    <div style={{ marginTop: 0 }}>
                        {activeTab === 'pre' && (
                            <ScriptEditor
                                label="Прескрипт"
                                description="Выполняется до валидации данных. Может трансформировать или отклонить входящие данные. Возвращает изменённый объект данных."
                                scriptType="pre"
                                value={preScript}
                                onChange={setPreScript}
                            />
                        )}
                        {activeTab === 'post' && (
                            <ScriptEditor
                                label="Постскрипт"
                                description="Выполняется после сохранения участника. Может отправить письмо, сделать HTTP-запрос и т.д. Возвращает изменённые данные участника."
                                scriptType="post"
                                value={postScript}
                                onChange={setPostScript}
                            />
                        )}
                        {activeTab === 'runtime' && (
                            <ScriptEditor
                                label="Runtime-скрипт"
                                description="Запускается вручную для каждого активного участника проекта. Доступны data.user и data.scans (события сканирования с зоной и таймштампом); верните изменённый объект участника."
                                scriptType="runtime"
                                value={runtimeScript}
                                onChange={setRuntimeScript}
                            />
                        )}
                    </div>
                </>
            )}
            <Dialog
                open={isRunConfirmOpen}
                onClose={() => {
                    if (!runRuntimeMutation.isPending) {
                        setIsRunConfirmOpen(false)
                    }
                }}
            >
                <Dialog.Header caption="Запустить runtime-скрипт?" />
                <Dialog.Body>
                    <Text>
                        Скрипт будет выполнен для всех активных участников проекта и может изменить
                        сохранённые данные. Проверьте код и сохраните его перед запуском.
                    </Text>
                </Dialog.Body>
                <Dialog.Footer
                    onClickButtonCancel={() => setIsRunConfirmOpen(false)}
                    onClickButtonApply={handleRunRuntime}
                    textButtonCancel="Отмена"
                    textButtonApply="Запустить"
                    propsButtonApply={{
                        view: 'action',
                        loading: runRuntimeMutation.isPending,
                        disabled: runRuntimeMutation.isPending,
                    }}
                />
            </Dialog>
        </PageWrapper>
    )
}

export default ProjectScriptsPage
