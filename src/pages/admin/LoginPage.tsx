import { useState } from 'react'
import { Button, Text, Card } from '@gravity-ui/uikit'
import { FormInput } from '@/components/molecules'
import { useLoginAdminMutation } from '@/hooks/mutations/useAuthMutations'

const LoginPage = () => {
    const loginMutation = useLoginAdminMutation()
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')

    // Ошибки приходят в mutation.error.errors
    const fieldErrors = loginMutation.error?.errors || {}

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await loginMutation.mutateAsync({ login, password })
        } catch (error) {
            // Ошибка уже обработана в mutation.error
            console.error(error)
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: 'var(--g-color-base-background)',
            }}
        >
            <Card
                style={{
                    padding: '32px',
                    width: '100%',
                    maxWidth: '400px',
                }}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Text variant="display-1">REGA</Text>
                            <Text
                                variant="body-2"
                                color="secondary"
                                style={{ marginTop: '8px', display: 'block' }}
                            >
                                Вход в панель администратора
                            </Text>
                        </div>

                        <FormInput
                            label="Логин"
                            required
                            placeholder="Введите логин"
                            value={login}
                            onUpdate={setLogin}
                            size="xl"
                            autoComplete="username"
                            error={fieldErrors.login}
                        />

                        <FormInput
                            label="Пароль"
                            required
                            placeholder="Введите пароль"
                            type="password"
                            value={password}
                            onUpdate={setPassword}
                            size="xl"
                            autoComplete="current-password"
                            error={fieldErrors.password}
                        />

                        {fieldErrors.authorize && (
                            <Text variant="body-1" color="danger">
                                {fieldErrors.authorize}
                            </Text>
                        )}

                        <Button
                            type="submit"
                            view="action"
                            size="xl"
                            width="max"
                            loading={loginMutation.isPending}
                            disabled={!login || !password}
                        >
                            Войти
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default LoginPage
