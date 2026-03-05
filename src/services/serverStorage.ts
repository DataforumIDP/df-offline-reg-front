const SERVERS_KEY = 'rega_servers'
const ACTIVE_SERVER_KEY = 'rega_active_server'

const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface ServerEntry {
    label: string
    url: string
    isDefault?: boolean
}

/** Сервер по умолчанию (из env) */
export const DEFAULT_SERVER: ServerEntry = {
    label: 'Dataforum PROD1',
    url: DEFAULT_URL,
    isDefault: true,
}

/** Загрузить пользовательские серверы из localStorage */
export const loadCustomServers = (): ServerEntry[] => {
    try {
        const data = localStorage.getItem(SERVERS_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

/** Сохранить пользовательские серверы */
export const saveCustomServers = (servers: ServerEntry[]) => {
    localStorage.setItem(SERVERS_KEY, JSON.stringify(servers))
}

/** Получить все серверы (дефолтный + пользовательские) */
export const getAllServers = (): ServerEntry[] => {
    return [DEFAULT_SERVER, ...loadCustomServers()]
}

/** Добавить пользовательский сервер */
export const addCustomServer = (label: string, url: string): ServerEntry => {
    const entry: ServerEntry = { label, url }
    const servers = loadCustomServers()
    servers.push(entry)
    saveCustomServers(servers)
    return entry
}

/** Удалить пользовательский сервер */
export const removeCustomServer = (url: string) => {
    const servers = loadCustomServers().filter((s) => s.url !== url)
    saveCustomServers(servers)
    // Если удалённый был активным — сбрасываем на дефолт
    const active = getActiveServerUrl()
    if (active === url) {
        clearActiveServer()
    }
}

/** Получить URL активного сервера */
export const getActiveServerUrl = (): string => {
    return localStorage.getItem(ACTIVE_SERVER_KEY) || DEFAULT_URL
}

/** Установить активный сервер */
export const setActiveServer = (url: string) => {
    localStorage.setItem(ACTIVE_SERVER_KEY, url)
}

/** Сбросить на дефолтный */
export const clearActiveServer = () => {
    localStorage.removeItem(ACTIVE_SERVER_KEY)
}
