# React Query Integration Guide

## Структура

### 1. Fetch-функции (`services/api/`)

Чистые асинхронные функции для работы с API (axios).

```typescript
// services/api/auth.ts
export const fetchLoginAdmin = (credentials: LoginRequest): Promise<LoginResponse> => {
  return apiClient.post<LoginResponse>('/accounts/auth/admin', credentials).then(res => res.data)
}
```

**Файлы:**
- `auth.ts` - авторизация, логин, выход
- `projects.ts` - CRUD проектов
- `participants.ts` - CRUD участников
- `templates.ts` - CRUD шаблонов печати
- `scheme.ts` - управление схемой полей проекта

### 2. React-Query хуки

#### Queries (`hooks/queries/`)

Для получения данных (читать).

```typescript
// hooks/queries/useProjectQueries.ts
export const useProjectsQuery = (params?: ProjectsQuery) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  })
}
```

**Использование в компонентах:**
```typescript
const { data, isLoading, error } = useProjectsQuery({ page: 1, limit: 20 })
```

#### Mutations (`hooks/mutations/`)

Для изменения данных (создание, обновление, удаление).

```typescript
// hooks/mutations/useProjectMutations.ts
export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => fetchCreateProject(data),
    onSuccess: () => {
      // Инвалидируем кэш
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
    },
  })
}
```

**Использование в компонентах:**
```typescript
const { mutate, isPending, error } = useCreateProjectMutation()

const handleCreate = async (formData) => {
  mutate(formData, {
    onSuccess: (data) => {
      console.log('Проект создан:', data)
    },
  })
}
```

## Примеры использования

### Пример 1: Список проектов

```typescript
import { useProjectsQuery } from '@/hooks'

const ProjectsPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useProjectsQuery({
    page,
    limit: 20,
    search,
  })

  if (isLoading) return <div>Загружаю...</div>
  if (error) return <div>Ошибка: {error.message}</div>

  return (
    <div>
      {data?.records.map(project => (
        <div key={project.id}>{project.title}</div>
      ))}
    </div>
  )
}
```

### Пример 2: Создание участника

```typescript
import { useCreateParticipantMutation } from '@/hooks'

const CreateParticipantForm = ({ projectId }) => {
  const mutation = useCreateParticipantMutation(projectId)

  const handleSubmit = async (formData) => {
    try {
      await mutation.mutateAsync({
        data: formData,
      })
      // Успешно! Кэш автоматически обновлён
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(/* data */)
    }}>
      {/* форма */}
      <button disabled={mutation.isPending}>
        {mutation.isPending ? 'Создаю...' : 'Создать'}
      </button>
      {mutation.error && <div>{mutation.error.message}</div>}
    </form>
  )
}
```

### Пример 3: Обновление с инвалидацией

```typescript
import { useUpdateProjectMutation } from '@/hooks'

const EditProjectForm = ({ projectId }) => {
  const mutation = useUpdateProjectMutation()

  const handleUpdate = async (formData) => {
    await mutation.mutateAsync({
      id: projectId,
      data: formData,
    })
    // Кэш обновлён автоматически:
    // - invalidate(['projects'])
    // - invalidate(['project', projectId])
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleUpdate(/* data */)
    }}>
      {/* форма */}
    </form>
  )
}
```

## Инвалидация кэша

При мутации автоматически инвалидируются связанные куэрии:

| Операция | Инвалидируется |
|----------|---|
| `createProject` | `['projects']` |
| `updateProject` | `['projects']`, `['project', id]` |
| `deleteProject` | `['projects']` |
| `createParticipant` | `['participants', projectId]` |
| `updateParticipant` | `['participants', projectId]`, `['participant', projectId, id]` |
| `deleteParticipant` | `['participants', projectId]`, `['participant-logs-stats', projectId]` |
| `printParticipant` | `['participant-logs-stats', projectId]` |

## Кэширование (staleTime)

- **Проекты**: 5 минут (редко меняются)
- **Участники**: 2 минуты (часто меняются)
- **Статистика**: 10 минут (справочные данные)

## Обработка ошибок

```typescript
const { mutate, error, isPending } = useSomeMutation()

{error && (
  <Text color="danger">
    {error.message}
  </Text>
)}
```

Сервер возвращает ошибку в формате:
```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE"
}
```

Ошибки автоматически преобразуются в читаемые сообщения.
