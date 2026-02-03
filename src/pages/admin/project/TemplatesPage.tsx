import { useState, useEffect } from 'react'
import { Text, Button, DropdownMenu, TextInput, RadioGroup, Slider } from '@gravity-ui/uikit'
import { Plus, Printer, FolderOpen, FloppyDisk } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    setCanvasWidth,
    setCanvasHeight,
    setZoom,
    setSizeUnit,
    selectElement,
    setElements,
    setTemplateId,
    setTemplateName,
    TextFieldElement,
    addQrField,
    markAsSaved,
} from '@/store/slices/templateEditorSlice'
import { useParticipantsQuery } from '@/hooks/queries/useParticipantQueries'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import { previewBadgePdf, PrintTemplate, generateTemplatePreview } from '@/services/printService'
import { useProjectPrintTemplate } from '@/hooks/queries/useTemplateQueries'
import {
    useCreatePrintTemplateMutation,
    useUpdatePrintTemplateMutation,
    useAssignPrintTemplateMutation,
} from '@/hooks/mutations/useTemplateMutations'
import { uploadFile, getFileUrl } from '@/services/api/files'

import AddTextFieldModal from './components/AddTextFieldModal'
import AddQrModal from './components/AddQrModal'
import CanvasTextField from './components/CanvasTextField'
import CanvasQrField from './components/CanvasQrField'
import ElementToolbar from './components/ElementToolbar'
import ElementsList from './components/ElementsList'
import TemplateNameDialog from './components/TemplateNameDialog'
import SelectTemplateModal from './components/SelectTemplateModal'
import styles from './TemplatesPage.module.css'

// Конвертация мм <-> px при 300 DPI (стандарт для печати)
const MM_TO_PX_RATIO = 300 / 25.4 // ≈ 11.81 px на 1 мм
const mmToPx = (mm: number) => Math.round(mm * MM_TO_PX_RATIO)
const pxToMm = (px: number) => Math.round((px / MM_TO_PX_RATIO) * 10) / 10

