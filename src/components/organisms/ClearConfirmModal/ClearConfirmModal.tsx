import { useState } from 'react'
import { Modal, Button, TextInput, Text, Alert } from '@gravity-ui/uikit'
import styles from './ClearConfirmModal.module.css'

interface ClearConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    projectTitle: string
    isLoading: boolean
}

const ClearConfirmModal = ({
    open,
    onClose,
    onConfirm,
    projectTitle,
    isLoading,
}: ClearConfirmModalProps) => {
    const [inputValue, setInputValue] = useState('')

    const isConfirmEnabled = inputValue.trim().toLowerCase() === projectTitle.trim().toLowerCase()

    const handleConfirm = async () => {
        if (!isConfirmEnabled) {
            return
        }
        await onConfirm()
        setInputValue('')
    }

    const handleClose = () => {
        setInputValue('')
        onClose()
    }

    return (
        <Modal open={open} onClose={handleClose}>
            <div className={styles.modal}>
                <Text variant="header-1" className={styles.title}>
                    Очистка списка участников
                </Text>

                <Alert
                    theme="danger"
                    message="Это действие необратимо! Все участники и логи действий будут удалены без возможности восстановления."
                    className={styles.alert}
                />

                <div className={styles.content}>
                    <Text variant="body-1">Для подтверждения введите название мероприятия:</Text>
                    <Text variant="subheader-2" className={styles.projectTitle}>
                        {projectTitle}
                    </Text>

                    <TextInput
                        value={inputValue}
                        onUpdate={setInputValue}
                        placeholder="Введите название мероприятия"
                        size="l"
                        error={inputValue.length > 0 && !isConfirmEnabled}
                        autoFocus
                    />
                </div>

                <div className={styles.actions}>
                    <Button view="flat" size="l" onClick={handleClose} disabled={isLoading}>
                        Отмена
                    </Button>
                    <Button
                        view="outlined-danger"
                        size="l"
                        onClick={handleConfirm}
                        disabled={!isConfirmEnabled}
                        loading={isLoading}
                    >
                        Очистить
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default ClearConfirmModal
