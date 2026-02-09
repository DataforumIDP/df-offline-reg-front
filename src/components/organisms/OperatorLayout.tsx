import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AsideHeader, FooterItem, type MenuItem as AsideMenuItem } from '@gravity-ui/navigation'
import { Persons, Gear, ArrowRightFromSquare } from '@gravity-ui/icons'
import { useLogoutMutation } from '@/hooks'
import logoUrl from '../../assets/logo.svg?react'
import styles from './AdminLayout.module.css'

const OperatorLayout = () => {
    const [sidebarCompact, setSidebarCompact] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const logoutMutation = useLogoutMutation()

    // Меню оператора
    const menuItems: AsideMenuItem[] = [
        {
            id: 'participants',
            title: 'Участники',
            icon: Persons,
            current: location.pathname === '/operator/participants',
            onItemClick: () => navigate('/operator/participants'),
        },
        {
            id: 'settings',
            title: 'Настройки',
            icon: Gear,
            current: location.pathname === '/operator/settings',
            onItemClick: () => navigate('/operator/settings'),
        },
    ]

    const handleLogout = () => {
        logoutMutation.mutate()
    }

    const handleRenderFooter = () => (
        <div>
            <FooterItem
                id="logout"
                icon={ArrowRightFromSquare}
                title="Выйти"
                onItemClick={handleLogout}
            />
        </div>
    )

    return (
        <div className={styles.layout}>
            <AsideHeader
                compact={sidebarCompact}
                onChangeCompact={setSidebarCompact}
                logo={{
                    icon: logoUrl,
                    text: 'REGA',
                    onClick: () => setSidebarCompact(!sidebarCompact),
                }}
                hideCollapseButton={true}
                menuItems={menuItems}
                renderFooter={handleRenderFooter}
                renderContent={() => (
                    <div className={styles.mainContent}>
                        <Outlet />
                    </div>
                )}
            />
        </div>
    )
}

export default OperatorLayout
