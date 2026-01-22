import { TextInput } from '@gravity-ui/uikit'
import type { TextInputProps } from '@gravity-ui/uikit'
import React, { useId } from 'react'
import { FormField } from '@/components/atoms/FormField'

export interface FormInputProps extends Omit<TextInputProps, 'label' | 'error'> {
  /** Текст лейбла */
  label: string
  /** Обязательное поле */
  required?: boolean
  /** Текст ошибки */
  error?: string
  /** Подсказка под полем */
  hint?: string
  /** Дополнительный класс для обёртки */
  wrapperClassName?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, required, error, hint, wrapperClassName, className, ...inputProps }, ref) => {
    const generatedId = useId()
    const inputId = inputProps.id || generatedId

    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={inputId}
        className={wrapperClassName}
      >
        <TextInput
          {...inputProps}
          id={inputId}
          controlRef={ref}
          className={className}
          validationState={error ? 'invalid' : undefined}
        />
      </FormField>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
