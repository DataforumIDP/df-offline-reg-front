/**
 * Утилита для навигации из мест вне React (например, axios interceptors).
 * Использует кастомные события вместо window.location.href,
 * что безопаснее для SPA и Electron.
 */

export const NAVIGATION_EVENT = 'app:navigate'

export interface NavigationEventDetail {
    path: string
    replace?: boolean
}

/**
 * Инициирует навигацию через кастомное событие.
 * Слушатель в React-компоненте вызовет navigate().
 */
export const dispatchNavigation = (path: string, replace = false) => {
    const event = new CustomEvent<NavigationEventDetail>(NAVIGATION_EVENT, {
        detail: { path, replace },
    })
    window.dispatchEvent(event)
}
