# Линтинг и форматирование кода

Проект использует **ESLint** для проверки качества кода и **Prettier** для автоматического форматирования.

## 📋 Установка

ESLint и Prettier уже добавлены в `devDependencies`. Установите зависимости:

```bash
yarn install
```

## 🔍 ESLint

ESLint проверяет код на ошибки, потенциальные проблемы и нарушения правил стиля.

### Команды

- **Проверить код**
  ```bash
  yarn lint
  ```

- **Автоматически исправить ошибки**
  ```bash
  yarn lint:fix
  ```

### Конфигурация

Настройки ESLint находятся в файле [`.eslintrc.json`](./.eslintrc.json)

**Используемые плагины:**
- `@typescript-eslint` - поддержка TypeScript
- `react` - специфичные для React правила
- `react-hooks` - проверка правил React Hooks
- `react-refresh` - проверка совместимости с Fast Refresh

**Основные правила:**
- ✅ Строгая типизация TypeScript
- ✅ No console.log в продакшене (только warn и error)
- ✅ Использование `const` вместо `let` где возможно
- ✅ Строгое равенство (`===` вместо `==`)
- ✅ Одиночные кавычки
- ✅ Нет точек с запятыми
- ✅ Обязательные фигурные скобки в конструкциях

## 🎨 Prettier

Prettier автоматически форматирует код согласно установленным правилам.

### Команды

- **Отформатировать код**
  ```bash
  yarn format
  ```

- **Проверить форматирование без изменений**
  ```bash
  yarn format:check
  ```

### Конфигурация

Настройки Prettier находятся в файле [`.prettierrc.json`](./.prettierrc.json)

**Основные параметры:**
- Без точек с запятыми (`semi: false`)
- Одиночные кавычки (`singleQuote: true`)
- Отступ 2 пробела (`tabWidth: 2`)
- Длина строки 100 символов (`printWidth: 100`)
- Unix переводы строк (`endOfLine: "lf"`)

## 🚀 Интеграция с редактором

### VS Code

1. Установите расширения:
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

2. Добавьте в `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

### WebStorm/PhpStorm

1. Перейдите в **Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**
2. Включите ESLint
3. Перейдите в **Settings → Languages & Frameworks → JavaScript → Prettier**
4. Установите Prettier и включите автоформатирование при сохранении

## 📝 Правила для разработчиков

### Игнорирование правил (когда необходимо)

Если нужно игнорировать правило для конкретной строки:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const value: any = data
```

Или для целого файла в начале файла:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Типичные проблемы

- **Неиспользуемые переменные**: используйте `_` в начале имени
  ```typescript
  const _unusedVar = 'value' // Ok
  ```

- **Функции без явного типа возврата**: добавьте тип
  ```typescript
  // ❌ Bad
  function getValue() {
    return 'value'
  }

  // ✅ Good
  function getValue(): string {
    return 'value'
  }
  ```

- **console.log**: используйте только в разработке или замените на console.warn/error
  ```typescript
  // ❌ Bad
  console.log('debug')

  // ✅ Good
  console.warn('warning')
  console.error('error')
  ```

## 🔄 Pre-commit Hook (опционально)

Для автоматического запуска линтера перед коммитом, добавьте в `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

## 📚 Дополнительные ресурсы

- [ESLint документация](https://eslint.org/docs/rules/)
- [Prettier документация](https://prettier.io/docs/en/index.html)
- [TypeScript ESLint плагин](https://typescript-eslint.io/)
