import { ipcMain, IpcMainInvokeEvent, dialog, shell } from 'electron'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { SimpleStore } from './store.js'
import { printPdfGhostscript } from './printJob.js'
import { PrintServer } from './printServer.js'

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
