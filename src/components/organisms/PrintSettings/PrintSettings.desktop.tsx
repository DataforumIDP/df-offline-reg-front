import { useState, useEffect } from 'react'
import { Text, TextInput, Button, RadioGroup, Alert, Select, Spin } from '@gravity-ui/uikit'
import { Printer, CircleCheck, CircleXmark } from '@gravity-ui/icons'
import { useElectronPrint } from '@/hooks/useElectron'
import { checkFontsAvailability, getFontCheckList, FontCheckResult } from '@/services/printService'
import { useCloudFontsQuery } from '@/hooks/queries/useCloudFontsQueries'
import styles from './PrintSettings.module.css'

type FontRow = { font: string; variant: string; url: string; status: 'pending' | 'ok' | 'error'; error?: string }

export const PrintSettings = () => {
    const electron = useElectronPrint()
    const { isLoading: cloudFontsLoading } = useCloudFontsQuery()
    const [selectedPrinter, setSelectedPrinter] = useState('')
    const [labelWidth, setLabelWidth] = useState('70')
    const [labelHeight, setLabelHeight] = useState('50')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fontRows, setFontRows] = useState<FontRow[] | null>(null)
    const [fontsLoading, setFontsLoading] = useState(false)

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

            {/* Font diagnostics */}
            <div className={styles.section}>
                <Text variant="subheader-2" className={styles.sectionTitle}>
                    Шрифты для печати
                </Text>
                {cloudFontsLoading && (
                    <div className={styles.statusBar} style={{ padding: '6px 12px' }}>
                        <Spin size="xs" />
                        <Text variant="body-2" color="secondary">
                            Загрузка списка облачных шрифтов...
                        </Text>
                    </div>
                )}
                <Button
                    view="outlined"
                    size="m"
                    onClick={async () => {
                        setFontsLoading(true)
                        // Сразу показываем все ожидаемые строки со спиннером — облачные шрифты
                        // ещё нужно скачать, это может занять некоторое время
                        setFontRows(
                            getFontCheckList().map((item) => ({
                                font: item.font,
                                variant: item.variant,
                                url: item.url,
                                status: 'pending',
                            })),
                        )
                        try {
                            await checkFontsAvailability((result: FontCheckResult) => {
                                setFontRows((prev) => {
                                    const rows = prev ? [...prev] : []
                                    const idx = rows.findIndex(
                                        (r) => r.font === result.font && r.variant === result.variant,
                                    )
                                    const updated: FontRow = {
                                        font: result.font,
                                        variant: result.variant,
                                        url: result.url,
                                        status: result.ok ? 'ok' : 'error',
                                        error: result.error,
                                    }
                                    if (idx >= 0) {
                                        rows[idx] = updated
                                    } else {
                                        rows.push(updated)
                                    }
                                    return rows
                                })
                            })
                        } catch (e) {
                            console.error('Font check failed:', e)
                        } finally {
                            setFontsLoading(false)
                        }
                    }}
                    loading={fontsLoading}
                    disabled={cloudFontsLoading}
                >
                    Проверить шрифты
                </Button>
                {fontRows && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {fontRows.map((r, i) => (
                            <div key={i} className={styles.statusBar} style={{ padding: '6px 12px' }}>
                                {r.status === 'pending' && <Spin size="xs" />}
                                {r.status === 'ok' && (
                                    <CircleCheck className={styles.statusIconOk} style={{ width: 16, height: 16 }} />
                                )}
                                {r.status === 'error' && (
                                    <CircleXmark className={styles.statusIconError} style={{ width: 16, height: 16 }} />
                                )}
                                <Text variant="body-1">
                                    {r.font} ({r.variant})
                                </Text>
                                {r.status === 'error' && r.error && (
                                    <Text variant="caption-2" color="danger" style={{ marginLeft: 'auto' }}>
                                        {r.error}
                                    </Text>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

