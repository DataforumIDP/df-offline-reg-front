import { Routes, Route } from 'react-router-dom'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import NavigationListener from '@/components/atoms/NavigationListener'

const isElectron = (typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Electron')) || import.meta.env.MODE === 'electron'
const Router = isElectron ? HashRouter : BrowserRouter

// Лейауты
import AdminLayout from '@components/organisms/AdminLayout'
import OperatorLayout from '@components/organisms/OperatorLayout'

// Страницы
import MainPage from '@pages/MainPage'
import LoginPage from '@pages/admin/LoginPage'
import ProjectsPage from '@pages/admin/ProjectsPage'
import ProjectSettingsPage from '@pages/admin/project/SettingsPage'
import ProjectStatsPage from '@pages/admin/project/StatsPage'
import ProjectParticipantsPage from '@pages/admin/project/ParticipantsPage'
import ProjectTemplatesPage from '@pages/admin/project/TemplatesPage'
import ProjectHooksPage from '@pages/admin/project/HooksPage'
import ProjectScriptsPage from '@pages/admin/project/ScriptsPage'
import ProjectZonesPage from '@pages/admin/project/ZonesPage'
import ProjectJournalPage from '@pages/admin/project/JournalPage'
import AccountSettingsPage from '@pages/admin/AccountSettingsPage'
import FontsPage from '@pages/admin/FontsPage'
import EmailAccountsPage from '@pages/admin/EmailAccountsPage'

// Страницы оператора
import OperatorLoginPage from '@pages/operator/LoginPage'
import OperatorParticipantsPage from '@pages/operator/ParticipantsPage'
import OperatorSettingsPage from '@pages/operator/SettingsPage'

// Служебные страницы
import NotFoundPage from '@pages/NotFoundPage'
import ForbiddenPage from '@pages/ForbiddenPage'

const AppRouter = () => {
    return (
        <Router>
            <NavigationListener />
            <Routes>
                {/* Главная страница */}
                <Route path="/" element={<MainPage />} />

                {/* Вход в админку */}
                <Route path="/admin" element={<LoginPage />} />

                {/* Админские роуты с лейаутом */}
                <Route element={<AdminLayout />}>
                    {/* Список проектов */}
                    <Route path="/admin/projects" element={<ProjectsPage />} />

                    {/* Настройки аккаунта */}
                    <Route path="/admin/settings" element={<AccountSettingsPage />} />

                    {/* Шрифты */}
                    <Route path="/admin/fonts" element={<FontsPage />} />

                    {/* Email аккаунты */}
                    <Route path="/admin/email-accounts" element={<EmailAccountsPage />} />

                    {/* Страницы проекта */}
                    <Route path="/admin/projects/:id/settings" element={<ProjectSettingsPage />} />
                    <Route path="/admin/projects/:id/stats" element={<ProjectStatsPage />} />
                    <Route
                        path="/admin/projects/:id/participants"
                        element={<ProjectParticipantsPage />}
                    />
                    <Route
                        path="/admin/projects/:id/templates"
                        element={<ProjectTemplatesPage />}
                    />
                    <Route path="/admin/projects/:id/hooks" element={<ProjectHooksPage />} />
                    <Route path="/admin/projects/:id/scripts" element={<ProjectScriptsPage />} />
                    <Route path="/admin/projects/:id/zones" element={<ProjectZonesPage />} />
                    <Route path="/admin/projects/:id/journal" element={<ProjectJournalPage />} />
                </Route>

                {/* Вход оператора */}
                <Route path="/operator" element={<OperatorLoginPage />} />

                {/* Роуты оператора с лейаутом */}
                <Route element={<OperatorLayout />}>
                    <Route path="/operator/participants" element={<OperatorParticipantsPage />} />
                    <Route path="/operator/settings" element={<OperatorSettingsPage />} />
                </Route>

                {/* Служебные страницы */}
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    )
}

export default AppRouter
