import { useState, useMemo, useCallback } from 'react'
import { Modal, Text, Loader } from '@gravity-ui/uikit'
import { SearchInput } from '@/components/atoms'
import { usePrintTemplates } from '@/hooks/queries/useTemplateQueries'
import { PrintTemplate } from '@/services/api/templates'
import styles from './SelectTemplateModal.module.css'

interface SelectTemplateModalProps {
    open: boolean
    onClose: () => void
    onSelect: (template: PrintTemplate) => void
    isLoading?: boolean
    currentTemplateId?: number
}

const SelectTemplateModal = ({
    open,
    onClose,
    onSelect,
    isLoading,
    currentTemplateId,
}: SelectTemplateModalProps) => {
    const [search, setSearch] = useState('')
    const { data, isLoading: isLoadingTemplates } = usePrintTemplates()

    // Фильтрация по поиску на клиенте
    const filteredTemplates = useMemo(() => {
        if (!data?.templates) {
            return []
        }
        if (!search.trim()) {
            return data.templates
        }
        const searchLower = search.toLowerCase()
        return data.templates.filter((t) => t.name.toLowerCase().includes(searchLower))
    }, [data?.templates, search])

    const handleSelect = useCallback(
        (template: PrintTemplate) => {
            if (isLoading) {
                return
            }
            onSelect(template)
        },
        [onSelect, isLoading],
    )

    return (
        <Modal open={open} onClose={onClose} contentClassName={styles.modal}>
            <div className={styles.content}>
                <Text variant="header-2">Выбрать шаблон</Text>

                <SearchInput
                    value={search}
                    onUpdate={setSearch}
                    placeholder="Поиск по названию..."
                    size="l"
                    fullWidth
                />

                <div className={styles.templatesList}>
                    {isLoadingTemplates ? (
                        <div className={styles.loader}>
                            <Loader size="m" />
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className={styles.empty}>
                            <Text color="secondary">
                                {search ? 'Шаблоны не найдены' : 'Нет доступных шаблонов'}
                            </Text>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filteredTemplates.map((template) => {
                                const isSelected = template.id === currentTemplateId

                                return (
                                    <div
                                        key={template.id}
                                        className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => handleSelect(template)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleSelect(template)
                                            }
                                        }}
                                    >
                                        <div className={styles.cardPreview}>
                                            {template.preloader ? (
                                                <img
                                                    src={template.preloader}
                                                    alt={template.name}
                                                    className={styles.previewImage}
                                                />
                                            ) : (
                                                <div className={styles.noPreview}>
                                                    <Text color="secondary" variant="caption-2">
                                                        Нет превью
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <Text
                                                variant="subheader-1"
                                                ellipsis
                                                title={template.name}
                                            >
                                                {template.name}
                                            </Text>
                                        </div>
                                        {isSelected && (
                                            <div className={styles.selectedBadge}>
                                                <Text variant="caption-2">Текущий</Text>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <Loader size="m" />
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default SelectTemplateModal
