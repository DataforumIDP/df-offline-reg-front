import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button, Dialog, Spin, Text, TextInput } from '@gravity-ui/uikit'
import { Check } from '@gravity-ui/icons'
import type { SchemeField } from '@/hooks/queries/useSchemeQueries'
import styles from './ImportReviewModal.module.css'

interface ImportReviewModalProps {
    file: File | null
    fields: SchemeField[]
    isImporting: boolean
    onCancel: () => void
    onContinue: (file: File) => void
}

interface SampleRecord {
    headers: string[]
    values: Map<string, string>
    excelRowNumber: number
}

const getCellText = (value: unknown): string => {
    if (value === null || value === undefined) {
        return ''
    }
    if (typeof value === 'object') {
        const cellValue = value as {
            result?: unknown
            text?: unknown
            richText?: Array<{ text: string }>
        }
        if (cellValue.result !== undefined) {
            return getCellText(cellValue.result)
        }
        if (cellValue.text !== undefined) {
            return getCellText(cellValue.text)
        }
        if (cellValue.richText) {
            return cellValue.richText.map((part) => part.text).join('')
        }
    }
    return String(value)
}

const parseSampleRecord = async (file: File): Promise<SampleRecord> => {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
    const sheetName = workbook.SheetNames[0]
    const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined
    if (!worksheet) {
        throw new Error('В файле Excel нет листов')
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        raw: true,
        defval: '',
    })
    const headers = (rows[0] || []).map((value) => getCellText(value).trim())
    if (headers.every((header) => !header)) {
        throw new Error('Первая строка файла должна содержать ключи полей из шаблона')
    }

    const candidates = rows.slice(1).flatMap((row, offset) => {
        const cells = row || []
        const values = new Map<string, string>()
        headers.forEach((header, columnIndex) => {
            const cellValue = cells[columnIndex]
            const cellText = getCellText(cellValue)
            const isTemplateHint = offset === 0 && cellText.includes('(') && cellText.includes(')')
            if (header && !isTemplateHint) {
                values.set(header, cellText)
            }
        })
        if (![...values.values()].some(Boolean)) {
            return []
        }

        return [
            {
                headers,
                values,
                excelRowNumber: offset + 2,
            },
        ]
    })

    if (candidates.length === 0) {
        throw new Error('В файле не найдены заполненные записи для проверки')
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
}

