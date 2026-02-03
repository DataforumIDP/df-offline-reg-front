import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ThemeProvider, configure } from '@gravity-ui/uikit'
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
