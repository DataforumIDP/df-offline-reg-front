import { useState, useEffect } from 'react'

export const useCountdown = (initialSeconds: number) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds)

    useEffect(() => {
        if (initialSeconds <= 0) return

        setTimeLeft(initialSeconds)

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [initialSeconds])

    const formatted = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`

    return { timeLeft, formatted }
}
