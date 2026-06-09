import { useState, useEffect } from 'react'
import { Button, Text } from '@gravity-ui/uikit'
import { useSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'
import { PageWrapper, PageHeader, PageHeaderActions, ScriptEditor } from '@/components/atoms'
import { useProjectScriptsQuery, useUpdateProjectScripts } from '@/hooks/queries/useProjectScriptsQueries'

const ProjectScriptsPage = () => {
    const { id: projectId } = useParams<{ id: string }>()
    const { enqueueSnackbar } = useSnackbar()
    const pid = Number(projectId)

    const { data, isLoading } = useProjectScriptsQuery(pid)
    const updateMutation = useUpdateProjectScripts(pid)

    const [preScript, setPreScript] = useState<string | null>(null)
    const [postScript, setPostScript] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>('pre')

    useEffect(() => {
        if (data) {
            setPreScript(data.preScript)
            setPostScript(data.postScript)
        }
    }, [data])

    const handleSave = () => {
        updateMutation.mutate(
            { preScript, postScript },
            {
                onSuccess: () => enqueueSnackbar('Скрипты сохранены', { variant: 'success' }),
                onError: () => enqueueSnackbar('Ошибка при сохранении', { variant: 'error' }),
            },
        )
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
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
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
                    </div>
                </>
            )}
        </PageWrapper>
    )
}

export default ProjectScriptsPage
