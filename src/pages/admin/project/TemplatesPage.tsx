import { useState } from 'react'
import { Text, Button, DropdownMenu, TextInput, RadioGroup, Slider } from '@gravity-ui/uikit'
import { Plus, Printer, FolderOpen, FloppyDisk } from '@gravity-ui/icons'
import { useAppDispatch } from '@/store/hooks'
import { selectElement, addQrField, TextFieldElement } from '@/store/slices/templateEditorSlice'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'

import { useTemplateEditor, useTestPrint, useCanvasControls } from './hooks'
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, SCREEN_PX_PER_MM } from './constants/templateEditor'

import AddTextFieldModal from './components/AddTextFieldModal'
import AddQrModal from './components/AddQrModal'
import CanvasTextField from './components/CanvasTextField'
import CanvasQrField from './components/CanvasQrField'
import ElementToolbar from './components/ElementToolbar'
import ElementsList from './components/ElementsList'
import TemplateNameDialog from './components/TemplateNameDialog'
import SelectTemplateModal from './components/SelectTemplateModal'
import styles from './TemplatesPage.module.css'

const ProjectTemplatesPage = () => {
    const dispatch = useAppDispatch()

    // Хуки для работы с шаблоном
    const {
        projectId,
        elements,
        templateId,
        nameDialogOpen,
        setNameDialogOpen,
        isCreating,
        selectTemplateOpen,
        setSelectTemplateOpen,
        isSelectingTemplate,
        isSaveDisabled,
        handleSave,
        handleCreateTemplate,
        handleSelectTemplate,
        handleCreateNewTemplate,
    } = useTemplateEditor()

    // Хук для пробной печати
    const { handleTestPrint } = useTestPrint(projectId ? Number(projectId) : undefined)

    // Хук для управления холстом
    const {
        canvasWidthMm,
        canvasHeightMm,
        zoom,
        sizeUnit,
        displayWidth,
        displayHeight,
        canvasDisplayWidth,
        canvasDisplayHeight,
        handleWidthChange,
        handleHeightChange,
        handleZoomChange,
        handleSizeUnitChange,
    } = useCanvasControls()

    // Состояния модалок
    const [fieldModalOpen, setFieldModalOpen] = useState(false)
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const { data: schemeData } = useSchemeQuery(projectId || '')

    // Фильтруем элементы по типу
    const textElements = elements.filter((el): el is TextFieldElement => el.type === 'text')
    const qrElements = elements.filter((el) => el.type === 'qr')

    // Клик по холсту - снять выделение
    const handleCanvasClick = () => {
        dispatch(selectElement(null))
    }

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
                onCreateNew={handleCreateNewTemplate}
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
                                                screenPxPerMm={SCREEN_PX_PER_MM}
                                                zoom={zoom}
                                                canvasWidthMm={canvasWidthMm}
                                            />
                                        ))}
                                        {qrElements.map((element) => (
                                            <CanvasQrField
                                                key={element.id}
                                                element={element as any}
                                                screenPxPerMm={SCREEN_PX_PER_MM}
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
                                    onUpdate={(value) => handleSizeUnitChange(value as 'mm' | 'px')}
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
                                    onUpdate={handleZoomChange}
                                    min={ZOOM_MIN}
                                    max={ZOOM_MAX}
                                    step={ZOOM_STEP}
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
