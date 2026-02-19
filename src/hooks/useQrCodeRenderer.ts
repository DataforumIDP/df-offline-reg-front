import { useRef, useEffect } from 'react'
import QRCodeStyling from 'qr-code-styling'

export const useQrCodeRenderer = (data: string | null) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const qrInstanceRef = useRef<QRCodeStyling | null>(null)

    useEffect(() => {
        qrInstanceRef.current = new QRCodeStyling({
            width: 200,
            height: 200,
            type: 'svg',
            margin: 2,
            dotsOptions: {
                color: '#000',
                type: 'rounded',
            },
            backgroundOptions: {
                color: '#fff',
            },
            cornersSquareOptions: {
                type: 'extra-rounded',
            },
            cornersDotOptions: {
                type: 'dot',
            },
        })
    }, [])

    useEffect(() => {
        if (!data || !qrInstanceRef.current || !containerRef.current) return

        qrInstanceRef.current.update({ data })
        containerRef.current.innerHTML = ''
        qrInstanceRef.current.append(containerRef.current)
    }, [data])

    return containerRef
}
