import { useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button, Text } from '@gravity-ui/uikit'
import {
  Bars,
  Persons,
  Gear,
  ChartLine,
  FileText,
  ArrowRightFromSquare,
} from '@gravity-ui/icons'
import styles from './AdminLayout.module.css'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const { id: projectId } = useParams()
  const location = useLocation()

  // Меню для страницы проекта
  const projectMenuItems: MenuItem[] = [
    { id: 'participants', label: 'Участники', icon: <Persons />, path: `/admin/projects/${projectId}/participants` },
    { id: 'stats', label: 'Статистика', icon: <ChartLine />, path: `/admin/projects/${projectId}/stats` },
    { id: 'templates', label: 'Шаблоны', icon: <FileText />, path: `/admin/projects/${projectId}/templates` },
    { id: 'hooks', label: 'Вебхуки', icon: <ArrowRightFromSquare />, path: `/admin/projects/${projectId}/hooks` },
    { id: 'settings', label: 'Настройки', icon: <Gear />, path: `/admin/projects/${projectId}/settings` },
  ]

  // Определяем, находимся ли мы на странице проекта
  const isProjectPage = location.pathname.includes('/admin/projects/') && projectId

  const handleLogoClick = () => {
    navigate('/admin/projects')
  }

  const handleMenuItemClick = (path: string) => {
    navigate(path)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {isProjectPage && (
            <Button
              view="flat"
              size="l"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={styles.menuButton}
            >
              <Bars />
            </Button>
          )}
          <Text
            variant="header-1"
            className={styles.logo}
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            REGA
          </Text>
        </div>
        <div className={styles.headerRight}>
          <Button view="flat" size="m">
            Выйти
          </Button>
        </div>
      </header>

      <div className={styles.body}>
        {/* Sidebar - только на страницах проекта */}
        {isProjectPage && (
          <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
            <nav className={styles.nav}>
              {projectMenuItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                  onClick={() => handleMenuItemClick(item.path)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className={`${styles.main} ${isProjectPage && !sidebarCollapsed ? styles.withSidebar : ''} ${isProjectPage && sidebarCollapsed ? styles.withCollapsedSidebar : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
