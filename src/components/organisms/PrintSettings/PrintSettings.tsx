import { PrintSettings as PrintSettingsD } from './PrintSettings.desktop'
import { PrintSettings as PrintSettingsW } from './PrintSettings.web'

const IsWEB = import.meta.env.VITE_PLATFORM === 'web'

const PrintSettings = () => {
    return !IsWEB ? <PrintSettingsW /> : <PrintSettingsD />
}

export default PrintSettings
