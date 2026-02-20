
import { app } from 'electron'
import { fileURLToPath } from 'url'
import * as path from 'path'
const { autoUpdater } = require('electron-updater')
import { SimpleStore } from './store'
import { printPdfGhostscript } from './printJob'
import { PrintServer } from './printServer'
import { createMainWindow } from './window'
import { setupIPC } from './ipc'

// CommonJS: __filename and __dirname are available by default
// No need to redeclare them

let store: SimpleStore
let mainWindow: Electron.BrowserWindow | null = null
let printServer: PrintServer | null = null
let isQuitting = false
const isDev = !app.isPackaged


// ===== Single instance lock =====
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}

function getIconPath() {
    if (isDev) return path.join(__dirname, '../build/icon.ico')
    return path.join(process.resourcesPath, 'icon.ico')
}

function configureAutoUpdater() {
    const updateServer = store.get('updateServer')
    if (!updateServer) {
        console.log('[Updater] No update server configured')
        return
    }
    autoUpdater.setFeedURL({ provider: 'generic', url: updateServer })
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => {
        mainWindow?.webContents.send('update-status', { status: 'checking' })
    })
    autoUpdater.on('update-available', (info: any) => {
        mainWindow?.webContents.send('update-status', { status: 'available', version: info.version })
    })
    autoUpdater.on('update-not-available', () => {
        mainWindow?.webContents.send('update-status', { status: 'not-available' })
    })
    autoUpdater.on('download-progress', (progress: any) => {
        mainWindow?.webContents.send('update-status', { status: 'downloading', percent: progress.percent })
    })
    autoUpdater.on('update-downloaded', (info: any) => {
        mainWindow?.webContents.send('update-status', { status: 'downloaded', version: info.version })
        if (mainWindow) {
            import('electron').then(({ dialog }) => {
                dialog.showMessageBox(mainWindow!, {
                    type: 'info',
                    buttons: ['Позже', 'Перезапустить'],
                    defaultId: 1,
                    title: 'Обновление готово',
                    message: `Версия ${info.version} загружена и готова к установке.`,
                }).then((result) => {
                    if (result.response === 1) {
                        isQuitting = true
                        autoUpdater.quitAndInstall()
                    }
                })
            })
        }
    })
    autoUpdater.on('error', (error: any) => {
        mainWindow?.webContents.send('update-status', { status: 'error', error: error.message })
    })
    setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 5000)
}

// ===== App lifecycle =====
app.whenReady().then(async () => {
    store = new SimpleStore()
    mainWindow = createMainWindow(isDev, getIconPath(), __dirname)
    // Start print server
    printServer = new PrintServer(store.get('printServerPort'), store.get('selectedPrinter'), async (filePath, printer, copies) => {
        await printPdfGhostscript(filePath, printer, store.get('labelWidth'), store.get('labelHeight'), copies, store.get('orientation'))
    })
    try {
        await printServer.start()
        console.log(`[PrintServer] Started on port ${store.get('printServerPort')}`)
    } catch (err) {
        console.error('[PrintServer] Failed to start:', err)
    }
    setupIPC(store, printServer, mainWindow)
    configureAutoUpdater()
    app.on('activate', () => {
        if (mainWindow === null) {
            mainWindow = createMainWindow(isDev, getIconPath(), __dirname)
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    isQuitting = true
    if (printServer) printServer.stop()
})

app.disableHardwareAcceleration()
