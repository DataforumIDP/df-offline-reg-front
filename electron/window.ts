import { BrowserWindow, Menu, shell, dialog, HandlerDetails, Event as ElectronEvent, Input } from 'electron'
import * as path from 'path'

export function createMainWindow(isDev: boolean, iconPath: string, __dirname: string) {
    // Correct preload path for both dev and prod
    const preloadPath = isDev
        ? path.join(__dirname, 'preload.js')
        : path.join(process.cwd(), 'dist-electron', 'preload.js')
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        fullscreenable: true,
        frame: false,
        kiosk: false,
        autoHideMenuBar: true,
        icon: iconPath,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev,
        },
    })
    Menu.setApplicationMenu(null)
    if (isDev) {
        mainWindow.loadURL('http://localhost:3100')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }
    mainWindow.webContents.setWindowOpenHandler(({ url }: HandlerDetails) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })
    return mainWindow
}
