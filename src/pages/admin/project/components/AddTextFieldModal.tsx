import { useState } from 'react'
import { Dialog, Select, Text, TextInput, Checkbox, RadioGroup } from '@gravity-ui/uikit'
import { useParams } from 'react-router-dom'
import { useSchemeQuery, SchemeField } from '@/hooks/queries/useSchemeQueries'
import { useAppDispatch } from '@/store/hooks'
import { addTextField, TextAlign, FontWeight, FontStyle } from '@/store/slices/templateEditorSlice'
import styles from './AddTextFieldModal.module.css'

interface AddTextFieldModalProps {
    open: boolean
    onClose: () => void
}

const FONT_OPTIONS = [
    // { value: 'Arial', content: 'Arial' },
    { value: 'InterGF', content: 'InterGF' },
    { value: 'Segoe UI', content: 'Segoe UI' },
    { value: 'Times New Roman', content: 'Times New Roman' },
    { value: 'Roboto', content: 'Roboto' },
    { value: 'TikTok Sans', content: 'TikTok Sans' },
    { value: 'Montserrat', content: 'Montserrat' },
    // { value: 'Open Sans', content: 'Open Sans' },
    // { value: 'PT Sans', content: 'PT Sans' },
    // { value: 'Georgia', content: 'Georgia' },
    // { value: 'Verdana', content: 'Verdana' },
    // { value: 'Tahoma', content: 'Tahoma' },
]

const FONT_SIZE_OPTIONS = [
    { value: '8', content: '8' },
    { value: '10', content: '10' },
    { value: '12', content: '12' },
    { value: '14', content: '14' },
    { value: '16', content: '16' },
    { value: '18', content: '18' },
    { value: '20', content: '20' },
    { value: '24', content: '24' },
    { value: '28', content: '28' },
    { value: '32', content: '32' },
    { value: '36', content: '36' },
    { value: '40', content: '40' },
    { value: '48', content: '48' },
    { value: '56', content: '56' },
    { value: '64', content: '64' },
    { value: '72', content: '72' },
    { value: '80', content: '80' },
    { value: '96', content: '96' },
]