const ImportReviewModal = ({
    file,
    fields,
    isImporting,
    onCancel,
    onContinue,
}: ImportReviewModalProps) => {
    const [sample, setSample] = useState<SampleRecord | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [confirmedFields, setConfirmedFields] = useState<Set<string>>(() => new Set())
    const [cooldownUntil, setCooldownUntil] = useState(0)
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        if (!file) {
            setSample(null)
            setLoadError(null)
            setConfirmedFields(new Set())
            setCooldownUntil(0)
            return
        }

        let cancelled = false
        setSample(null)
        setLoadError(null)
        setConfirmedFields(new Set())
        setCooldownUntil(0)

        parseSampleRecord(file)
            .then((record) => {
                if (!cancelled) {
                    setSample(record)
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setLoadError(
                        error instanceof Error ? error.message : 'Не удалось прочитать Excel',
                    )
                }
            })

        return () => {
            cancelled = true
        }
    }, [file])

    useEffect(() => {
        if (cooldownUntil <= Date.now()) {
            return
        }
        const timer = window.setInterval(() => {
            const currentTime = Date.now()
            setNow(currentTime)
            if (currentTime >= cooldownUntil) {
                window.clearInterval(timer)
            }
        }, 100)
        return () => window.clearInterval(timer)
    }, [cooldownUntil])

    const editableFields = useMemo(
        () => fields.filter((field) => field.config.type !== 'id'),
        [fields],
    )
    const unrecognizedHeaders =
        sample?.headers.filter(
            (header) => header && !fields.some((field) => field.key === header),
        ) ?? []
    const allFieldsConfirmed =
        editableFields.length > 0 && editableFields.every((field) => confirmedFields.has(field.key))
    const cooldownRemaining = Math.max(0, cooldownUntil - now)
    const canConfirmField = cooldownRemaining === 0
    const hasMultipleColumns = editableFields.length > 8

    const confirmField = (key: string) => {
        if (!canConfirmField || confirmedFields.has(key)) {
            return
        }
        setConfirmedFields((previous) => new Set(previous).add(key))
        setCooldownUntil(Date.now() + 2000)
        setNow(Date.now())
    }

    return (
        <Dialog
            open={!!file}
            onClose={() => {
                if (!isImporting) {
                    onCancel()
                }
            }}
            size={hasMultipleColumns ? 'l' : undefined}
        >
            <Dialog.Header caption="Проверка данных перед импортом" />
            <Dialog.Body>
                <div className={`${styles.body} ${hasMultipleColumns ? styles.wideBody : ''}`}>
                    <Text variant="body-2" color="secondary">
                        Проверьте, что значение из выбранной строки Excel соответствует каждому
                        полю. Подтверждать поля можно не чаще одного раза в 2 секунды.
                    </Text>

                    {!sample && !loadError && (
                        <div className={styles.loading}>
                            <Spin />
                            <Text>Читаем файл и выбираем случайную запись...</Text>
                        </div>
                    )}

                    {loadError && (
                        <div className={styles.error} role="alert">
                            {loadError}
                        </div>
                    )}

                    {sample && (
                        <>
                            <Text variant="caption-2" color="secondary">
                                Образец: строка {sample.excelRowNumber} файла «{file?.name}»
                            </Text>

                            {unrecognizedHeaders.length > 0 && (
                                <div className={styles.warning} role="status">
                                    Неизвестные заголовки будут проигнорированы при импорте:{' '}
                                    {unrecognizedHeaders.join(', ')}
                                </div>
                            )}

                            <div
                                className={`${styles.fields} ${hasMultipleColumns ? styles.multipleColumns : ''}`}
                            >
                                {editableFields.map((field) => {
                                    const isConfirmed = confirmedFields.has(field.key)
                                    const value = sample.values.get(field.key) ?? ''
                                    const selectedListItem =
                                        field.config.type === 'list'
                                            ? field.config.listSettings?.items.find(
                                                  (item) => item.value === value,
                                              )
                                            : undefined
                                    return (
                                        <div className={styles.field} key={field.key}>
                                            <label
                                                className={styles.label}
                                                htmlFor={`import-review-${field.id}`}
                                            >
                                                {field.label}
                                            </label>
                                            <div className={styles.inputRow}>
                                                <TextInput
                                                    id={`import-review-${field.id}`}
                                                    value={value}
                                                    placeholder={field.label}
                                                    size="l"
                                                    readOnly
                                                    className={styles.input}
                                                    endContent={
                                                        selectedListItem?.color ? (
                                                            <span
                                                                aria-label={`Цвет значения ${selectedListItem.value}`}
                                                                title={selectedListItem.value}
                                                                style={{
                                                                    display: 'inline-block',
                                                                    width: '14px',
                                                                    height: '14px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor:
                                                                        selectedListItem.color,
                                                                    border: '1px solid var(--g-color-line-generic)',
                                                                }}
                                                            />
                                                        ) : undefined
                                                    }
                                                />
                                                <Button
                                                    view="flat"
                                                    size="l"
                                                    className={`${styles.confirmButton} ${isConfirmed ? styles.confirmedButton : ''}`}
                                                    aria-label={
                                                        isConfirmed
                                                            ? `${field.label}: подтверждено`
                                                            : `Подтвердить поле ${field.label}`
                                                    }
                                                    title={
                                                        isConfirmed
                                                            ? 'Подтверждено'
                                                            : canConfirmField
                                                              ? 'Подтвердить поле'
                                                              : `Подождите ${Math.ceil(cooldownRemaining / 1000)} сек.`
                                                    }
                                                    disabled={
                                                        isImporting ||
                                                        isConfirmed ||
                                                        !canConfirmField
                                                    }
                                                    onClick={() => confirmField(field.key)}
                                                >
                                                    <Button.Icon>
                                                        <Check
                                                            className={
                                                                isConfirmed
                                                                    ? styles.confirmedIcon
                                                                    : undefined
                                                            }
                                                        />
                                                    </Button.Icon>
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <Text variant="caption-2" color="secondary">
                                Проверено {confirmedFields.size} из {editableFields.length} полей
                                {cooldownRemaining > 0
                                    ? ` · следующая проверка через ${Math.ceil(cooldownRemaining / 1000)} сек.`
                                    : ''}
                            </Text>
                        </>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={onCancel}
                onClickButtonApply={() => file && onContinue(file)}
                textButtonCancel="Отменить импорт"
                textButtonApply="Продолжить импорт"
                propsButtonCancel={{ disabled: isImporting }}
                propsButtonApply={{
                    disabled:
                        !sample || !allFieldsConfirmed || cooldownRemaining > 0 || !!loadError,
                    loading: isImporting,
                }}
            />
        </Dialog>
    )
}

export default ImportReviewModal
