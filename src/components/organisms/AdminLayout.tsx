import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { AsideHeader, FooterItem, type MenuItem as AsideMenuItem } from '@gravity-ui/navigation'
import {
    Persons,
    Gear,
    ChartLine,
    FileText,
    ArrowRightFromSquare,
    LayoutCells,
    Link as LinkIcon,
    Bars,
} from '@gravity-ui/icons'
import { Button, Icon, Dialog } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useLogoutMutation } from '@/hooks'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
    setSidebarCompact,
    toggleSidebarCompact,
    setSidebarMobileOpen,
} from '@/store/slices/uiSlice'
import logoUrl from '../../assets/logo.svg?react'
import styles from './AdminLayout.module.css'

const AdminLayout = () => {
    const dispatch = useAppDispatch()
    const sidebarCompact = useAppSelector((state) => state.ui.sidebarCompact)
    const sidebarMobileOpen = useAppSelector((state) => state.ui.sidebarMobileOpen)
    const navigate = useNavigate()
    const { id: projectId } = useParams()
    const location = useLocation()
    const logoutMutation = useLogoutMutation()

    // Определяем, находимся ли мы на странице проекта
    const isProjectPage = location.pathname.includes('/admin/projects/') && projectId

    // Меню для страницы проекта
    const projectMenuItems: AsideMenuItem[] = [
        {
            id: 'participants',
            title: 'Участники',
            icon: Persons,
            onItemClick: () => navigate(`/admin/projects/${projectId}/participants`),
        },
        {
            id: 'stats',
            title: 'Статистика',
            icon: ChartLine,
            onItemClick: () => navigate(`/admin/projects/${projectId}/stats`),
        },
        {
            id: 'templates',
            title: 'Шаблоны',
            icon: FileText,
            onItemClick: () => navigate(`/admin/projects/${projectId}/templates`),
        },
        {
            id: 'hooks',
            title: 'Вебхуки',
            icon: LinkIcon,
            onItemClick: () => navigate(`/admin/projects/${projectId}/hooks`),
        },
        {
            id: 'zones',
            title: 'Зоны',
            icon: LayoutCells,
            onItemClick: () => navigate(`/admin/projects/${projectId}/zones`),
        },
        {
            id: 'settings',
            title: 'Настройки',
            icon: Gear,
            onItemClick: () => navigate(`/admin/projects/${projectId}/settings`),
        },
    ]

    // Меню для главных страниц (проекты, настройки аккаунта)
    const mainMenuItems: AsideMenuItem[] = [
        {
            id: 'projects',
            title: 'Проекты',
            icon: Persons,
            current: location.pathname === '/admin/projects',
            onItemClick: () => navigate('/admin/projects'),
        },
        {
            id: 'account-settings',
            title: 'Настройки',
            icon: Gear,
            current: location.pathname === '/admin/settings',
            onItemClick: () => navigate('/admin/settings'),
        },
    ]

    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

    const handleLogoClick = () => {
        navigate('/admin/projects')
    }

    const handleLogoutClick = () => {
        setLogoutDialogOpen(true)
    }

    const handleLogoutConfirm = () => {
        logoutMutation.mutate()
        setLogoutDialogOpen(false)
    }

    const currentMenuItems = isProjectPage
        ? projectMenuItems.map((item) => ({
              ...item,
              current: item.id === location.pathname.split('/').pop(),
          }))
        : mainMenuItems

    const projectFooterItems: AsideMenuItem[] = [
        {
            id: 'back',
            title: 'На главную',
            icon: ArrowRightFromSquare,
            onItemClick: () => navigate('/admin/projects'),
        },
    ]

    const handleRenderFooter = () => (
        <div>
            {isProjectPage ? (
                projectFooterItems.map((item) => (
                    <FooterItem
                        id={item.id}
                        key={item.id}
                        icon={item.icon}
                        title={item.title}
                        onItemClick={handleLogoClick}
                    />
                ))
            ) : (
                <FooterItem
                    id="logout"
                    icon={ArrowRightFromSquare}
                    title="Выйти"
                    onItemClick={handleLogoutClick}
                />
            )}
        </div>
    )

    // Закрытие мобильного меню при клике на пункт
    const handleMenuItemClick = (callback: () => void) => {
        callback()
        dispatch(setSidebarMobileOpen(false))
    }

    // Меню с обработкой мобильного закрытия
    const mobileMenuItems = currentMenuItems.map((item) => ({
        ...item,
        onItemClick: item.onItemClick
            ? () => handleMenuItemClick(item.onItemClick as () => void)
            : undefined,
    }))

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
            <div
                className={`${styles.sidebar} ${sidebarMobileOpen ? styles.sidebarMobileOpen : ''}`}
            >
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

            <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} size="s">
                <Dialog.Header caption="Выход из аккаунта" />
                <Dialog.Body>Вы уверены, что хотите выйти?</Dialog.Body>
                <Dialog.Footer
                    textButtonCancel="Отмена"
                    textButtonApply="Выйти"
                    onClickButtonCancel={() => setLogoutDialogOpen(false)}
                    onClickButtonApply={handleLogoutConfirm}
                />
            </Dialog>
        </div>
    )
}

export default AdminLayout
