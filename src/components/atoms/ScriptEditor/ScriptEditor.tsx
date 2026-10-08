import Editor, { BeforeMount } from '@monaco-editor/react'
import { Text, Button } from '@gravity-ui/uikit'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface ScriptEditorProps {
    value: string | null
    onChange: (value: string | null) => void
    label: string
    description?: string
    /** Тип скрипта влияет на jsdoc-подсказку для свойства user */
    scriptType: 'pre' | 'post' | 'runtime'
}

const PRE_SCRIPT_TYPES = `
interface AxiosResponse<T = any> {
    data: T
    status: number
    headers: Record<string, any>
}
interface AxiosInstance {
    get<T = any>(url: string, config?: Record<string, any>): Promise<AxiosResponse<T>>
    post<T = any>(url: string, data?: any, config?: Record<string, any>): Promise<AxiosResponse<T>>
    put<T = any>(url: string, data?: any, config?: Record<string, any>): Promise<AxiosResponse<T>>
    delete<T = any>(url: string, config?: Record<string, any>): Promise<AxiosResponse<T>>
}
interface AttachmentOption {
    /** Имя файла во вложении, включая расширение */
    filename: string
    /** Прямая ссылка на файл; будет скачан и приложен к письму */
    url?: string
    /** Готовый base64 без префикса data:... */
    base64?: string
}
interface MailOptions {
    /** slug email-аккаунта */
    slug: string
    /** Получатель(и) */
    mail: string | string[]
    /** HTML или ссылка на HTML-файл */
    html: string
    /** Тема письма */
    theme: string
    /** Параметры для подстановки: { "%name%": "Иван" } */
    params?: Record<string, string>
    /** Вложения; для RuSender будут перекодированы в base64 */
    attachments?: AttachmentOption[]
}
interface Utils {
    /** HTTP-клиент — поддерживает get / post / put / delete */
    axios: AxiosInstance
    /** Транслитерация русского текста в латиницу */
    translitRuToEn(str: string): string
    /** Отправить письмо через сохранённый email-аккаунт */
    mail(opts: MailOptions): Promise<{ ok: boolean; recipients: number }>
    /** Лог в серверную консоль */
    log(message: string, meta?: any): Promise<{ ok: boolean }>
    /** Источник регистрации: 'webhook' | 'excel' | 'form' */
    origin: 'webhook' | 'excel' | 'form' | 'runtime'
}
/** Данные, которые пришли в теле запроса от пользователя (сырые, до валидации). */
interface RequestData {
    /** Сырые данные из тела запроса вебхука */
    user: Record<string, any>
    /** Набор утилит : axios, translitRuToEn, mail, origin */
    utils: Utils
}
`

const POST_SCRIPT_TYPES = `
interface AxiosResponse<T = any> {
    data: T
    status: number
    headers: Record<string, any>
}
interface AxiosInstance {
    get<T = any>(url: string, config?: Record<string, any>): Promise<AxiosResponse<T>>
    post<T = any>(url: string, data?: any, config?: Record<string, any>): Promise<AxiosResponse<T>>
    put<T = any>(url: string, data?: any, config?: Record<string, any>): Promise<AxiosResponse<T>>
    delete<T = any>(url: string, config?: Record<string, any>): Promise<AxiosResponse<T>>
}
interface AttachmentOption {
    /** Имя файла во вложении, включая расширение */
    filename: string
    /** Прямая ссылка на файл; будет скачан и приложен к письму */
    url?: string
    /** Готовый base64 без префикса data:... */
    base64?: string
}
interface MailOptions {
    /** slug email-аккаунта */
    slug: string
    /** Получатель(и) */
    mail: string | string[]
    /** HTML или ссылка на HTML-файл */
    html: string
    /** Тема письма */
    theme: string
    /** Параметры для подстановки: { "%name%": "Иван" } */
    params?: Record<string, string>
    /** Вложения; для RuSender будут перекодированы в base64 */
    attachments?: AttachmentOption[]
}
interface Utils {
    /** HTTP-клиент — поддерживает get / post / put / delete */
    axios: AxiosInstance
    /** Транслитерация русского текста в латиницу */
    translitRuToEn(str: string): string
    /** Отправить письмо через сохранённый email-аккаунт */
    mail(opts: MailOptions): Promise<{ ok: boolean; recipients: number }>
    /** Лог в серверную консоль */
    log(message: string, meta?: any): Promise<{ ok: boolean }>
    /** Источник регистрации: 'webhook' | 'excel' | 'form' */
    origin: 'webhook' | 'excel' | 'form' | 'runtime'
}
/** Данные участника после сохранения в базе данных. */
interface RequestData {
    /** Поля участника, сохранённые в БД (прошедшие валидацию) */
    user: Record<string, any>
    /** Набор утилит : axios, translitRuToEn, mail, origin */
    utils: Utils
}
`