const AddTextFieldModal = ({ open, onClose }: AddTextFieldModalProps) => {
    const { id: projectId } = useParams()
    const dispatch = useAppDispatch()
    const { data: scheme } = useSchemeQuery(projectId || '')

    // Состояние формы
    const [selectedFieldKey, setSelectedFieldKey] = useState<string | undefined>(undefined)
    const [fontFamily, setFontFamily] = useState('Roboto')
    const [fontSize, setFontSize] = useState('18')
    const [fontWeight, setFontWeight] = useState<FontWeight>('normal')
    const [fontStyle, setFontStyle] = useState<FontStyle>('normal')
    const [uppercase, setUppercase] = useState(false)
    const [textAlign, setTextAlign] = useState<TextAlign>('center')
    const [fullWidth, setFullWidth] = useState(true)
    const [adaptive, setAdaptive] = useState(false)
    const [width, setWidth] = useState('40')
    const [multiline, setMultiline] = useState(false)
    const [maxLines, setMaxLines] = useState(1)
    // Сепаратор для разбиения поля (например, ФИО по пробелу)
    const [useSeparator, setUseSeparator] = useState(false)
    const [separator, setSeparator] = useState(' ')
    const [separatorIndex, setSeparatorIndex] = useState(0)
    const [separatorExtra, setSeparatorExtra] = useState(false)

    // Сброс формы при открытии
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onClose()
        } else {
            // Сброс на значения по умолчанию
            setSelectedFieldKey(undefined)
            setFontFamily('Roboto')
            setFontSize('18')
            setFontWeight('normal')
            setFontStyle('normal')
            setUppercase(false)
            setTextAlign('center')
            setFullWidth(true)
            setAdaptive(false)
            setWidth('40')
            setMultiline(false)
            setMaxLines(1)
            setUseSeparator(false)
            setSeparator(' ')
            setSeparatorIndex(0)
            setSeparatorExtra(false)
        }
    }

    const handleAdd = () => {
        dispatch(
            addTextField({
                fieldKey: selectedFieldKey,
                fontFamily,
                fontSize: parseInt(fontSize, 10),
                fontWeight,
                fontStyle,
                uppercase,
                textAlign,
                fullWidth,
                adaptive: multiline ? false : adaptive, // При многострочном режиме адаптив отключается
                width: parseFloat(width),
                multiline,
                maxLines: multiline ? maxLines : undefined,
                separator: useSeparator ? separator : undefined,
                separatorIndex: useSeparator ? separatorIndex : undefined,
                separatorExtra: useSeparator ? separatorExtra : false,
            }),
        )
        onClose()
    }

    // Получаем список полей для выбора (исключаем изображения)
    const fieldOptions = (scheme?.fields || [])
        .filter((field: SchemeField) => field.config.type !== 'img')
        .map((field: SchemeField) => ({
            value: field.key,
            content: field.label,
        }))

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} onClose={onClose}>
            <Dialog.Header caption="Добавить текстовое поле" />
            <Dialog.Body>
                <div className={styles.form}>
                    {/* Выбор ресурса */}
                    <div className={styles.field}>
                        <Text variant="body-2">Ресурс (поле схемы)</Text>
                        <Select
                            value={selectedFieldKey ? [selectedFieldKey] : []}
                            onUpdate={(values) => setSelectedFieldKey(values[0])}
                            options={fieldOptions}
                            placeholder="Выберите поле"
                            width="max"
                        />
                    </div>

                    {/* Шрифт */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <Text variant="body-2">Шрифт</Text>
                            <Select
                                value={[fontFamily]}
                                onUpdate={(values) => setFontFamily(values[0])}
                                options={FONT_OPTIONS}
                                width="max"
                            />
                        </div>
                        <div className={styles.field}>
                            <Text variant="body-2">Размер (pt)</Text>
                            <Select
                                value={[fontSize]}
                                onUpdate={(values) => setFontSize(values[0])}
                                options={FONT_SIZE_OPTIONS}
                                width="max"
                            />
                        </div>
                    </div>

                    {/* Стиль текста */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <Checkbox
                                checked={fontWeight === 'bold'}
                                onUpdate={(checked) => setFontWeight(checked ? 'bold' : 'normal')}
                            >
                                Жирный
                            </Checkbox>
                        </div>
                        <div className={styles.field}>
                            <Checkbox
                                checked={fontStyle === 'italic'}
                                onUpdate={(checked) => setFontStyle(checked ? 'italic' : 'normal')}
                            >
                                Курсив
                            </Checkbox>
                        </div>
                        <div className={styles.field}>
                            <Checkbox checked={uppercase} onUpdate={setUppercase}>
                                КАПС
                            </Checkbox>
                        </div>
                    </div>

                    {/* Выравнивание */}
                    <div className={styles.field}>
                        <Text variant="body-2">Выравнивание текста</Text>
                        <RadioGroup
                            value={textAlign}
                            onUpdate={(value) => setTextAlign(value as TextAlign)}
                            options={[
                                { value: 'left', content: 'Слева' },
                                { value: 'center', content: 'По центру' },
                                { value: 'right', content: 'Справа' },
                            ]}
                        />
                    </div>

                    {/* Ширина */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <Checkbox checked={fullWidth} onUpdate={setFullWidth}>
                                На всю ширину
                            </Checkbox>
                        </div>
                        {!fullWidth && (
                            <div className={styles.field}>
                                <Text variant="body-2">Ширина (мм)</Text>
                                <TextInput value={width} onUpdate={setWidth} type="number" />
                            </div>
                        )}
                    </div>

                    {/* Адаптивный размер */}
                    <div className={styles.field}>
                        <Checkbox checked={adaptive} onUpdate={setAdaptive} disabled={multiline}>
                            Адаптивный размер (уменьшать шрифт если не помещается)
                        </Checkbox>
                    </div>

                    {/* Многострочный режим */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <Checkbox
                                checked={multiline}
                                onUpdate={(checked) => {
                                    setMultiline(checked)
                                    if (checked) {
                                        setAdaptive(false) // Отключаем адаптивный размер при включении многострочки
                                    }
                                }}
                            >
                                Многострочный текст
                            </Checkbox>
                        </div>
                        {multiline && (
                            <div className={styles.field}>
                                <Text variant="body-2">Максимум строк</Text>
                                <TextInput
                                    value={String(maxLines)}
                                    onUpdate={(value) => {
                                        const num = parseInt(value, 10)
                                        if (!isNaN(num) && num >= 1 && num <= 10) {
                                            setMaxLines(num)
                                        }
                                    }}
                                    type="number"
                                />
                            </div>
                        )}
                    </div>

                    {/* Разбиение по сепаратору */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <Checkbox
                                checked={useSeparator}
                                onUpdate={setUseSeparator}
                            >
                                Разбить по сепаратору
                            </Checkbox>
                        </div>
                    </div>
                    {useSeparator && (
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <Text variant="body-2">Сепаратор</Text>
                                <TextInput
                                    value={separator}
                                    onUpdate={setSeparator}
                                    placeholder="пробел"
                                />
                            </div>
                            <div className={styles.field}>
                                <Text variant="body-2">Индекс части</Text>
                                <TextInput
                                    value={String(separatorIndex)}
                                    onUpdate={(value) => {
                                        const num = parseInt(value, 10)
                                        if (!isNaN(num) && num >= 0) {
                                            setSeparatorIndex(num)
                                        }
                                    }}
                                    type="number"
                                />
                            </div>
                            <div className={styles.field}>
                                <Checkbox
                                    checked={separatorExtra}
                                    onUpdate={setSeparatorExtra}
                                >
                                    + остаток
                                </Checkbox>
                            </div>
                        </div>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onClose}
                onClickButtonApply={handleAdd}
                textButtonApply="Добавить"
                textButtonCancel="Отмена"
            />
        </Dialog>
    )
}

export default AddTextFieldModal
