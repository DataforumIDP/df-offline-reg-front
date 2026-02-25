import { BrowserWindow, Menu, shell, HandlerDetails } from 'electron'
import * as path from 'path'

export function createMainWindow(isDev: boolean, iconPath: string, __dirname: string) {
    // Correct preload path for both dev and prod
    const preloadPath = path.join(__dirname, 'preload.js')
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
            nodeIntegration: true,
            preload: preloadPath,
            contextIsolation: true,
            devTools: true,
            // Use sandbox to allow ESM preload modules in stable Electron
            sandbox: false,
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