const RUNTIME_SCRIPT_TYPES = `
/** Markdown-текст для записи в runtime-журнал */
type MD = string
/** Событие сканирования участника */
interface ScanEvent {
    /** Название зоны сканирования */
    zone: string
    /** Время события в формате ISO */
    timestamp: string
}
interface Utils {
    /** Транслитерация русского текста в латиницу */
    translitRuToEn(str: string): string
    /** Лог в серверную консоль */
    log(message: string, meta?: any): Promise<{ ok: boolean }>
    /** Записать Markdown-сообщение в журнал текущего запуска */
    logger(text: MD): Promise<{ ok: boolean }>
    /** Источник выполнения */
    origin: 'runtime'
}
/** Данные участника, обрабатываемого runtime-скриптом. */
interface RequestData {
    /** Поля участника из базы данных; верните изменённый объект */
    user: Record<string, any>
    /** События сканирования участника */
    scans: ScanEvent[]
    /** Набор утилит: translitRuToEn, log, logger, origin */
    utils: Utils
}
`

const PLACEHOLDER = `(data: RequestData) => {
    const user = data.user
    // Верните изменённые данные
    return user
}`

const RUNTIME_PLACEHOLDER = `(data: RequestData) => {
    const user = data.user
    const scans = data.scans // [{ zone, timestamp }, ...]
    // await data.utils.logger('## Отладка: участник ' + data.user.id)
    // Верните изменённые данные участника
    return user
}`

// ── Space Ocean Kit Refined theme ──────────────────────────────────────────
const SPACE_OCEAN_THEME = {
    base: 'vs-dark',
    inherit: false,
    colors: {
        'editor.background': '#0d1b2a',
        'editor.foreground': '#c0c5ce',
        'editor.lineHighlightBackground': '#112236',
        'editor.lineHighlightBorder': '#112236',
        'editor.selectionBackground': '#1e3a5f',
        'editor.inactiveSelectionBackground': '#162d48',
        'editor.selectionHighlightBackground': '#1b3350',
        'editor.findMatchBackground': '#1e3a5f',
        'editor.findMatchHighlightBackground': '#162d48',
        'editorCursor.foreground': '#96b5b4',
        'editorLineNumber.foreground': '#8891a2',
        'editorLineNumber.activeForeground': '#c0c5ce',
        'editorIndentGuide.background': '#353b49',
        'editorIndentGuide.activeBackground': '#669190',
        'editorWidget.background': '#0d1b2a',
        'editorWidget.border': '#1e3a5f',
        'editorSuggestWidget.background': '#0d1b2a',
        'editorSuggestWidget.border': '#1e3a5f',
        'editorSuggestWidget.foreground': '#c0c5ce',
        'editorSuggestWidget.selectedBackground': '#1e3a5f',
        'editorSuggestWidget.highlightForeground': '#7ec8e3',
        'editorHoverWidget.background': '#0d1b2a',
        'editorHoverWidget.border': '#1e3a5f',
        'editorError.foreground': '#bf5f69',
        'editorWarning.foreground': '#ebcb8b',
        'editorInfo.foreground': '#96b5b4',
        'scrollbar.shadow': '#060e18',
        'scrollbarSlider.background': '#1e3a5f',
        'scrollbarSlider.hoverBackground': '#163050',
        'scrollbarSlider.activeBackground': '#163050',
    },
    rules: [
        // базовый текст
        { token: '', foreground: 'c0c5ce' },
        // ключевые слова: const, let, return, if…
        { token: 'keyword', foreground: 'c792ea', fontStyle: 'italic' },
        { token: 'keyword.flow', foreground: 'c792ea', fontStyle: 'italic' },
        { token: 'storage.type', foreground: 'c792ea', fontStyle: 'italic' },
        { token: 'storage', foreground: 'c792ea' },
        // строки
        { token: 'string', foreground: 'c3e88d' },
        { token: 'string.escape', foreground: '7ec8e3' },
        // числа
        { token: 'number', foreground: 'f78c6c' },
        // булевы / null / undefined / this
        { token: 'constant', foreground: '7ec8e3' },
        { token: 'constant.language', foreground: '7ec8e3' },
        // комментарии
        { token: 'comment', foreground: '546e7a', fontStyle: 'italic' },
        // типы / классы
        { token: 'type.identifier', foreground: 'ffcb6b' },
        { token: 'entity.name.type', foreground: 'ffcb6b' },
        // идентификаторы
        { token: 'identifier', foreground: 'c0c5ce' },
        // операторы
        { token: 'operator', foreground: '89ddff' },
        // разделители
        { token: 'delimiter', foreground: 'c0c5ce' },
        { token: 'delimiter.bracket', foreground: 'c0c5ce' },
        { token: 'delimiter.parenthesis', foreground: 'c0c5ce' },
        { token: 'delimiter.curly', foreground: 'c0c5ce' },
        // регулярки
        { token: 'regexp', foreground: '7ec8e3' },
        // переменные
        { token: 'variable', foreground: 'f07178' },
    ],
}

