import { Dialog, Text, Button } from '@gravity-ui/uikit'

export interface ConfirmDeleteModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading?: boolean
    participantId: number | null
}

export const ConfirmDeleteModal = ({
    open,
    onClose,
    onConfirm,
    isLoading,
    participantId,
}: ConfirmDeleteModalProps) => {
    return (
        <Dialog open={open} onClose={onClose} aria-labelledby="confirm-delete-modal-title">
            <Dialog.Header caption="Удаление участника" id="confirm-delete-modal-title" />
            <Dialog.Body>
                <div style={{ minWidth: '350px' }}>
                    <Text variant="body-1">
                        Вы уверены, что хотите удалить участника #{participantId}?
                    </Text>
                    <Text
                        variant="body-1"
                        color="secondary"
                        style={{ marginTop: '8px', display: 'block' }}
                    >
                        Это действие нельзя отменить.
                    </Text>
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        width: '100%',
                    }}
                >
                    <Button view="flat" size="l" onClick={onClose} disabled={isLoading}>
                        Отмена
                    </Button>
                    <Button view="action" size="l" onClick={onConfirm} loading={isLoading}>
                        Удалить
                    </Button>
                </div>
            </Dialog.Footer>
        </Dialog>
    )
}

export default ConfirmDeleteModal
