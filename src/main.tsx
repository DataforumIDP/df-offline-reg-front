import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ThemeProvider, configure } from '@gravity-ui/uikit'
import { settings as dateSettings } from '@gravity-ui/date-utils'
import App from './App'
import { store } from '@store/store'

import '@gravity-ui/uikit/styles/fonts.css'
import '@gravity-ui/uikit/styles/styles.css'
import '@styles/styles.css'
import '@styles/globals.css'

// Настройка языка для Gravity UI
configure({
    lang: 'ru',
})

function renderApp() {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme="dark">
                        <App />
                    </ThemeProvider>
                </QueryClientProvider>
            </Provider>
        </React.StrictMode>,
    )
}

// Загружаем локаль для @gravity-ui/date-utils (нужна для DatePicker)
// и только после этого рендерим приложение, чтобы избежать гонки
dateSettings.loadLocale('ru').then(() => {
    dateSettings.setLocale('ru')
}).catch(() => {
    // не удалось загрузить — продолжаем без русской локали
}).finally(() => {
    renderApp()
})

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error: any) => {
                // Не ретраить на 401 (unauthorized) и 403 (forbidden)
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    return false
                }
                // Стандартный retry до 3 раз для остальных ошибок
                return failureCount < 3
            },
            staleTime: 1000 * 60, // 1 минута
        },
        mutations: {
            retry: false, // Не ретраить мутации
        },
    },
})

// Normalize path/hash for Electron builds so HashRouter receives the intended route.
if (typeof window !== 'undefined') {
    const isElectronMode = import.meta.env.MODE === 'electron' || (window.navigator?.userAgent || '').includes('Electron')
    if (isElectronMode) {
        try {
            const pathname = window.location.pathname || ''
            const rawHash = window.location.hash || ''
            // Новый способ: не считаем path вложенным, если он заканчивается на index.html (для file://)
            const isIndex = pathname.endsWith('/index.html') || pathname.endsWith('\\index.html') || pathname.endsWith('index.html')
            const hasPath = pathname && pathname !== '/' && !isIndex
            const hasHash = rawHash && rawHash.length > 1

            if (hasPath) {
                // Если есть path, нормализуем в hash
                const protocol = window.location.protocol || ''
                const search = window.location.search || ''
                const fullHash = '#' + pathname + search
                try {
                    if (protocol.startsWith('http')) {
                        window.history.replaceState({}, '', '/' + fullHash)
                    } else {
                        window.history.replaceState({}, '', fullHash)
                    }
                } catch (e) {
                    try { window.location.hash = fullHash } catch {}
                }
            } else if (!hasHash) {
                // Если нет path и hash — явно ставим /#/
                try {
                    window.history.replaceState({}, '', '#/')
                } catch (e) {
                    try { window.location.hash = '#/' } catch {}
                }
            }
        } catch (e) {
            // swallow - best-effort normalization only
            console.warn('URL normalization failed', e)
        }
    }
}
