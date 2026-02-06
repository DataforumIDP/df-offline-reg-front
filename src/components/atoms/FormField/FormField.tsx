import { Text } from '@gravity-ui/uikit'
import React from 'react'
import styles from './FormField.module.css'

export interface FormFieldProps {
    /** Текст лейбла */
    label: string
    /** Обязательное поле */
    required?: boolean
    /** Текст ошибки */
    error?: string
    /** Подсказка под полем */
    hint?: string
    /** ID связанного инпута (для htmlFor) */
    htmlFor?: string
    /** Контент (инпут) */
    children: React.ReactNode
    /** Дополнительный класс */
    className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    error,
    hint,
    htmlFor,
    children,
    className,
}) => {
    return (
        <div className={`${styles.field} ${className || ''}`}>
            <label className={styles.label} htmlFor={htmlFor}>
                <Text variant="body-2">
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </Text>
            </label>

            <div className={styles.control}>{children}</div>

            {error && (
                <Text variant="body-1" color="danger" className={styles.error}>
                    {error}
                </Text>
            )}

            {hint && !error && (
                <Text variant="body-1" color="secondary" className={styles.hint}>
                    {hint}
                </Text>
            )}
        </div>
    )
}

export default FormField
