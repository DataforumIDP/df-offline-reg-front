import React from 'react' // ← 1. Импортируем useEffect
import 'react-phone-input-2/lib/style.css'
import PI from 'react-phone-input-2'
import { Label, PhoneInputWrapper } from './PhoneInput.styles'

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    label?: string
    country?: string
}

const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    label = 'Телефон',
    country = 'ru',
    ...props
}) => {
    return (
        <PhoneInputWrapper {...props}>
            <Label>{label}</Label>
            <PI
                country={country}
                value={value}
                onChange={onChange}
                enableSearch={true}
                searchPlaceholder="Поиск страны..."
                searchNotFound="Страна не найдена"
            />
        </PhoneInputWrapper>
    )
}

export default PhoneInput
