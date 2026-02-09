import { useState } from 'react'
import { Button, Text, Card } from '@gravity-ui/uikit'
import { FormInput } from '@/components/molecules'
import { useRegisterOperatorMutation } from '@/hooks/mutations/useAuthMutations'

const OperatorLoginPage = () => {
    const registerMutation = useRegisterOperatorMutation()
    const [project, setProject] = useState('')
    const [name, setName] = useState('')

    // Ошибки приходят в mutation.error.errors
    const fieldErrors = registerMutation.error?.errors || {}

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await registerMutation.mutateAsync({ project, name })
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
                                Вход в панель оператора
                            </Text>
                        </div>

                        <FormInput
                            label="Код мероприятия"
                            required
                            placeholder="Введите код мероприятия"
                            value={project}
                            onUpdate={setProject}
                            size="xl"
                            autoComplete="off"
                            error={fieldErrors.project}
                        />

                        <FormInput
                            label="ФИО"
                            required
                            placeholder="Введите ваше ФИО"
                            value={name}
                            onUpdate={setName}
                            size="xl"
                            autoComplete="name"
                            error={fieldErrors.name}
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
                            loading={registerMutation.isPending}
                            disabled={!project || !name}
                        >
                            Войти
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default OperatorLoginPage
