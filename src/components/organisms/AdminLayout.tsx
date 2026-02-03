import { useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button } from '@gravity-ui/uikit'
import { AsideHeader, FooterItem, type MenuItem as AsideMenuItem } from '@gravity-ui/navigation'
import {
  Persons,
  Gear,
  ChartLine,
  FileText,
  ArrowRightFromSquare,
  LayoutCells,
} from '@gravity-ui/icons'
import logoUrl from '../../assets/logo.svg?react'
import styles from './AdminLayout.module.css'

const AdminLayout = () => {
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const navigate = useNavigate()
  const { id: projectId } = useParams()
  const location = useLocation()

  // Меню для страницы проекта
  const projectMenuItems: AsideMenuItem[] = [
    { id: 'participants', title: 'Участники', icon: Persons, onItemClick: () => navigate(`/admin/projects/${projectId}/participants`) },
    { id: 'stats', title: 'Статистика', icon: ChartLine, onItemClick: () => navigate(`/admin/projects/${projectId}/stats`) },
    { id: 'templates', title: 'Шаблоны', icon: FileText, onItemClick: () => navigate(`/admin/projects/${projectId}/templates`) },
    { id: 'hooks', title: 'Вебхуки', icon: ArrowRightFromSquare, onItemClick: () => navigate(`/admin/projects/${projectId}/hooks`) },
    { id: 'zones', title: 'Зоны', icon: LayoutCells, onItemClick: () => navigate(`/admin/projects/${projectId}/zones`) },
    { id: 'settings', title: 'Настройки', icon: Gear, onItemClick: () => navigate(`/admin/projects/${projectId}/settings`) },
  ]

  // Определяем, находимся ли мы на странице проекта
  const isProjectPage = location.pathname.includes('/admin/projects/') && projectId

  const handleLogoClick = () => {
    navigate('/admin/projects')
  }

  const currentMenuItems = isProjectPage 
    ? projectMenuItems.map(item => ({
        ...item,
        current: item.id === location.pathname.split('/').pop()
      }))
    : []

  const footerMenuItems: AsideMenuItem[] = isProjectPage
    ? [
        { id: 'back', title: 'На главную', icon: ArrowRightFromSquare, onItemClick: () => navigate('/admin/projects') },
      ]
    : []

  const handleRenderFooter = () => (
    <div>
      {footerMenuItems.map((item) => (
        <FooterItem
          id={item.id}
          key={item.id}
          icon={item.icon}
          title={item.title}
          onItemClick={handleLogoClick}
        />
      ))}
    </div>
  )

  return (
    <div className={styles.layout}>
      {isProjectPage ? (
        <AsideHeader
          compact={sidebarCompact}
          onChangeCompact={setSidebarCompact}
          logo={{
            icon: logoUrl,
            text: 'REGA',
            onClick: () => setSidebarCompact(!sidebarCompact),
          }}
          hideCollapseButton={true}
          menuItems={currentMenuItems}
          renderFooter={handleRenderFooter}
          renderContent={() => (
            <div className={styles.mainContent}>
              <Outlet />
            </div>
          )}
        />
      ) : (
        <>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div
                className={styles.logo}
                onClick={handleLogoClick}
              >
                REGA
              </div>
            </div>
            <div className={styles.headerRight}>
              <Button view="flat" size="m" icon={<ArrowRightFromSquare />}>
                Выйти
              </Button>
            </div>
          </header>
          <main className={styles.mainContent}>
            <Outlet />
          </main>
        </>
      )}
    </div>
  )
}

export default AdminLayout
