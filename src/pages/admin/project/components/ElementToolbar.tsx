import { Select, Button, Checkbox, RadioGroup, TextInput } from '@gravity-ui/uikit'
import { TrashBin } from '@gravity-ui/icons'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    updateElement,
    removeElement,
    TextFieldElement,
    TextAlign,
    FontWeight,
    FontStyle,
    QrElement,
} from '@/store/slices/templateEditorSlice'
import { useCloudFontsQuery } from '@/hooks/queries/useCloudFontsQueries'
import { useWindowsFontsQuery } from '@/hooks/queries/useWindowsFontsQuery'
import { isElectron } from '@/hooks/useElectron'
import styles from './ElementToolbar.module.css'

const STATIC_FONT_OPTIONS = [
    { value: 'InterGF', content: 'InterGF' },
    { value: 'Roboto', content: 'Roboto' },
    { value: 'Segoe UI', content: 'Segoe UI' },
    { value: 'Times New Roman', content: 'Times New Roman' },
    { value: 'TikTok Sans', content: 'TikTok Sans' },
    { value: 'Montserrat', content: 'Montserrat' },
]

const ElementToolbar = () => {
    const dispatch = useAppDispatch()
    const { elements, selectedElementId } = useAppSelector((state) => state.templateEditor)
    const { data: cloudFontsData } = useCloudFontsQuery()
    const { data: windowsFonts = [] } = useWindowsFontsQuery()

    const FONT_OPTIONS = useMemo(() => {
        const cloud = (cloudFontsData?.fonts || []).map((f) => ({
            value: f.name,
            content: `☁ ${f.name}`,
        }))
        const local = isElectron()
            ? windowsFonts.map((name) => ({
                  value: `local::${name}`,
                  content: `${name} (Windows)`,
              }))
            : []
        return [...STATIC_FONT_OPTIONS, ...cloud, ...local]
    }, [cloudFontsData, windowsFonts])

    const selectedElement = elements.find((el) => el.id === selectedElementId) as
        | TextFieldElement
        | QrElement
        | undefined

    if (!selectedElement) {
        return (
            <div className={styles.toolbar}>
                <span className={styles.placeholder}>Выберите элемент для редактирования</span>
            </div>
        )
    }

    const handleFontChange = (values: string[]) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { fontFamily: values[0] } }))
    }

    const handleSizeChange = (value: string) => {
        const num = parseInt(value, 10)
        if (!isNaN(num) && num > 0) {
            dispatch(
                updateElement({
                    id: selectedElement.id,
                    updates: { fontSize: num },
                }),
            )
        }
    }

    const handleBoldChange = (checked: boolean) => {
        const fontWeight: FontWeight = checked ? 'bold' : 'normal'
        dispatch(updateElement({ id: selectedElement.id, updates: { fontWeight } }))
    }

    const handleItalicChange = (checked: boolean) => {
        const fontStyle: FontStyle = checked ? 'italic' : 'normal'
        dispatch(updateElement({ id: selectedElement.id, updates: { fontStyle } }))
    }

    const handleUppercaseChange = (checked: boolean) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { uppercase: checked } }))
    }

    const handleAlignChange = (value: string) => {
        dispatch(
            updateElement({ id: selectedElement.id, updates: { textAlign: value as TextAlign } }),
        )
    }

    const handleFullWidthChange = (checked: boolean) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { fullWidth: checked } }))
    }

    const handleAdaptiveChange = (checked: boolean) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { adaptive: checked } }))
    }

    const handleMultilineChange = (checked: boolean) => {
        // При включении многострочки отключаем адаптивный размер
        const textElement = selectedElement as TextFieldElement
        const updates: Partial<TextFieldElement> = { multiline: checked }
        if (checked) {
            updates.adaptive = false
            updates.maxLines = textElement.maxLines || 1
        }
        dispatch(updateElement({ id: selectedElement.id, updates }))
    }

    const handleMaxLinesChange = (value: string) => {
        const num = parseInt(value, 10)
        if (!isNaN(num) && num >= 1 && num <= 10) {
            dispatch(updateElement({ id: selectedElement.id, updates: { maxLines: num } }))
        }
    }

    const handleSeparatorToggle = (checked: boolean) => {
        const updates: Partial<TextFieldElement> = checked
            ? { separator: ' ', separatorIndex: 0, separatorExtra: false }
            : { separator: undefined, separatorIndex: undefined, separatorExtra: false }
        dispatch(updateElement({ id: selectedElement.id, updates }))
    }

    const handleSeparatorChange = (value: string) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { separator: value } }))
    }

    const handleSeparatorIndexChange = (value: string) => {
        const num = parseInt(value, 10)
        if (!isNaN(num) && num >= 0) {
            dispatch(updateElement({ id: selectedElement.id, updates: { separatorIndex: num } }))
        }
    }

    const handleSeparatorExtraChange = (checked: boolean) => {
        dispatch(updateElement({ id: selectedElement.id, updates: { separatorExtra: checked } }))
    }

    const handleDelete = () => {
        dispatch(removeElement(selectedElement.id))
    }

    if (selectedElement.type === 'qr') {
        const handleColorChange = (color: string, key: 'fgColor' | 'bgColor') => {
            dispatch(updateElement({ id: selectedElement.id, updates: { [key]: color } }))
        }
        const handleStyleChange = (
            value: string,
            key: 'moduleStyle' | 'eyeStyle' | 'eyeBorderStyle',
        ) => {
            dispatch(updateElement({ id: selectedElement.id, updates: { [key]: value } }))
        }
        const handlePrefixChange = (v: string) => {
            dispatch(updateElement({ id: selectedElement.id, updates: { prefix: v } }))
        }
        const handleCenterChange = (checked: boolean) => {
            dispatch(updateElement({ id: selectedElement.id, updates: { center: checked } }))
        }
        return (
            <div className={styles.toolbar}>
                <div className={styles.group}>
                    <span>Цвет:</span>
                    <input
                        type="color"
                        value={selectedElement.fgColor}
                        onChange={(e) => handleColorChange(e.target.value, 'fgColor')}
                    />
                    <input
                        type="color"
                        value={selectedElement.bgColor}
                        onChange={(e) => handleColorChange(e.target.value, 'bgColor')}
                    />
                </div>
                <div className={styles.group}>
                    <span>Стиль:</span>
                    <Select
                        value={[selectedElement.moduleStyle]}
                        onUpdate={(v) => handleStyleChange(v[0], 'moduleStyle')}
                        options={[
                            { value: 'squares', content: 'Квадраты' },
                            { value: 'dots', content: 'Точки' },
                            { value: 'fluid', content: 'Fluid' },
                        ]}
                        size="s"
                        width={90}
                    />
                    <Select
                        value={[selectedElement.eyeStyle]}
                        onUpdate={(v) => handleStyleChange(v[0], 'eyeStyle')}
                        options={[
                            { value: 'squares', content: 'Глаз: квадраты' },
                            { value: 'dots', content: 'Глаз: точки' },
                        ]}
                        size="s"
                        width={90}
                    />
                    <Select
                        value={[selectedElement.eyeBorderStyle]}
                        onUpdate={(v) => handleStyleChange(v[0], 'eyeBorderStyle')}
                        options={[
                            { value: 'squares', content: 'Граница: квадраты' },
                            { value: 'round', content: 'Граница: круглая' },
                        ]}
                        size="s"
                        width={110}
                    />
                </div>
                <div className={styles.group}>
                    <span>Префикс:</span>
                    <input
                        type="text"
                        value={selectedElement.prefix || ''}
                        onChange={(e) => handlePrefixChange(e.target.value)}
                        style={{ width: 80 }}
                    />
                </div>
                <div className={styles.group}>
                    <Checkbox
                        checked={selectedElement.center}
                        onUpdate={handleCenterChange}
                        size="m"
                    >
                        Центрировать
                    </Checkbox>
                </div>
                <div className={styles.spacer} />
                <Button view="flat-danger" size="s" onClick={handleDelete}>
                    <Button.Icon>
                        <TrashBin />
                    </Button.Icon>
                </Button>
            </div>
        )
    }

    return (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <Select
                    value={[selectedElement.fontFamily]}
                    onUpdate={handleFontChange}
                    options={FONT_OPTIONS}
                    size="s"
                    width={140}
                />
                <TextInput
                    value={String(selectedElement.fontSize)}
                    onUpdate={handleSizeChange}
                    type="number"
                    size="s"
                    className={styles.fontSizeInput}
                />
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <Checkbox
                    checked={selectedElement.fontWeight === 'bold'}
                    onUpdate={handleBoldChange}
                    size="m"
                >
                    <span className={styles.bold}>Ж</span>
                </Checkbox>
                <Checkbox
                    checked={selectedElement.fontStyle === 'italic'}
                    onUpdate={handleItalicChange}
                    size="m"
                >
                    <span className={styles.italic}>К</span>
                </Checkbox>
                <Checkbox
                    checked={selectedElement.uppercase || false}
                    onUpdate={handleUppercaseChange}
                    size="m"
                >
                    <span className={styles.uppercase}>АА</span>
                </Checkbox>
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <RadioGroup
                    value={selectedElement.textAlign}
                    onUpdate={handleAlignChange}
                    size="m"
                    options={[
                        { value: 'left', content: '◧' },
                        { value: 'center', content: '◫' },
                        { value: 'right', content: '◨' },
                    ]}
                />
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <Checkbox
                    checked={selectedElement.fullWidth}
                    onUpdate={handleFullWidthChange}
                    size="m"
                >
                    На всю ширину
                </Checkbox>
                <Checkbox
                    checked={selectedElement.adaptive}
                    onUpdate={handleAdaptiveChange}
                    size="m"
                    disabled={selectedElement.multiline}
                >
                    Авто-размер
                </Checkbox>
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <Checkbox
                    checked={selectedElement.multiline || false}
                    onUpdate={handleMultilineChange}
                    size="m"
                >
                    Многострочный
                </Checkbox>
                {selectedElement.multiline && (
                    <TextInput
                        value={String(selectedElement.maxLines || 1)}
                        onUpdate={handleMaxLinesChange}
                        type="number"
                        size="s"
                        className={styles.maxLinesInput}
                    />
                )}
            </div>

            <div className={styles.divider} />

            <div className={styles.group}>
                <Checkbox
                    checked={!!selectedElement.separator}
                    onUpdate={handleSeparatorToggle}
                    size="m"
                >
                    Сепаратор
                </Checkbox>
                {selectedElement.separator !== undefined && (
                    <>
                        <TextInput
                            value={selectedElement.separator}
                            onUpdate={handleSeparatorChange}
                            size="s"
                            placeholder="пробел"
                            className={styles.separatorInput}
                        />
                        <TextInput
                            value={String(selectedElement.separatorIndex ?? 0)}
                            onUpdate={handleSeparatorIndexChange}
                            type="number"
                            size="s"
                            className={styles.separatorIndexInput}
                        />
                        <Checkbox
                            checked={selectedElement.separatorExtra || false}
                            onUpdate={handleSeparatorExtraChange}
                            size="m"
                        >
                            +
                        </Checkbox>
                    </>
                )}
            </div>

            <div className={styles.spacer} />

            <Button view="flat-danger" size="s" onClick={handleDelete}>
                <Button.Icon>
                    <TrashBin />
                </Button.Icon>
            </Button>
        </div>
    )
}

export default ElementToolbar
