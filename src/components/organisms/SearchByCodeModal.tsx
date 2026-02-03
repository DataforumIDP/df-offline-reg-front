import { Dialog, TextInput } from '@gravity-ui/uikit'
import { useState, useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { fetchParticipantByCode } from '@/services/api/participants'

interface SearchByCodeModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  onParticipantFound: (participantId: number) => void
}

const SearchByCodeModal = ({ open, onClose, projectId, onParticipantFound }: SearchByCodeModalProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const [code, setCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleClose = useCallback(() => {
    setCode('')
    onClose()
  }, [onClose])

  const handleSearch = useCallback(async () => {
    if (!code.trim()) {
      enqueueSnackbar('Введите код для поиска', { variant: 'warning' })
      return
    }

    setIsSearching(true)
    try {
      const participant = await fetchParticipantByCode(Number(projectId), code.trim())
      handleClose()
      onParticipantFound(participant.id)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        enqueueSnackbar('Участник с указанным кодом не найден', { variant: 'error' })
      } else {
        enqueueSnackbar('Ошибка при поиске участника', { variant: 'error' })
      }
    } finally {
      setIsSearching(false)
    }
  }, [code, projectId, handleClose, onParticipantFound, enqueueSnackbar])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="search-by-code-modal-title">
      <Dialog.Header caption="Поиск по коду" id="search-by-code-modal-title" />
      <Dialog.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--g-color-text-secondary)' }}>
              Введите код участника
            </label>
            <TextInput
              value={code}
              onUpdate={setCode}
              onKeyDown={handleKeyDown}
              placeholder="Код..."
              size="l"
              autoFocus
            />
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer
        onClickButtonCancel={handleClose}
        onClickButtonApply={handleSearch}
        textButtonCancel="Отмена"
        textButtonApply="Найти"
        propsButtonApply={{ loading: isSearching }}
      />
    </Dialog>
  )
}

export default SearchByCodeModal
