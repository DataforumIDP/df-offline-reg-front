import express, { Request, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export type PrintFunction = (filePath: string, printerName: string, copies: number) => Promise<void>

export class PrintServer {
    private app: express.Application
    private server: any = null
    private port: number
    private printer: string
    private running: boolean = false
    private tempDir: string
    private printFn: PrintFunction

    constructor(port: number, printer: string, printFn: PrintFunction) {
        this.port = port
        this.printer = printer
        this.printFn = printFn
        this.tempDir = path.join(os.tmpdir(), 'rega-print')
        this.app = express()
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
        this.setupRoutes()
    }

    private setupRoutes() {
        this.app.use((_req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Content-Type')
            if (_req.method === 'OPTIONS') return res.sendStatus(200)
            next()
        })
        const upload = multer({
            dest: this.tempDir,
            limits: { fileSize: 50 * 1024 * 1024 },
            fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
                if (file.mimetype === 'application/pdf') cb(null, true)
                else cb(new Error('Only PDF files allowed'))
            },
        })
        this.app.get('/status', (_req: Request, res: Response) => {
            res.json({ status: 'running', printer: this.printer || 'not selected' })
        })
        this.app.post('/print', upload.single('file'), async (req: Request, res: Response) => {
            try {
                if (!req.file) return res.status(400).json({ error: 'PDF file not provided' })
                if (!this.printer) {
                    this.cleanupFile(req.file.path)
                    return res.status(400).json({ error: 'Printer not selected' })
                }
                const filePath = req.file.path
                const pdfPath = filePath + '.pdf'
                fs.renameSync(filePath, pdfPath)
                const copies = parseInt(req.body?.copies) || 1
                await this.printFile(pdfPath, copies)
                this.cleanupFile(pdfPath)
                res.json({ success: true, message: `Sent to print (${copies} copies)`, printer: this.printer })
            } catch (error: any) {
                if (req.file) {
                    this.cleanupFile(req.file.path)
                    this.cleanupFile(req.file.path + '.pdf')
                }
                res.status(500).json({ error: 'Print error', details: error.message })
            }
        })
    }

    async printFile(filePath: string, copies: number = 1): Promise<void> {
        await this.printFn(filePath, this.printer, copies)
    }

    private cleanupFile(filePath: string) {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    this.running = true
                    resolve()
                })
                this.server.on('error', (err: any) => {
                    if (err.code === 'EADDRINUSE') reject(new Error(`Port ${this.port} already in use`))
                    else reject(err)
                })
            } catch (error) { reject(error) }
        })
    }

    async stop(): Promise<void> {
        if (this.server) {
            await new Promise((resolve) => this.server.close(resolve))
            this.running = false
        }
    }

    getPrinter() { return this.printer }
    getPort() { return this.port }
    isRunning() { return this.running }
}
