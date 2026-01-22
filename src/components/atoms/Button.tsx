// Пример Atom компонента - простая кнопка

import { Button as GravityButton } from '@gravity-ui/uikit'
import type { ButtonView } from '@gravity-ui/uikit'
import React from 'react'

// Маппинг MUI вариантов на Gravity UI view
type MuiVariant = 'contained' | 'outlined' | 'text'
type MuiColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

interface ButtonProps {
  children: React.ReactNode
  variant?: MuiVariant
  color?: MuiColor
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

const mapVariantToView = (variant?: MuiVariant, color?: MuiColor): ButtonView => {
  if (variant === 'contained') {
    if (color === 'error') return 'outlined-danger'
    return 'action'
  }
  if (variant === 'outlined') {
    if (color === 'error') return 'outlined-danger'
    return 'outlined'
  }
  if (variant === 'text') return 'flat'
  return 'action'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant, color, fullWidth, type, disabled, onClick, className }, ref) => {
    return (
      <GravityButton
        ref={ref}
        view={mapVariantToView(variant, color)}
        width={fullWidth ? 'max' : 'auto'}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children}
      </GravityButton>
    )
  },
)

Button.displayName = 'Button'

export default Button
