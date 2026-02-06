// Пример Organism компонента - форма с несколькими полями

import { Card, Text, TextInput, Button, Flex } from '@gravity-ui/uikit'
import React, { useState } from 'react'

interface FormData {
    name: string
    email: string
}

const RegistrationForm = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
    })

    const handleChange = (value: string, name: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.warn('Form submitted:', formData)
    }

    return (
        <Card view="raised" style={{ padding: '32px', maxWidth: 500, margin: '0 auto' }}>
            <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
                Регистрация
            </Text>

            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="4">
                    <TextInput
                        label="ФИО"
                        name="name"
                        value={formData.name}
                        onUpdate={(value) => handleChange(value, 'name')}
                    />

                    <TextInput
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onUpdate={(value) => handleChange(value, 'email')}
                    />

                    <Button type="submit" view="action" size="l" width="max">
                        Зарегистрироваться
                    </Button>
                </Flex>
            </form>
        </Card>
    )
}

export default RegistrationForm
