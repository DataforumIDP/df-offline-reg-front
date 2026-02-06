import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Лейауты
import AdminLayout from '@components/organisms/AdminLayout'

// Страницы
import MainPage from '@pages/MainPage'
import LoginPage from '@pages/admin/LoginPage'
import ProjectsPage from '@pages/admin/ProjectsPage'
import ProjectSettingsPage from '@pages/admin/project/SettingsPage'
import ProjectStatsPage from '@pages/admin/project/StatsPage'
import ProjectParticipantsPage from '@pages/admin/project/ParticipantsPage'
import ProjectTemplatesPage from '@pages/admin/project/TemplatesPage'
import ProjectHooksPage from '@pages/admin/project/HooksPage'
import ProjectZonesPage from '@pages/admin/project/ZonesPage'

// Служебные страницы
import NotFoundPage from '@pages/NotFoundPage'
import ForbiddenPage from '@pages/ForbiddenPage'

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                {/* Главная страница */}
                <Route path="/" element={<MainPage />} />

                {/* Вход в админку */}
                <Route path="/admin" element={<LoginPage />} />

                {/* Админские роуты с лейаутом */}
                <Route element={<AdminLayout />}>
                    {/* Список проектов */}
                    <Route path="/admin/projects" element={<ProjectsPage />} />

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
                    <Route path="/admin/projects/:id/zones" element={<ProjectZonesPage />} />
                </Route>

                {/* Служебные страницы */}
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    )
}

export default AppRouter
