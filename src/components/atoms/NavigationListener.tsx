import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAVIGATION_EVENT, NavigationEventDetail } from '@/utils/navigation'

/**
 * Компонент-слушатель для навигации из мест вне React.
 * Размещается внутри Router.
 */
const NavigationListener = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const handleNavigation = (event: Event) => {
            const { path, replace } = (event as CustomEvent<NavigationEventDetail>).detail
            navigate(path, { replace })
        }

        window.addEventListener(NAVIGATION_EVENT, handleNavigation)
        return () => {
            window.removeEventListener(NAVIGATION_EVENT, handleNavigation)
        }
    }, [navigate])

    return null
}

export default NavigationListener