const ProjectTemplatesPage = () => {
    const { id: projectId } = useParams()
    const dispatch = useAppDispatch()
    const { enqueueSnackbar } = useSnackbar()

    // Данные из стора
    const { canvas, elements, templateId, templateName, isDirty } =
        useAppSelector((state) => state.templateEditor)
    const { widthMm: canvasWidthMm, heightMm: canvasHeightMm, zoom, sizeUnit } = canvas
    // Состояние для диалога имени шаблона
    const [nameDialogOpen, setNameDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [selectTemplateOpen, setSelectTemplateOpen] = useState(false)
    const [isSelectingTemplate, setIsSelectingTemplate] = useState(false)
    // Получение шаблона через react-query
        const {
            data: projectTemplate,
        } = useProjectPrintTemplate(projectId ? Number(projectId) : undefined)

    // Синхронизация projectTemplate с редактором
    useEffect(() => {
            if (!projectTemplate?.template) return
            const tpl = projectTemplate.template
            dispatch(setTemplateId(tpl.id))
            dispatch(setTemplateName(tpl.name))
            if (tpl.settings) {
                dispatch(setElements(tpl.settings.elements || []))
                if (tpl.settings.widthMm) dispatch(setCanvasWidth(tpl.settings.widthMm))
                if (tpl.settings.heightMm) dispatch(setCanvasHeight(tpl.settings.heightMm))
            }
            // После загрузки шаблона сбрасываем флаг изменений
            dispatch(markAsSaved())
        }, [projectTemplate, dispatch])

    // Мутации
    const createTemplateMutation = useCreatePrintTemplateMutation()
    const updateTemplateMutation = useUpdatePrintTemplateMutation()
    const assignTemplateMutation = useAssignPrintTemplateMutation()

    // Запрос участников для пробной печати
    const { data: participantsData } = useParticipantsQuery(Number(projectId), {
        page: 1,
        limit: 50,
    })

    // Состояния модалок
    const [fieldModalOpen, setFieldModalOpen] = useState(false)
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const { data: schemeData } = useSchemeQuery(projectId || '')

    // Значения для отображения в зависимости от единиц
    const displayWidth = sizeUnit === 'mm' ? canvasWidthMm : mmToPx(canvasWidthMm)
    const displayHeight = sizeUnit === 'mm' ? canvasHeightMm : mmToPx(canvasHeightMm)

    const handleWidthChange = (value: string) => {
        const numValue = parseFloat(value) || 0
        if (sizeUnit === 'mm') {
            dispatch(setCanvasWidth(numValue))
        } else {
            dispatch(setCanvasWidth(pxToMm(numValue)))
        }
    }

    const handleHeightChange = (value: string) => {
        const numValue = parseFloat(value) || 0
        if (sizeUnit === 'mm') {
            dispatch(setCanvasHeight(numValue))
        } else {
            dispatch(setCanvasHeight(pxToMm(numValue)))
        }
    }

    // Размер холста на экране (с учётом масштаба)
    // Используем 96 DPI для отображения на экране
    const screenPxPerMm = 96 / 25.4 // ≈ 3.78
    const canvasDisplayWidth = canvasWidthMm * screenPxPerMm * (zoom / 100)
    const canvasDisplayHeight = canvasHeightMm * screenPxPerMm * (zoom / 100)

    // Фильтруем элементы по типу
    const textElements = elements.filter((el): el is TextFieldElement => el.type === 'text')
    const qrElements = elements.filter((el) => el.type === 'qr')

    // Клик по холсту - снять выделение
    const handleCanvasClick = () => {
        dispatch(selectElement(null))
    }

    // Пробная печать - выбираем случайного участника и открываем PDF
    const handleTestPrint = async () => {
        const participants = participantsData?.records || []

        if (participants.length === 0) {
            enqueueSnackbar('В проекте нет участников для пробной печати', { variant: 'warning' })
            return
        }

        if (elements.length === 0) {
            enqueueSnackbar('Добавьте хотя бы один элемент в шаблон', { variant: 'warning' })
            return
        }

        // Выбираем случайного участника
        const randomIndex = Math.floor(Math.random() * participants.length)
        const participant = participants[randomIndex]

        // Формируем шаблон и данные
        const template: PrintTemplate = {
            widthMm: canvasWidthMm,
            heightMm: canvasHeightMm,
            elements: elements,
        }

        try {
            await previewBadgePdf(template, participant.data)
        } catch (err) {
            console.error('Preview error:', err)
            enqueueSnackbar(
                `Ошибка при генерации PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
                { variant: 'error' }
            )
        }
    }

    // --- Генерация превью шаблона ---
    const generatePreloaderUrl = async (): Promise<string | undefined> => {
        try {
            if (elements.length === 0) return undefined
            
            // Генерируем превью из текущего шаблона
            const template: PrintTemplate = {
                widthMm: canvasWidthMm,
                heightMm: canvasHeightMm,
                elements,
            }
            
            // Пустые данные для превью (поля будут показаны как placeholders)
            const previewBlob = await generateTemplatePreview(template, {})
            
            // Загружаем на сервер
            const key = await uploadFile(previewBlob, `preloader_${projectId}_${Date.now()}.jpg`)
            
            // Возвращаем полный URL
            return getFileUrl(key)
        } catch (e) {
            console.error('Failed to generate preloader:', e)
            return undefined
        }
    }

    // --- Логика сохранения шаблона ---
    const handleSave = async () => {
        if (!projectId) return
        
        // Генерируем превью
        const preloaderUrl = await generatePreloaderUrl()
        
        // Если шаблон уже назначен проекту — обновляем
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
                    { variant: 'error' }
                )
            }
            return
        }
        // Если шаблон не назначен — показать диалог
        setNameDialogOpen(true)
    }

    // --- Сохранение нового шаблона после диалога ---
    const handleCreateTemplate = async (name: string) => {
        if (!projectId) return
        setIsCreating(true)
        
        try {
            // Генерируем превью
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
                { variant: 'error' }
            )
        } finally {
            setIsCreating(false)
        }
    }

    // --- Выбор существующего шаблона ---
    const handleSelectTemplate = async (template: import('@/services/api/templates').PrintTemplate) => {
        if (!projectId) return
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
                if (template.settings.widthMm) dispatch(setCanvasWidth(template.settings.widthMm))
                if (template.settings.heightMm) dispatch(setCanvasHeight(template.settings.heightMm))
            }
            dispatch(markAsSaved())
            setSelectTemplateOpen(false)
            enqueueSnackbar('Шаблон назначен проекту', { variant: 'success' })
        } catch (e) {
            enqueueSnackbar(
                'Ошибка при выборе шаблона: ' + (e instanceof Error ? e.message : e),
                { variant: 'error' }
            )
        } finally {
            setIsSelectingTemplate(false)
        }
    }

    // Кнопка сохранения активна если нет шаблона или есть несохранённые изменения
    const isSaveDisabled = templateId !== null && !isDirty

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Text variant="display-1">Шаблоны печати</Text>
                <div className={styles.headerActions}>
                    <Button view="outlined" size="l" onClick={handleTestPrint}>
                        <Button.Icon>
                            <Printer />
                        </Button.Icon>
                        Пробная печать
                    </Button>
                    <Button view="outlined" size="l" onClick={() => setSelectTemplateOpen(true)}>
                        <Button.Icon>
                            <FolderOpen />
                        </Button.Icon>
                        Выбрать шаблон
                    </Button>
                    <Button view="action" size="l" onClick={handleSave} disabled={isSaveDisabled}>
                        <Button.Icon>
                            <FloppyDisk />
                        </Button.Icon>
                        Сохранить
                    </Button>
                </div>
            </div>

            <TemplateNameDialog
                open={nameDialogOpen}
                onClose={() => setNameDialogOpen(false)}
                onSubmit={handleCreateTemplate}
                isLoading={isCreating}
            />

            <SelectTemplateModal
                open={selectTemplateOpen}
                onClose={() => setSelectTemplateOpen(false)}
                onSelect={handleSelectTemplate}
                isLoading={isSelectingTemplate}
                currentTemplateId={templateId ?? undefined}
            />

            <div className={styles.editor}>
                {/* Тулбар */}
                <div className={styles.toolbar}>
                    <ElementToolbar />
                </div>

                {/* Основная секция */}
                <div className={styles.main}>
                    {/* Холст */}
                    <div className={styles.canvasWrapper}>
                        <div className={styles.canvas}>
                            <div
                                className={styles.canvasArea}
                                style={{
                                    width: canvasDisplayWidth,
                                    height: canvasDisplayHeight,
                                }}
                                onClick={handleCanvasClick}
                            >
                                {textElements.length === 0 && qrElements.length === 0 ? (
                                    <Text variant="caption-2" color="secondary">
                                        {canvasWidthMm}×{canvasHeightMm} мм
                                    </Text>
                                ) : (
                                    <>
                                        {textElements.map((element) => (
                                            <CanvasTextField
                                                key={element.id}
                                                element={element}
                                                screenPxPerMm={screenPxPerMm}
                                                zoom={zoom}
                                                canvasWidthMm={canvasWidthMm}
                                            />
                                        ))}
                                        {qrElements.map((element) => (
                                            <CanvasQrField
                                                key={element.id}
                                                element={element as any}
                                                screenPxPerMm={screenPxPerMm}
                                                zoom={zoom}
                                                canvasWidthMm={canvasWidthMm}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Футер холста */}
                        <div className={styles.canvasFooter}>
                            <div className={styles.sizeControls}>
                                <Text variant="body-2">Размер:</Text>
                                <TextInput
                                    value={String(displayWidth)}
                                    onUpdate={handleWidthChange}
                                    size="s"
                                    className={styles.sizeInput}
                                />
                                <Text variant="body-2">×</Text>
                                <TextInput
                                    value={String(displayHeight)}
                                    onUpdate={handleHeightChange}
                                    size="s"
                                    className={styles.sizeInput}
                                />
                                <RadioGroup
                                    value={sizeUnit}
                                    onUpdate={(value) =>
                                        dispatch(setSizeUnit(value as 'mm' | 'px'))
                                    }
                                    size="m"
                                    options={[
                                        { value: 'mm', content: 'мм' },
                                        { value: 'px', content: 'px' },
                                    ]}
                                />
                            </div>

                            <div className={styles.zoomControls}>
                                <Text variant="body-2">Масштаб:</Text>
                                <Slider
                                    value={zoom}
                                    onUpdate={(value) => dispatch(setZoom(value))}
                                    min={50}
                                    max={150}
                                    step={10}
                                    className={styles.zoomSlider}
                                />
                                <Text variant="body-2" className={styles.zoomValue}>
                                    {zoom}%
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Сайдбар */}
                    <div className={styles.sidebar}>
                        <DropdownMenu
                            items={[
                                {
                                    text: 'Текстовое поле',
                                    action: () => setFieldModalOpen(true),
                                },
                                {
                                    text: 'QR-код',
                                    action: () => setQrModalOpen(true),
                                },
                            ]}
                            menuProps={{ style: { width: '200px' } }}
                            switcherWrapperClassName={styles.dropdownWrapper}
                            switcher={
                                <Button view="outlined-action" size="l" width="max">
                                    <Button.Icon>
                                        <Plus />
                                    </Button.Icon>
                                    Добавить
                                </Button>
                            }
                        />

                        <ElementsList />
                    </div>
                </div>
            </div>

            {/* Модалка добавления поля */}
            <AddTextFieldModal open={fieldModalOpen} onClose={() => setFieldModalOpen(false)} />

            <AddQrModal
                open={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                onAdd={(payload) => dispatch(addQrField(payload))}
                fields={schemeData?.fields || []}
            />
        </div>
    )
}

export default ProjectTemplatesPage
