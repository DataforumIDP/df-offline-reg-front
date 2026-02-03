import { useState, useEffect } from 'react'
import { Modal, Text, TextInput, Button } from '@gravity-ui/uikit'
import styles from './TemplateNameDialog.module.css'

interface TemplateNameDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (name: string) => void
    isLoading?: boolean
}

const TemplateNameDialog = ({ open, onClose, onSubmit, isLoading }: TemplateNameDialogProps) => {
    const [name, setName] = useState('')

    // Сброс имени при открытии модалки
    useEffect(() => {
        if (open) {
            setName('')
        }
    }, [open])

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name.trim())
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            handleSubmit()
        }
    }

    return (
        <Modal open={open} onClose={onClose} contentClassName={styles.modal}>
            <div className={styles.content}>
                <Text variant="header-2">Введите название шаблона</Text>
                <TextInput
                    value={name}
                    onUpdate={setName}
                    autoFocus
                    placeholder="Название шаблона"
                    className={styles.input}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <div className={styles.actions}>
                    <Button view="flat" onClick={onClose} disabled={isLoading}>
                        Отмена
                    </Button>
                    <Button
                        view="action"
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        loading={isLoading}
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default TemplateNameDialog
