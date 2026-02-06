import {
    Dialog,
    Text,
    TextInput,
    Select,
    TabProvider,
    TabList,
    Tab,
    TabPanel,
    Checkbox,
} from '@gravity-ui/uikit'
import { useState, useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
// --- QrPreview компонент для canvas preview через qr-code-styling ---
type QrPreviewProps = {
    value: string
    ecLevel: 'L' | 'M' | 'Q' | 'H'
    fgColor: string
    bgColor: string
    qrStyle: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
    eyeStyle: 'square' | 'dot' | 'extra-rounded' | 'rounded' | 'classy' | 'classy-rounded'
    cornerDotStyle: 'dot' | 'square' | 'extra-rounded' | 'rounded' | 'classy' | 'classy-rounded'
    logoUrl: string
}
const QrPreview = ({
    value,
    ecLevel,
    fgColor,
    bgColor,
    qrStyle,
    eyeStyle,
    cornerDotStyle,
    logoUrl,
}: QrPreviewProps) => {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!ref.current) {
            return
        }
        ref.current.innerHTML = ''
        const qr = new QRCodeStyling({
            width: 200,
            height: 200,
            type: 'canvas',
            data: value || ' ',
            image: logoUrl || undefined,
            qrOptions: {
                errorCorrectionLevel: ecLevel as 'L' | 'M' | 'Q' | 'H',
            },
            dotsOptions: {
                color: fgColor,
                type: qrStyle as
                    | 'square'
                    | 'dots'
                    | 'rounded'
                    | 'classy'
                    | 'classy-rounded'
                    | 'extra-rounded',
            },
            backgroundOptions: {
                color: bgColor,
            },
            cornersSquareOptions: {
                color: fgColor,
                type: eyeStyle as
                    | 'square'
                    | 'dot'
                    | 'extra-rounded'
                    | 'rounded'
                    | 'classy'
                    | 'classy-rounded',
            },
            cornersDotOptions: {
                color: fgColor,
                type: cornerDotStyle as
                    | 'dot'
                    | 'square'
                    | 'extra-rounded'
                    | 'rounded'
                    | 'classy'
                    | 'classy-rounded',
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 0,
            },
        })
        qr.append(ref.current)
    }, [value, ecLevel, fgColor, bgColor, qrStyle, eyeStyle, cornerDotStyle, logoUrl])
    return <div ref={ref} />
}
import styles from './AddQrModal.module.css'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'

interface AddQrModalProps {
    open: boolean
    onClose: () => void
    onAdd?: (payload: Partial<any>) => void
    fields?: SchemeField[]
}

const DEFAULT_VALUE = ''
const DEFAULT_EC = 'M'
const DEFAULT_FG = '#000000'
const DEFAULT_BG = '#ffffff'
const DEFAULT_QR_STYLE = 'square'

