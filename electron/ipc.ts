import { ipcMain, IpcMainInvokeEvent, dialog, shell } from 'electron'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import * as net from 'net'
import * as http from 'http'
import { SimpleStore } from './store.js'
import { printPdfGhostscript } from './printJob.js'
import { PrintServer } from './printServer.js'
import updaterPkg from 'electron-updater'
const { autoUpdater } = (updaterPkg as any) || updaterPkg

import { app } from 'electron'
export function setupIPC(store: SimpleStore, printServer: PrintServer, mainWindow: Electron.BrowserWindow) {
    ipcMain.handle('get-printers', async () => {
        try {
            const cmd = 'powershell -Command "Get-Printer | Select-Object Name, Default | ConvertTo-Json"'
            const { exec } = await import('child_process')
            const { promisify } = await import('util')
            const execAsync = promisify(exec)
            const { stdout } = await execAsync(cmd, { timeout: 10000 })
            const printers = JSON.parse(stdout)
            const printerList = Array.isArray(printers) ? printers : [printers]
            return printerList.map((p: { Name: string; Default?: boolean }) => ({
                name: p.Name,
                isDefault: p.Default === true,
            }))
        } catch {
            return []
        }
    })
    ipcMain.handle('get-print-settings', () => store.getAll())
    ipcMain.handle('set-print-settings', (_event: IpcMainInvokeEvent, settings: Partial<ReturnType<typeof store.getAll>>) => {
        Object.entries(settings).forEach(([k, v]) => {
            // @ts-ignore
            store.set(k, v)
        })
        return true
    })
    ipcMain.handle('print-pdf', async (_event: IpcMainInvokeEvent, data: { pdfBase64: string; copies?: number; filename?: string }) => {
        const { printMode, selectedPrinter, labelWidth, labelHeight, orientation } = store.getAll()
        const tempDir = path.join(os.tmpdir(), 'rega-desktop')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        const filename = data.filename || `print-${Date.now()}.pdf`
        const filePath = path.join(tempDir, filename)
        const pdfBuffer = Buffer.from(data.pdfBase64, 'base64')
        fs.writeFileSync(filePath, pdfBuffer)
        try {
            if (printMode === 'pdf-browser') {
                await shell.openExternal(`file://${filePath}`)
                return { success: true, mode: 'pdf-browser', message: 'PDF открыт в браузере' }
            }
            if (!selectedPrinter) throw new Error('Принтер не выбран')
            await printPdfGhostscript(filePath, selectedPrinter, labelWidth, labelHeight, data.copies || 1, orientation)
            setTimeout(() => { try { fs.unlinkSync(filePath) } catch {} }, 5000)
            return { success: true, mode: 'native', message: 'Отправлено на печать' }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })
    ipcMain.handle('check-ghostscript', async () => {
        const { findGhostscript } = await import('./ghostscript.js')
        const gsPath = await findGhostscript()
        return { installed: !!gsPath, path: gsPath }
    })
    ipcMain.handle('get-app-info', () => {
        return {
            version: app.getVersion(),
            name: app.getName(),
        }
    })

    // ── Обновления ────────────────────────────────────────────────────────────

    ipcMain.handle('check-for-updates', async () => {
        try {
            await autoUpdater.checkForUpdates()
            return { checking: true }
        } catch (e: any) {
            return { checking: false, error: e.message }
        }
    })

    ipcMain.handle('install-update', () => {
        autoUpdater.quitAndInstall(false, true)
    })

    ipcMain.handle('get-update-channel', () => {
        return store.get('updateChannel') || 'r'
    })

    ipcMain.handle('set-update-channel', (_event: IpcMainInvokeEvent, channel: string) => {
        const allowed = ['r', 'a']
        if (!allowed.includes(channel)) return false
        store.set('updateChannel', channel)
        autoUpdater.channel = channel
        return true
    })

    ipcMain.handle('get-update-server', () => {
        return store.get('updateServer') || ''
    })

    ipcMain.handle('set-update-server', (_event: IpcMainInvokeEvent, url: string) => {
        store.set('updateServer', url)
        autoUpdater.setFeedURL({ provider: 'generic', url })
        return true
    })

    // ── Поиск серверов в локальной сети ──────────────────────────────────────

    ipcMain.handle('scan-network', async () => {
        const port = 3030

        // Определяем локальные подсети
        const nets = os.networkInterfaces()
        const subnets: string[] = []
        for (const interfaces of Object.values(nets)) {
            for (const iface of (interfaces || [])) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    const parts = iface.address.split('.')
                    subnets.push(`${parts[0]}.${parts[1]}.${parts[2]}.`)
                }
            }
        }

        const uniqueSubnets = [...new Set(subnets)]
        console.log('[scan-network] подсети:', uniqueSubnets)

        // TCP-проверка: открыт ли порт
        const checkTCP = (host: string): Promise<boolean> =>
            new Promise((resolve) => {
                const socket = net.createConnection({ host, port, timeout: 400 })
                socket.once('connect', () => { socket.destroy(); resolve(true) })
                socket.once('error', () => resolve(false))
                socket.once('timeout', () => { socket.destroy(); resolve(false) })
            })

        // HTTP-проверка: отвечает ли /ping как rega-сервер
        const checkHttp = (host: string): Promise<boolean> =>
            new Promise((resolve) => {
                const req = http.get(`http://${host}:${port}/ping`, { timeout: 600 }, (res) => {
                    let data = ''
                    res.on('data', (chunk: Buffer) => { data += chunk.toString() })
                    res.on('end', () => {
                        try { resolve(JSON.parse(data)?.status === 'ok') } catch { resolve(false) }
                    })
                })
                req.once('error', () => resolve(false))
                req.once('timeout', () => { req.destroy(); resolve(false) })
            })

        const found: Array<{ url: string; name: string }> = []

        for (const subnet of uniqueSubnets) {
            const checks = Array.from({ length: 254 }, (_, i) => {
                const ip = `${subnet}${i + 1}`
                return checkTCP(ip)
                    .then((open) => {
                        if (!open) return
                        return checkHttp(ip).then((isRega) => {
                            if (isRega) {
                                console.log('[scan-network] найден:', ip)
                                found.push({ url: `http://${ip}:${port}`, name: `Rega (${ip})` })
                            }
                        })
                    })
                    .catch((err) => console.warn('[scan-network] ошибка для', ip, err))
            })
            await Promise.allSettled(checks)
        }

        console.log('[scan-network] итого найдено:', found)
        return found
    })

    // Read font file from app resources (for jsPDF in renderer)
    ipcMain.handle('read-font-file', async (_event: IpcMainInvokeEvent, relativePath: string) => {
        // Sanitize path to prevent directory traversal
        const normalized = path.normalize(relativePath).replace(/\\/g, '/')
        if (normalized.includes('..') || path.isAbsolute(relativePath)) {
            throw new Error('Invalid font path')
        }
        // Fonts are in dist/ (copied from public/ by Vite)
        const fontPath = path.join(app.getAppPath(), 'dist', normalized)
        if (!fs.existsSync(fontPath)) {
            throw new Error(`Font not found: ${normalized}`)
        }
        const buffer = fs.readFileSync(fontPath)
        return buffer.toString('base64')
    })
}
