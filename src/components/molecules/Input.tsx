// Пример Molecule компонента - форма ввода

import { TextInput } from '@gravity-ui/uikit'
import type { TextInputProps } from '@gravity-ui/uikit'
import React from 'react'

interface InputProps extends Omit<TextInputProps, 'ref'> {
  label: string
  helperText?: string
}

const Input = React.forwardRef<HTMLSpanElement, InputProps>(
  ({ label, helperText, error, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        label={label}
        error={error ? (typeof error === 'string' ? error : helperText || true) : undefined}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export default Input