// ── Monaco beforeMount: регистрируем тему и типы ──────────────────────────
const configureMonaco =
    (scriptType: 'pre' | 'post' | 'runtime'): BeforeMount =>
    (monaco) => {
        // Тема
        monaco.editor.defineTheme('space-ocean', SPACE_OCEAN_THEME)

        const typeDefs =
            scriptType === 'pre'
                ? PRE_SCRIPT_TYPES
                : scriptType === 'runtime'
                  ? RUNTIME_SCRIPT_TYPES
                  : POST_SCRIPT_TYPES

        const tsDefaults = monaco.languages.typescript.typescriptDefaults

        tsDefaults.setEagerModelSync(true)

        tsDefaults.addExtraLib(typeDefs, 'ts:webhook-types.d.ts')

        tsDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            strict: false,
            noLib: false,
        })

        tsDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        })
    }

export const ScriptEditor = ({
    value,
    onChange,
    label,
    description,
    scriptType,
}: ScriptEditorProps) => {
    const placeholder = scriptType === 'runtime' ? RUNTIME_PLACEHOLDER : PLACEHOLDER
    const displayValue = value ?? placeholder
    const [fullscreen, setFullscreen] = useState(false)

    const editorPath = `webhook-${scriptType}-script.ts`

    const exitFullscreen = useCallback(() => setFullscreen(false), [])

    useEffect(() => {
        if (!fullscreen) {
            return
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitFullscreen()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [fullscreen, exitFullscreen])

    const handleChange = (val: string | undefined) => {
        const trimmed = val?.trim() ?? ''
        onChange(trimmed === '' || trimmed === placeholder.trim() ? null : trimmed)
    }

    const HEADER_H = 49

    // Единственный экземпляр редактора — рендерится либо в портале, либо в обычном месте
    const editor = fullscreen ? (
        <Editor
            height={`calc(100vh - ${HEADER_H}px)`}
            language="typescript"
            theme="space-ocean"
            path={editorPath}
            value={displayValue}
            beforeMount={configureMonaco(scriptType)}
            onChange={handleChange}
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                quickSuggestions: { other: true, comments: false, strings: false },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                parameterHints: { enabled: true },
                hover: { enabled: true },
                folding: false,
                renderLineHighlight: 'line',
                padding: { top: 12, bottom: 12 },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { vertical: 'auto', alwaysConsumeMouseWheel: false },
            }}
        />
    ) : (
        <Editor
            height="520px"
            language="typescript"
            theme="space-ocean"
            path={editorPath}
            value={displayValue}
            beforeMount={configureMonaco(scriptType)}
            onChange={handleChange}
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                quickSuggestions: { other: true, comments: false, strings: false },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                parameterHints: { enabled: true },
                hover: { enabled: true },
                folding: false,
                renderLineHighlight: 'line',
                padding: { top: 36, bottom: 8 },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                scrollbar: { vertical: 'hidden', alwaysConsumeMouseWheel: false },
            }}
        />
    )

    return (
        <>
            {/* Fullscreen portal — рендерится в document.body, минуя stacking context Dialog */}
            {fullscreen &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99999,
                            background: '#0d1b2a',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                height: HEADER_H,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 16px',
                                borderBottom: '1px solid #1e3a5f',
                                flexShrink: 0,
                            }}
                        >
                            <Text variant="subheader-2" style={{ color: '#c0c5ce' }}>
                                {label}
                            </Text>
                            <Button view="flat" size="s" onClick={exitFullscreen}>
                                Свернуть ✕
                            </Button>
                        </div>
                        <div style={{ height: `calc(100vh - ${HEADER_H}px)` }}>{editor}</div>
                    </div>,
                    document.body,
                )}

            {/* Обычный вид — всегда в DOM, редактор скрыт когда открыт fullscreen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <label
                        style={{
                            display: 'block',
                            fontSize: '12px',
                            color: 'var(--g-color-text-secondary)',
                        }}
                    >
                        {label}
                    </label>
                    <Button
                        view="flat"
                        size="xs"
                        onClick={() => setFullscreen(true)}
                        title="Развернуть на весь экран"
                    >
                        ⛶
                    </Button>
                </div>

                {description && (
                    <Text variant="caption-2" color="secondary">
                        {description}
                    </Text>
                )}

                <div
                    style={{
                        border: '1px solid var(--g-color-line-generic)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: fullscreen ? 'none' : undefined,
                    }}
                >
                    {!fullscreen && editor}
                </div>

                <Text variant="caption-2" color="secondary">
                    Стрелочная функция{' '}
                    <code style={{ fontFamily: 'monospace' }}>
                        (data: RequestData) =&gt; {'{ ... }'}
                    </code>
                    . Введите <code style={{ fontFamily: 'monospace' }}>data.</code> для
                    авто-дополнения. Очистите поле, чтобы отключить скрипт.
                </Text>
            </div>
        </>
    )
}
