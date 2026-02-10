import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AsideHeader, FooterItem, type MenuItem as AsideMenuItem } from '@gravity-ui/navigation'
import { Persons, Gear, ArrowRightFromSquare, Bars } from '@gravity-ui/icons'
import { Button, Icon } from '@gravity-ui/uikit'
import { useLogoutMutation } from '@/hooks'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setSidebarCompact, toggleSidebarCompact, setSidebarMobileOpen } from '@/store/slices/uiSlice'
import logoUrl from '../../assets/logo.svg?react'
import styles from './AdminLayout.module.css'

const OperatorLayout = () => {
    const dispatch = useAppDispatch()
    const sidebarCompact = useAppSelector((state) => state.ui.sidebarCompact)
    const sidebarMobileOpen = useAppSelector((state) => state.ui.sidebarMobileOpen)
    const navigate = useNavigate()
    const location = useLocation()
    const logoutMutation = useLogoutMutation()

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

    // Закрытие мобильного меню при клике на пункт
    const handleMenuItemClick = (path: string) => {
        navigate(path)
        dispatch(setSidebarMobileOpen(false))
    }

    // Меню оператора с обработкой мобильного закрытия
    const mobileMenuItems: AsideMenuItem[] = [
        {
            id: 'participants',
            title: 'Участники',
            icon: Persons,
            current: location.pathname === '/operator/participants',
            onItemClick: () => handleMenuItemClick('/operator/participants'),
        },
        {
            id: 'settings',
            title: 'Настройки',
            icon: Gear,
            current: location.pathname === '/operator/settings',
            onItemClick: () => handleMenuItemClick('/operator/settings'),
        },
    ]

    return (
        <div className={styles.layout}>
            {/* Оверлей для мобильного меню */}
            {sidebarMobileOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => dispatch(setSidebarMobileOpen(false))}
                />
            )}

            {/* Сайдбар */}
            <div className={`${styles.sidebar} ${sidebarMobileOpen ? styles.sidebarMobileOpen : ''}`}>
                <AsideHeader
                    compact={sidebarCompact}
                    onChangeCompact={(compact) => dispatch(setSidebarCompact(compact))}
                    logo={{
                        icon: logoUrl,
                        text: 'REGA',
                        onClick: () => dispatch(toggleSidebarCompact()),
                    }}
                    hideCollapseButton={true}
                    menuItems={mobileMenuItems}
                    renderFooter={handleRenderFooter}
                />
            </div>

            {/* Основной контент */}
            <div className={styles.content}>
                {/* Мобильная кнопка открытия меню */}
                <div className={styles.mobileMenuButton}>
                    <Button
                        view="flat"
                        size="l"
                        onClick={() => dispatch(setSidebarMobileOpen(true))}
                    >
                        <Icon data={Bars} size={20} />
                    </Button>
                </div>
                <div className={styles.mainContent}>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default OperatorLayout
