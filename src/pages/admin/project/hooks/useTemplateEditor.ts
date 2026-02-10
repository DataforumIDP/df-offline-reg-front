import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    setCanvasWidth,
    setCanvasHeight,
    setElements,
    setTemplateId,
    setTemplateName,
    markAsSaved,
    resetEditor,
} from '@/store/slices/templateEditorSlice'
import { useProjectPrintTemplate } from '@/hooks/queries/useTemplateQueries'
import {
    useCreatePrintTemplateMutation,
    useUpdatePrintTemplateMutation,
    useAssignPrintTemplateMutation,
    useDeleteProjectPrintTemplateMutation,
} from '@/hooks/mutations/useTemplateMutations'
import { uploadFile, getFileUrl } from '@/services/api/files'
import { PrintTemplate, generateTemplatePreview } from '@/services/printService'
import { PrintTemplate as ApiPrintTemplate } from '@/services/api/templates'

export const useTemplateEditor = () => {
    const { id: projectId } = useParams()
    const dispatch = useAppDispatch()
    const { enqueueSnackbar } = useSnackbar()

    // Данные из стора
    const { canvas, elements, templateId, templateName, isDirty } = useAppSelector(
        (state) => state.templateEditor,
    )
    const { widthMm: canvasWidthMm, heightMm: canvasHeightMm, zoom, sizeUnit } = canvas

    // Состояния диалогов
    const [nameDialogOpen, setNameDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [selectTemplateOpen, setSelectTemplateOpen] = useState(false)
    const [isSelectingTemplate, setIsSelectingTemplate] = useState(false)

    // Запрос шаблона проекта
    const { data: projectTemplate } = useProjectPrintTemplate(
        projectId ? Number(projectId) : undefined,
    )

    // Синхронизация projectTemplate с редактором
    useEffect(() => {
        if (!projectTemplate?.template) {
            return
        }
        const tpl = projectTemplate.template
        dispatch(setTemplateId(tpl.id))
        dispatch(setTemplateName(tpl.name))
        if (tpl.settings) {
            dispatch(setElements(tpl.settings.elements || []))
            if (tpl.settings.widthMm) {
                dispatch(setCanvasWidth(tpl.settings.widthMm))
            }
            if (tpl.settings.heightMm) {
                dispatch(setCanvasHeight(tpl.settings.heightMm))
            }
        }
        dispatch(markAsSaved())
    }, [projectTemplate, dispatch])

    // Мутации
    const createTemplateMutation = useCreatePrintTemplateMutation()
    const updateTemplateMutation = useUpdatePrintTemplateMutation()
    const assignTemplateMutation = useAssignPrintTemplateMutation()
    const deleteProjectTemplateMutation = useDeleteProjectPrintTemplateMutation()

    // Генерация превью шаблона
    const generatePreloaderUrl = useCallback(async (): Promise<string | undefined> => {
        try {
            if (elements.length === 0) {
                return undefined
            }

            const template: PrintTemplate = {
                widthMm: canvasWidthMm,
                heightMm: canvasHeightMm,
                elements,
            }

            const previewBlob = await generateTemplatePreview(template, {})
            const key = await uploadFile(previewBlob, `preloader_${projectId}_${Date.now()}.jpg`)
            return getFileUrl(key)
        } catch (e) {
            console.error('Failed to generate preloader:', e)
            return undefined
        }
    }, [elements, canvasWidthMm, canvasHeightMm, projectId])

    // Сохранение шаблона
    const handleSave = useCallback(async () => {
        if (!projectId) {
            return
        }

        const preloaderUrl = await generatePreloaderUrl()

        // Если шаблон уже назначен — обновляем
        if (templateId) {
            try {
                await updateTemplateMutation.mutateAsync({
                    id: templateId,
                    data: {
                        name: templateName || 'Шаблон',
                        settings: {
                            widthMm: canvasWidthMm,
                            heightMm: canvasHeightMm,
                            elements,
                        },
                        preloader: preloaderUrl,
                    },
                })
                dispatch(markAsSaved())
                enqueueSnackbar('Шаблон успешно обновлён', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar(
                    'Ошибка при обновлении шаблона: ' + (e instanceof Error ? e.message : e),
                    { variant: 'error' },
                )
            }
            return
        }

        // Если шаблон не назначен — показать диалог
        setNameDialogOpen(true)
    }, [
        projectId,
        templateId,
        templateName,
        canvasWidthMm,
        canvasHeightMm,
        elements,
        generatePreloaderUrl,
        updateTemplateMutation,
        dispatch,
        enqueueSnackbar,
    ])

    // Создание нового шаблона
    const handleCreateTemplate = useCallback(
        async (name: string) => {
            if (!projectId) {
                return
            }
            setIsCreating(true)

            try {
                const preloaderUrl = await generatePreloaderUrl()

                const tpl = await createTemplateMutation.mutateAsync({
                    name,
                    settings: {
                        widthMm: canvasWidthMm,
                        heightMm: canvasHeightMm,
                        elements,
                    },
                    preloader: preloaderUrl,
                })
                await assignTemplateMutation.mutateAsync({
                    projectId: Number(projectId),
                    templateId: tpl.id,
                })
                dispatch(setTemplateId(tpl.id))
                dispatch(setTemplateName(name))
                dispatch(markAsSaved())
                setNameDialogOpen(false)
                enqueueSnackbar('Шаблон создан и назначен проекту', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar(
                    'Ошибка при создании шаблона: ' + (e instanceof Error ? e.message : e),
                    { variant: 'error' },
                )
            } finally {
                setIsCreating(false)
            }
        },
        [
            projectId,
            canvasWidthMm,
            canvasHeightMm,
            elements,
            generatePreloaderUrl,
            createTemplateMutation,
            assignTemplateMutation,
            dispatch,
            enqueueSnackbar,
        ],
    )

    // Выбор существующего шаблона
    const handleSelectTemplate = useCallback(
        async (template: ApiPrintTemplate) => {
            if (!projectId) {
                return
            }
            setIsSelectingTemplate(true)
            try {
                await assignTemplateMutation.mutateAsync({
                    projectId: Number(projectId),
                    templateId: template.id,
                })
                dispatch(setTemplateId(template.id))
                dispatch(setTemplateName(template.name))
                if (template.settings) {
                    dispatch(setElements(template.settings.elements || []))
                    if (template.settings.widthMm) {
                        dispatch(setCanvasWidth(template.settings.widthMm))
                    }
                    if (template.settings.heightMm) {
                        dispatch(setCanvasHeight(template.settings.heightMm))
                    }
                }
                dispatch(markAsSaved())
                setSelectTemplateOpen(false)
                enqueueSnackbar('Шаблон назначен проекту', { variant: 'success' })
            } catch (e) {
                enqueueSnackbar(
                    'Ошибка при выборе шаблона: ' + (e instanceof Error ? e.message : e),
                    { variant: 'error' },
                )
            } finally {
                setIsSelectingTemplate(false)
            }
        },
        [projectId, assignTemplateMutation, dispatch, enqueueSnackbar],
    )

    // Создание нового шаблона (сброс)
    const handleCreateNewTemplate = useCallback(async () => {
        if (!projectId) {
            return
        }
        setIsSelectingTemplate(true)
        try {
            // Удаляем привязку шаблона к проекту
            await deleteProjectTemplateMutation.mutateAsync(Number(projectId))
            // Сбрасываем редактор к дефолтным настройкам
            dispatch(resetEditor())
            setSelectTemplateOpen(false)
            enqueueSnackbar('Создан новый шаблон', { variant: 'success' })
        } catch (e) {
            enqueueSnackbar(
                'Ошибка при создании нового шаблона: ' + (e instanceof Error ? e.message : e),
                { variant: 'error' },
            )
        } finally {
            setIsSelectingTemplate(false)
        }
    }, [projectId, deleteProjectTemplateMutation, dispatch, enqueueSnackbar])

    // Кнопка сохранения активна если нет шаблона или есть несохранённые изменения
    const isSaveDisabled = templateId !== null && !isDirty

    return {
        // Данные
        projectId,
        canvas,
        elements,
        templateId,
        templateName,
        isDirty,
        canvasWidthMm,
        canvasHeightMm,
        zoom,
        sizeUnit,

        // Состояния диалогов
        nameDialogOpen,
        setNameDialogOpen,
        isCreating,
        selectTemplateOpen,
        setSelectTemplateOpen,
        isSelectingTemplate,

        // Флаги
        isSaveDisabled,

        // Методы
        handleSave,
        handleCreateTemplate,
        handleSelectTemplate,
        handleCreateNewTemplate,
    }
}
