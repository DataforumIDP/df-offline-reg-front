import { useState, useEffect } from 'react'
import { Text, TextInput, Button, RadioGroup, Alert, Select } from '@gravity-ui/uikit'
import { Printer, CircleCheck, CircleXmark } from '@gravity-ui/icons'
import { useElectronPrint } from '@/hooks/useElectron'
import styles from './PrintSettings.module.css'

export const PrintSettings = () => {
    const electron = useElectronPrint()
    const [selectedPrinter, setSelectedPrinter] = useState('')
    const [labelWidth, setLabelWidth] = useState('70')
    const [labelHeight, setLabelHeight] = useState('50')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (electron.settings) {
            setSelectedPrinter(electron.settings.printer || '')
            setLabelWidth(String(electron.settings.labelWidth || 70))
            setLabelHeight(String(electron.settings.labelHeight || 50))
            setOrientation(electron.settings.orientation || 'landscape')
        }
    }, [electron.settings])

    const handleSave = async () => {
        setSaving(true)
        try {
            await electron.updateSettings({
                printer: selectedPrinter,
                labelWidth: parseFloat(labelWidth) || 70,
                labelHeight: parseFloat(labelHeight) || 50,
                orientation,
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } finally {
            setSaving(false)
        }
    }

    const printerOptions = electron.printers.map((p) => ({
        value: p.name,
        content: `${p.name}${p.isDefault ? ' (по умолчанию)' : ''}`,
    }))

    return (
        <div className={styles.container}>
            {/* Ghostscript status */}
            <div className={styles.statusBar}>
                {electron.ghostscript?.installed ? (
                    <>
                        <CircleCheck className={styles.statusIconOk} />
                        <Text variant="body-2" color="secondary">
                            Ghostscript установлен
                        </Text>
                    </>
                ) : (
                    <>
                        <CircleXmark className={styles.statusIconError} />
                        <Text variant="body-2" color="danger">
                            Ghostscript не найден — печать недоступна
                        </Text>
                    </>
                )}
            </div>

            {/* Printer selection */}
            <div className={styles.section}>
                <Text variant="subheader-2" className={styles.sectionTitle}>
                    <Printer /> Принтер
                </Text>
                <Select
                    value={selectedPrinter ? [selectedPrinter] : []}
                    onUpdate={(val) => setSelectedPrinter(val[0] || '')}
                    options={printerOptions}
                    placeholder="Выберите принтер..."
                    width="max"
                    size="l"
                    filterable
                    disabled={electron.loading}
                />
            </div>

            {/* Label size */}
            <div className={styles.section}>
                <Text variant="subheader-2" className={styles.sectionTitle}>
                    Размер этикетки (мм)
                </Text>
                <div className={styles.sizeFields}>
                    <TextInput
                        value={labelWidth}
                        onUpdate={setLabelWidth}
                        placeholder="70"
                        type="number"
                        size="l"
                        label="Ширина"
                    />
                    <Text variant="body-2" color="secondary">
                        ×
                    </Text>
                    <TextInput
                        value={labelHeight}
                        onUpdate={setLabelHeight}
                        placeholder="50"
                        type="number"
                        size="l"
                        label="Высота"
                    />
                </div>
            </div>

            {/* Orientation */}
            <div className={styles.section}>
                <Text variant="subheader-2" className={styles.sectionTitle}>
                    Ориентация
                </Text>
                <RadioGroup
                    value={orientation}
                    onUpdate={(val) => setOrientation(val as 'portrait' | 'landscape')}
                    options={[
                        { value: 'landscape', content: 'Альбомная (горизонтальная)' },
                        { value: 'portrait', content: 'Книжная (вертикальная)' },
                    ]}
                    direction="vertical"
                    size="l"
                />
            </div>

            {/* Save button */}
            <Button
                view="action"
                size="l"
                onClick={handleSave}
                loading={saving}
                disabled={!selectedPrinter}
            >
                Сохранить настройки
            </Button>

            {saved && <Alert theme="success" message="Настройки печати сохранены" />}
        </div>
    )
}