const AddQrModal = ({ open, onClose, onAdd, fields = [] }: AddQrModalProps) => {
    const [resourceType, setResourceType] = useState<'field' | 'fixed'>('fixed')
    const [fieldKey, setFieldKey] = useState<string | undefined>(undefined)
    const [fixedValue, setFixedValue] = useState<string>(DEFAULT_VALUE)
    const [prefix, setPrefix] = useState<string | undefined>(undefined)
    const [ecLevel, setEcLevel] = useState<string>(DEFAULT_EC)
    const [fgColor, setFgColor] = useState<string>(DEFAULT_FG)
    const [bgColor, setBgColor] = useState<string>(DEFAULT_BG)
    const [qrStyle, setQrStyle] = useState<string>(DEFAULT_QR_STYLE)
    const [eyeStyle, setEyeStyle] = useState<string>('square')
    const [cornerDotStyle, setCornerDotStyle] = useState<string>('dot')
    const [logoUrl, setLogoUrl] = useState<string>('')
    const [isQrCentered, setIsQrCentered] = useState<boolean>(true)

    useEffect(() => {
        if (!open) {
            return
        }
        // reset defaults on open
        setResourceType('field')
        setFieldKey(fields.length ? fields[0].key : undefined)
        setFixedValue(DEFAULT_VALUE)
        setPrefix(undefined)
        setEcLevel(DEFAULT_EC)
        setFgColor(DEFAULT_FG)
        setBgColor(DEFAULT_BG)
        setQrStyle('square')
        setEyeStyle('square')
        setCornerDotStyle('dot')
        setLogoUrl('')
        setIsQrCentered(true)
    }, [open, fields])
    const handleAdd = () => {
        // Размер в мм (по аналогии с текстовым полем)
        const widthMm = 20 // фиксированное значение по умолчанию, можно добавить инпут если нужно
        const payload: any = {
            resourceType,
            prefix: prefix || undefined,
            center: isQrCentered,
            fgColor,
            bgColor,
            moduleStyle: qrStyle,
            eyeStyle,
            cornerDotStyle,
            logoUrl: logoUrl || undefined,
            ecLevel,
            width: widthMm,
            x: 0,
            y: 10,
        }
        if (resourceType === 'field') {
            payload.fieldKey = fieldKey
        } else {
            payload.fixedValue = fixedValue
        }
        if (onAdd) {
            onAdd(payload)
        }
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()} onClose={onClose}>
            <Dialog.Header caption="Добавить QR-код" />
            <Dialog.Body>
                <div className={styles.form} style={{ maxWidth: 720 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div className={styles.leftColumn}>
                            <TabProvider
                                value={resourceType}
                                onUpdate={(v) => setResourceType(v as 'field' | 'fixed')}
                            >
                                <TabList>
                                    <Tab value="field">Поле схемы</Tab>
                                    <Tab value="fixed">Фиксированное значение</Tab>
                                </TabList>
                                <div>
                                    <TabPanel value="field">
                                        <div className={styles.field}>
                                            <Text variant="body-2">Поле схемы</Text>
                                            <Select
                                                value={[fieldKey || '']}
                                                onUpdate={(v) => v.length && setFieldKey(v[0])}
                                                options={fields.map((f) => ({
                                                    value: f.key,
                                                    content: f.label,
                                                }))}
                                            />
                                        </div>
                                    </TabPanel>
                                    <TabPanel value="fixed">
                                        <div className={styles.field}>
                                            <Text variant="body-2">Данные (URL или текст)</Text>
                                            <TextInput
                                                value={fixedValue}
                                                onUpdate={setFixedValue}
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </TabPanel>
                                </div>
                            </TabProvider>

                            {/* Стиль текста */}
                            <div className={styles.row}>
                                <div style={{ flex: 1 }} className={styles.field}>
                                    <Text variant="body-2">Префикс (опционально)</Text>
                                    <TextInput
                                        value={prefix || ''}
                                        onUpdate={(v) => setPrefix(v || undefined)}
                                        placeholder="code_"
                                    />
                                </div>
                                <div style={{ flex: 1 }} className={styles.field}>
                                    <Text variant="body-2">Уровень коррекции</Text>
                                    <Select
                                        value={[ecLevel]}
                                        onUpdate={(v) => v.length && setEcLevel(v[0])}
                                        options={[
                                            { value: 'L', content: 'L (низкий)' },
                                            { value: 'M', content: 'M (средний)' },
                                            { value: 'Q', content: 'Q (высокий)' },
                                            { value: 'H', content: 'H (макс.)' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <div className={styles.field}>
                                    <Text variant="body-2">Цвет точек</Text>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            style={{
                                                width: 40,
                                                height: 32,
                                                border: 'none',
                                                padding: 0,
                                            }}
                                        />
                                        <TextInput
                                            value={fgColor}
                                            onUpdate={setFgColor}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <Text variant="body-2">Цвет фона</Text>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            style={{
                                                width: 40,
                                                height: 32,
                                                border: 'none',
                                                padding: 0,
                                            }}
                                        />
                                        <TextInput
                                            value={bgColor}
                                            onUpdate={setBgColor}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <Text variant="body-2">Стиль точек QR</Text>
                                <Select
                                    value={[qrStyle]}
                                    onUpdate={(v) => v.length && setQrStyle(v[0])}
                                    options={[
                                        { value: 'square', content: 'Квадраты' },
                                        { value: 'dots', content: 'Точки' },
                                        { value: 'rounded', content: 'Скруглённые' },
                                        { value: 'classy', content: 'Classy' },
                                        { value: 'classy-rounded', content: 'Classy Rounded' },
                                        { value: 'extra-rounded', content: 'Extra Rounded' },
                                    ]}
                                />
                            </div>
                            <div className={styles.field}>
                                <Text variant="body-2">Стиль квадратов в углах</Text>
                                <Select
                                    value={[eyeStyle]}
                                    onUpdate={(v) => v.length && setEyeStyle(v[0])}
                                    options={[
                                        { value: 'square', content: 'Квадраты' },
                                        { value: 'dot', content: 'Точка' },
                                        { value: 'extra-rounded', content: 'Extra Rounded' },
                                        { value: 'rounded', content: 'Скруглённые' },
                                        { value: 'classy', content: 'Classy' },
                                        { value: 'classy-rounded', content: 'Classy Rounded' },
                                    ]}
                                />
                            </div>
                            <div className={styles.field}>
                                <Text variant="body-2">Стиль точек в углах</Text>
                                <Select
                                    value={[cornerDotStyle]}
                                    onUpdate={(v) => v.length && setCornerDotStyle(v[0])}
                                    options={[
                                        { value: 'dot', content: 'Точка' },
                                        { value: 'square', content: 'Квадрат' },
                                        { value: 'extra-rounded', content: 'Extra Rounded' },
                                        { value: 'rounded', content: 'Скруглённые' },
                                        { value: 'classy', content: 'Classy' },
                                        { value: 'classy-rounded', content: 'Classy Rounded' },
                                    ]}
                                />
                            </div>
                            <div className={styles.field}>
                                <Text variant="body-2">Логотип (URL, опционально)</Text>
                                <TextInput
                                    value={logoUrl}
                                    onUpdate={setLogoUrl}
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>

                            {/* Удалён устаревший блок глаз/границы, всё настраивается выше */}
                            <div className={styles.field}>
                                <Checkbox checked={isQrCentered} onUpdate={setIsQrCentered}>
                                    Центрировать
                                </Checkbox>
                            </div>
                        </div>

                        <div className={styles.previewColumn}>
                            <div className={styles.previewBox}>
                                <QrPreview
                                    value={
                                        resourceType === 'field'
                                            ? (prefix || '') + (fieldKey || '')
                                            : fixedValue
                                    }
                                    ecLevel={ecLevel as 'L' | 'M' | 'Q' | 'H'}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    qrStyle={
                                        qrStyle as
                                            | 'square'
                                            | 'dots'
                                            | 'rounded'
                                            | 'classy'
                                            | 'classy-rounded'
                                            | 'extra-rounded'
                                    }
                                    eyeStyle={
                                        eyeStyle as
                                            | 'square'
                                            | 'dot'
                                            | 'extra-rounded'
                                            | 'rounded'
                                            | 'classy'
                                            | 'classy-rounded'
                                    }
                                    cornerDotStyle={
                                        cornerDotStyle as
                                            | 'dot'
                                            | 'square'
                                            | 'extra-rounded'
                                            | 'rounded'
                                            | 'classy'
                                            | 'classy-rounded'
                                    }
                                    logoUrl={logoUrl}
                                />
                            </div>
                            <Text className={styles.previewCaption} variant="caption-2">
                                Предпросмотр
                            </Text>
                        </div>
                    </div>
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

export default AddQrModal
