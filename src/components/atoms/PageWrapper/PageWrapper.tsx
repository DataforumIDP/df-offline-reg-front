import { ReactNode } from 'react'
import styles from './PageWrapper.module.css'

interface PageWrapperProps {
    children: ReactNode
    className?: string
}

interface PageHeaderProps {
    children: ReactNode
    className?: string
}

interface PageHeaderActionsProps {
    children: ReactNode
    className?: string
}

export const PageWrapper = ({ children, className }: PageWrapperProps) => {
    return <div className={`${styles.page} ${className || ''}`}>{children}</div>
}

export const PageHeader = ({ children, className }: PageHeaderProps) => {
    return <div className={`${styles.header} ${className || ''}`}>{children}</div>
}

export const PageHeaderActions = ({ children, className }: PageHeaderActionsProps) => {
    return <div className={`${styles.headerActions} ${className || ''}`}>{children}</div>
}
