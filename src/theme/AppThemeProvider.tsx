import { useEffect, useRef, useState } from 'react'
import { ThemeProvider } from '@gravity-ui/uikit'
import App from '@/App'
import { ScreenSaver } from '@/theme/ScreenSaver'

type AppTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'app-theme'
const THEME_TRANSITION_CLASS = 'theme-transition'
const THEME_TRANSITION_DURATION_MS = 300

function getInitialTheme(): AppTheme {
    try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light'
            ? 'light'
            : 'dark'
    } catch (error) {
        console.warn('Не удалось прочитать сохранённую тему', error)
        return 'dark'
    }
}

export const AppThemeProvider = () => {
    const [theme, setTheme] = useState<AppTheme>(getInitialTheme)
    const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme)
        } catch (error) {
            console.warn('Не удалось сохранить выбранную тему', error)
        }
    }, [theme])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.repeat ||
                !event.ctrlKey ||
                !event.altKey ||
                !event.shiftKey ||
                event.keyCode !== 84
            ) {
                return
            }

            event.preventDefault()
            document.documentElement.classList.add(THEME_TRANSITION_CLASS)
            if (transitionTimeout.current !== null) {
                clearTimeout(transitionTimeout.current)
            }
            transitionTimeout.current = setTimeout(() => {
                document.documentElement.classList.remove(THEME_TRANSITION_CLASS)
                transitionTimeout.current = null
            }, THEME_TRANSITION_DURATION_MS)
            setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            if (transitionTimeout.current !== null) {
                clearTimeout(transitionTimeout.current)
            }
            document.documentElement.classList.remove(THEME_TRANSITION_CLASS)
        }
    }, [])

    return (
        <ThemeProvider theme={theme}>
            <App />
            <ScreenSaver />
        </ThemeProvider>
    )
}
