import { useEffect, useRef, useState } from 'react'
import Logo from '@/assets/logo.svg?react'
import styles from './ScreenSaver.module.css'

const IDLE_TIMEOUT_MS = 3 * 60 * 1000
const LOGO_SPEED = 2.4

export const ScreenSaver = () => {
    const [active, setActive] = useState(false)
    const activeRef = useRef(active)
    const logoRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let idleTimeout: ReturnType<typeof setTimeout>
        const updateActive = (value: boolean) => {
            activeRef.current = value
            setActive(value)
        }

        const resetIdleTimeout = () => {
            clearTimeout(idleTimeout)
            if (!activeRef.current) {
                idleTimeout = setTimeout(() => updateActive(true), IDLE_TIMEOUT_MS)
            }
        }

        const handleActivity = (event: Event) => {
            if (
                event instanceof KeyboardEvent &&
                event.ctrlKey &&
                event.keyCode === 81
            ) {
                event.preventDefault()
                updateActive(true)
                return
            }

            if (activeRef.current) {
                updateActive(false)
            }
            resetIdleTimeout()
        }

        const activityEvents: Array<keyof WindowEventMap> = [
            'pointerdown',
            'pointermove',
            'touchstart',
            'wheel',
            'scroll',
        ]

        window.addEventListener('keydown', handleActivity)
        activityEvents.forEach((eventName) =>
            window.addEventListener(eventName, handleActivity, { passive: true }),
        )
        resetIdleTimeout()

        return () => {
            clearTimeout(idleTimeout)
            window.removeEventListener('keydown', handleActivity)
            activityEvents.forEach((eventName) =>
                window.removeEventListener(eventName, handleActivity),
            )
        }
    }, [])

    useEffect(() => {
        if (!active) {
            return
        }

        let animationFrame = 0
        let x = Math.max(0, (window.innerWidth - 72) / 2)
        let y = Math.max(0, (window.innerHeight - 72) / 2)
        let velocityX = LOGO_SPEED
        let velocityY = LOGO_SPEED

        const animate = () => {
            const logo = logoRef.current
            if (!logo) {
                animationFrame = window.requestAnimationFrame(animate)
                return
            }

            const maxX = Math.max(0, window.innerWidth - logo.offsetWidth)
            const maxY = Math.max(0, window.innerHeight - logo.offsetHeight)
            x += velocityX
            y += velocityY

            if (x <= 0 || x >= maxX) {
                velocityX *= -1
                x = Math.min(maxX, Math.max(0, x))
            }
            if (y <= 0 || y >= maxY) {
                velocityY *= -1
                y = Math.min(maxY, Math.max(0, y))
            }

            logo.style.transform = `translate(${x}px, ${y}px)`
            animationFrame = window.requestAnimationFrame(animate)
        }

        animationFrame = window.requestAnimationFrame(animate)
        return () => window.cancelAnimationFrame(animationFrame)
    }, [active])

    if (!active) {
        return null
    }

    return (
        <div className={styles.screenSaver} aria-label="Заставка">
            <div ref={logoRef} className={styles.logo} aria-hidden="true">
                <Logo />
            </div>
        </div>
    )
}
