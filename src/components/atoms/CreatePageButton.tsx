import React from 'react'
import { Button } from '@gravity-ui/uikit'

interface CreatePageButtonProps {
  children?: React.ReactNode
  onClick?: () => void
}

/**
 * Компонент кнопки "Создать страницу" из Figma макета
 * Node ID: 182-1120
 */
const CreatePageButton = React.forwardRef<HTMLButtonElement, CreatePageButtonProps>(
  ({ children = 'Создать страницу', onClick }, ref) => {
    return (
      <Button
        ref={ref}
        view="action"
        size="l"
        pin="round-round"
        onClick={onClick}
        style={{
        }}
      >
        {children}
      </Button>
    )
  },
)

CreatePageButton.displayName = 'CreatePageButton'

export default CreatePageButton
