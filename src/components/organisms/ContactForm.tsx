import { useForm, Controller } from 'react-hook-form'
import { Card, Text, TextInput, TextArea, Button, Alert, Flex } from '@gravity-ui/uikit'

interface FormInputs {
  name: string
  email: string
  phone?: string
  message?: string
}

const ContactForm = () => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  })

  const onSubmit = (data: FormInputs) => {
    console.warn('Form data:', data)
    // Здесь можно отправить данные на сервер
    reset()
  }

  return (
    <Card view="raised" style={{ padding: '32px', maxWidth: 600, margin: '0 auto' }}>
      <Text variant="header-1" style={{ marginBottom: '16px', display: 'block' }}>
        Контактная форма
      </Text>

      {Object.keys(errors).length > 0 && (
        <Alert theme="danger" message="Пожалуйста, заполните все требуемые поля корректно" style={{ marginBottom: '16px' }} />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="4">
          <Controller
            name="name"
            control={control}
            rules={{
              required: 'ФИО обязательно',
              minLength: { value: 2, message: 'Минимум 2 символа' },
            }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="ФИО"
                error={errors.name?.message}
                onUpdate={field.onChange}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Email обязателен',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Неверный email адрес',
              },
            }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Email"
                type="email"
                error={errors.email?.message}
                onUpdate={field.onChange}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            rules={{
              pattern: {
                value: /^[0-9\-+()]{0,20}$/,
                message: 'Неверный формат телефона',
              },
            }}
            render={({ field }) => (
              <TextInput
                {...field}
                label="Телефон (опционально)"
                error={errors.phone?.message}
                onUpdate={field.onChange}
              />
            )}
          />

          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                placeholder="Сообщение (опционально)"
                rows={4}
                onUpdate={field.onChange}
              />
            )}
          />

          <Flex gap="3">
            <Button type="submit" view="action" size="l" width="max">
              Отправить
            </Button>
            <Button type="button" view="outlined" size="l" width="max" onClick={() => reset()}>
              Очистить
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  )
}

export default ContactForm
