# REGA Desktop

Electron-приложение REGA с поддержкой:
- Полноэкранный режим по умолчанию
- Защита от случайного закрытия
- Встроенная печать через Ghostscript или pdf-to-printer
- OTA-обновления через собственный сервер

## Разработка

```bash
# Установка зависимостей
yarn install

# Запуск в режиме разработки (только web)
yarn dev

# Запуск с Electron
yarn dev:electron
```

## Сборка

```bash
# Собрать для Windows
yarn dist:win
```

Готовый инсталлятор будет в папке `release/`.

## Иконка приложения

Поместите `icon.ico` (256x256) в папку `build/`:

```
desctopApp/
├── build/
│   └── icon.ico
```

---

## OTA-обновления (Auto Update)

Приложение использует `electron-updater` с `generic` провайдером — это позволяет размещать обновления на любом веб-сервере (nginx, S3, собственный сервер).

### Структура файлов на сервере обновлений

После сборки (`yarn dist:win`) в папке `release/` появятся:

```
release/
├── rega-desktop-setup-0.1.23.exe    # Инсталлятор
├── rega-desktop-0.1.23.exe.blockmap # Diff-обновления
├── latest.yml                        # Метаданные версии
```

**Загрузите все файлы** на ваш сервер обновлений:

```
https://updates.your-domain.com/
├── rega-desktop-setup-0.1.23.exe
├── rega-desktop-0.1.23.exe.blockmap
├── latest.yml
```

### Формат latest.yml

```yaml
version: 0.1.23
files:
  - url: rega-desktop-setup-0.1.23.exe
    sha512: <sha512-hash>
    size: 123456789
path: rega-desktop-setup-0.1.23.exe
sha512: <sha512-hash>
releaseDate: '2026-02-19T12:00:00.000Z'
```

### Настройка сервера

#### Вариант 1: Nginx (самый простой)

```nginx
server {
    listen 443 ssl;
    server_name updates.your-domain.com;

    root /var/www/updates;

    location / {
        autoindex off;
        add_header Access-Control-Allow-Origin *;
    }

    location ~* \.(exe|yml|blockmap)$ {
        add_header Content-Disposition "attachment";
        add_header Access-Control-Allow-Origin *;
    }
}
```

#### Вариант 2: S3-совместимое хранилище

Можно использовать:
- MinIO (self-hosted)
- DigitalOcean Spaces
- Cloudflare R2
- Yandex Object Storage

Включите публичный доступ к бакету или настройте pre-signed URLs.

### Настройка в приложении

В приложении есть настройка "URL сервера обновлений" — укажите:

```
https://updates.your-domain.com/
```

Или программно:
```typescript
window.electronAPI?.setUpdateServer('https://updates.your-domain.com/')
```

### CI/CD пример (GitHub Actions → собственный сервер)

```yaml
name: Build and Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: yarn install
        
      - name: Build
        run: yarn dist:win
        env:
          UPDATE_SERVER_URL: ${{ secrets.UPDATE_SERVER_URL }}
          
      - name: Upload to server
        run: |
          scp release/*.exe release/*.yml release/*.blockmap user@server:/var/www/updates/
```

---

## Печать

### Режимы печати

1. **Native (Ghostscript)** — тихая печать напрямую на принтер
2. **PDF в браузере** — открывает PDF во внешнем браузере

### Требования для Native печати

Установите [Ghostscript](https://ghostscript.com/releases/gsdnld.html):
- Скачайте AGPL-версию для Windows (64-bit)
- Установите в стандартную папку (`C:\Program Files\gs\...`)
- Приложение автоматически найдёт `gswin64c.exe`

Без Ghostscript печать в режиме Native не работает — только режим "PDF в браузере".

### API для печати из renderer

```typescript
import { useElectronPrint } from '@/hooks/useElectron'

const { print, settings, printers, updateSettings } = useElectronPrint()

// Печать PDF (base64)
const result = await print(pdfBase64, 2) // 2 копии
// result: { success: true, mode: 'native', message: 'Отправлено на печать' }

// Сменить принтер
await updateSettings({ printer: 'HP LaserJet' })

// Режим PDF в браузере
await updateSettings({ mode: 'pdf-browser' })
```

---

## Заблокированные хоткеи

Для предотвращения выхода из киоск-режима заблокированы:
- `F12` — DevTools
- `Ctrl+Shift+I/J/C` — DevTools
- `Ctrl+N` — новое окно
- `Ctrl+T` — новая вкладка
- `Ctrl+U` — просмотр исходника

**Не заблокированы** (работают):
- `Ctrl+R`, `F5` — обновить
- `Escape` — выход из fullscreen
- Все хоткеи приложения

---

## Структура проекта

```
desctopApp/
├── electron/
│   ├── main.ts        # Main process
│   └── preload.ts     # Preload script (IPC bridge)
├── src/
│   ├── hooks/
│   │   └── useElectron.ts  # React hooks для Electron API
│   └── types/
│       └── electron.ts     # TypeScript types
├── build/
│   └── icon.ico       # Иконка приложения (нужно добавить)
├── tsconfig.electron.json
└── package.json
```
