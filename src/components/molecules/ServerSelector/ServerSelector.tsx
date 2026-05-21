import { ServerSelector as ServerSelectorD } from './ServerSelector.desktop'
import { ServerSelector as ServerSelectorW } from './ServerSelector.web'

const IsWEB = import.meta.env.VITE_PLATFORM === 'web'

export const ServerSelector = () => {
    return IsWEB ? <ServerSelectorW /> : <ServerSelectorD />
}
