import { Text, Button, Select } from '@gravity-ui/uikit'
import { TrashBin } from '@gravity-ui/icons'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
    selectElement,
    removeElement,
    updateElement,
    TextFieldElement,
    QrElement,
} from '@/store/slices/templateEditorSlice'
import { useSchemeQuery } from '@/hooks/queries/useSchemeQueries'
import styles from './ElementsList.module.css'

const ElementsList = () => {
    const { id: projectId } = useParams()
    const dispatch = useAppDispatch()
    const { elements, selectedElementId } = useAppSelector((state) => state.templateEditor)
    const { data: scheme } = useSchemeQuery(projectId || '')

    const textElements = elements.filter((el): el is TextFieldElement => el.type === 'text')
    const qrElements = elements.filter((el): el is QrElement => el.type === 'qr')

    // Опции для выбора ресурса
    const fieldOptions = [
        { value: '__none__', content: 'Без привязки' },
        ...(scheme?.fields || [])
            .filter((field) => field.config.type !== 'img')
            .map((field) => ({
                value: field.key,
                content: field.label,
            })),
    ]

    const getFieldLabel = (fieldKey: string | undefined) => {
        if (!fieldKey) {
            return 'Без привязки'
        }
        return scheme?.fields.find((f) => f.key === fieldKey)?.label || fieldKey
    }

    const handleSelect = (id: string) => {
        dispatch(selectElement(id))
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        dispatch(removeElement(id))
    }

    const handleResourceChange = (elementId: string, values: string[]) => {
        const value = values[0]
        dispatch(
            updateElement({
                id: elementId,
                updates: { fieldKey: value === '__none__' ? undefined : value },
            }),
        )
    }

    if (textElements.length === 0 && qrElements.length === 0) {
        return (
            <div className={styles.empty}>
                <Text variant="body-2" color="secondary">
                    Добавленные элементы появятся здесь
                </Text>
            </div>
        )
    }

    return (
        <div className={styles.list}>
            {textElements.map((element, index) => {
                const isSelected = selectedElementId === element.id
                return (
                    <div
                        key={element.id}
                        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleSelect(element.id)}
                    >
                        <div className={styles.itemHeader}>
                            <Text variant="body-2" className={styles.itemTitle}>
                                Поле {index + 1}
                            </Text>
                            <Button
                                view="flat"
                                size="xs"
                                onClick={(e) => handleDelete(e, element.id)}
                            >
                                <Button.Icon>
                                    <TrashBin />
                                </Button.Icon>
                            </Button>
                        </div>

                        <div className={styles.itemContent}>
                            <Text variant="caption-2" color="secondary">
                                Ресурс:
                            </Text>
                            {isSelected ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        value={[element.fieldKey || '__none__']}
                                        onUpdate={(values) =>
                                            handleResourceChange(element.id, values)
                                        }
                                        options={fieldOptions}
                                        size="s"
                                        width="max"
                                    />
                                </div>
                            ) : (
                                <Text variant="body-2">{getFieldLabel(element.fieldKey)}</Text>
                            )}
                        </div>

                        <div className={styles.itemMeta}>
                            <Text variant="caption-2" color="secondary">
                                {element.fontFamily}, {element.fontSize}pt
                                {element.fontWeight === 'bold' && ', жирный'}
                                {element.fontStyle === 'italic' && ', курсив'}
                            </Text>
                        </div>
                    </div>
                )
            })}
            {qrElements.map((element, index) => {
                const isSelected = selectedElementId === element.id
                return (
                    <div
                        key={element.id}
                        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleSelect(element.id)}
                    >
                        <div className={styles.itemHeader}>
                            <Text variant="body-2" className={styles.itemTitle}>
                                QR {index + 1}
                            </Text>
                            <Button
                                view="flat"
                                size="xs"
                                onClick={(e) => handleDelete(e, element.id)}
                            >
                                <Button.Icon>
                                    <TrashBin />
                                </Button.Icon>
                            </Button>
                        </div>
                        <div className={styles.itemContent}>
                            <Text variant="caption-2" color="secondary">
                                Ресурс:
                            </Text>
                            <Text variant="body-2">
                                {element.resourceType === 'field'
                                    ? (element.prefix || '') + (element.fieldKey || '')
                                    : element.fixedValue || ''}
                            </Text>
                        </div>
                        <div className={styles.itemMeta}>
                            <Text variant="caption-2" color="secondary">
                                {element.width}мм, {element.fgColor}, {element.bgColor},{' '}
                                {element.moduleStyle}
                            </Text>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ElementsList
