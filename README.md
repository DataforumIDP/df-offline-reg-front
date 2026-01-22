# React TypeScript Project

Стартовый проект на React + TypeScript с использованием современных библиотек и инструментов.

## 📦 Технологии

- **React 18** - UI библиотека
- **TypeScript** - Язык программирования с типами
- **Vite** - Сборщик проекта
- **Redux Toolkit** - Управление состоянием
- **React Router** - Маршрутизация
- **Gravity UI** - UI компоненты от Yandex
- **TanStack React Query** - Управление асинхронными данными
- **Axios** - HTTP клиент
- **React Hook Form** - Управление формами с валидацией
- **date-fns** - Работа с датами и временем

## 📁 Структура проекта

```
src/
├── components/
│   ├── atoms/       # Базовые компоненты (Button, Input, etc.)
│   ├── molecules/   # Комбинации атомов (Form, Card, etc.)
│   └── organisms/   # Сложные компоненты (Layout, Header, etc.)
├── pages/           # Страницы приложения
├── store/
│   ├── store.ts     # Redux store конфигурация
│   ├── hooks.ts     # Redux хуки (useAppDispatch, useAppSelector)
│   └── slices/      # Redux слайсы
├── services/        # API сервисы
├── hooks/           # Пользовательские хуки
├── types/           # TypeScript интерфейсы
├── utils/           # Утилиты и помощники
├── styles/          # Глобальные стили
├── router/          # Маршруты приложения
├── App.tsx          # Главный компонент
└── main.tsx         # Точка входа
```

## 🚀 Начало работы

### Установка зависимостей

\`\`\`bash
npm install
\`\`\`

### Разработка

\`\`\`bash
npm run dev
```

Приложение откроется на [http://localhost:3000](http://localhost:3000)

### Сборка для продакшена

```bash
npm run build
```

### Просмотр собранного проекта

```bash
npm run preview
```

## 📋 Atomic Design

Проект использует методологию Atomic Design для организации компонентов:

- **Atoms** (Атомы) - Базовые компоненты (кнопка, инпут, текст)
- **Molecules** (Молекулы) - Комбинации атомов (поле формы, карточка)
- **Organisms** (Организмы) - Сложные компоненты (форма, навигация)
- **Templates** (Шаблоны) - Макеты страниц
- **Pages** (Страницы) - Полные страницы приложения

## 🔧 Конфигурация

### Path Aliases

В `tsconfig.json` и `vite.config.ts` настроены алиасы для удобного импорта:

```typescript
import Button from '@components/atoms/Button'
import apiService from '@services/api'
import { useAppDispatch } from '@store/hooks'
```

## 📚 Примеры

### Использование Redux

```typescript
import { useAppDispatch, useAppSelector } from '@hooks'
import { increment } from '@store/slices/counterSlice'

function Counter() {
  const dispatch = useAppDispatch()
  const count = useAppSelector(state => state.counter.value)

  return (
    <button onClick={() => dispatch(increment())}>
      Count: {count}
    </button>
  )
}
```

### Использование React Hook Form

```typescript
import { useForm, Controller } from 'react-hook-form'
import Input from '@components/molecules/Input'

function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email обязателен' }}
        render={({ field }) => (
          <Input {...field} label="Email" error={!!errors.email} />
        )}
      />
    </form>
  )
}
```

### Использование useDebounce

```typescript
import { useState } from 'react'
import { useDebounce } from '@hooks'

function SearchComponent() {
  const [input, setInput] = useState('')
  const debouncedValue = useDebounce(input, 500)

  // debouncedValue обновится только через 500мс после прекращения ввода
  
  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Поиск..."
    />
  )
}
```

### Использование date-fns

```typescript
import { formatDate, formatDateTime, getRelativeTime } from '@utils/helpers'

// Форматирование даты
const dateStr = formatDate(new Date()) // "24.12.2025"

// Форматирование даты и времени
const dateTimeStr = formatDateTime(new Date()) // "24.12.2025 14:30"

// Относительное время
const relativeTime = getRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
// "2 дня назад"
```

### Использование React Query

```typescript
import { useApiQuery } from '@hooks/useApi'

function UserList() {
  const { data: users, isLoading } = useApiQuery(
    ['users'],
    '/users'
  )

  if (isLoading) return <p>Загрузка...</p>
  return <div>{/* Отрисовка пользователей */}</div>
}
```

### Использование API сервиса

```typescript
import apiService from '@services/api'

async function fetchData() {
  try {
    const response = await apiService.get('/endpoint')
    console.log(response.data)
  } catch (error) {
    console.error('Ошибка:', error)
  }
}
```

## 📝 Лицензия

MIT
