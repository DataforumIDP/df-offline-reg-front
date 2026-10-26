import { findGhostscript } from './ghostscript.js'
import * as fs from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
let printInProgress = false
const PRINT_BUTTON_RELEASE_DELAY_MS = 3000

export type PrintDebugLogger = (
    printId: string,
    event: string,
    details?: Record<string, unknown>,
) => void

async function printPdfGhostscriptUnlocked(
    filePath: string,
    printerName: string,
    labelWidth: number,
    labelHeight: number,
    copies: number,
    orientation: 'portrait' | 'landscape',
    printId: string,
    log: PrintDebugLogger,
): Promise<void> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
    }
    const gsPath = await findGhostscript()
    if (!gsPath) {
        throw new Error('Ghostscript not installed. Download from https://ghostscript.com')
    }

    const widthPts = Math.round(labelWidth * 2.83465)
    const heightPts = Math.round(labelHeight * 2.83465)
    log(printId, 'print-parameters', {
        platform: process.platform,
        printerName,
        labelWidth,
        labelHeight,
        orientation,
        copies,
        filePath,
        fileSize: fs.statSync(filePath).size,
        ghostscriptPath: gsPath,
        completionSignal: 'ghostscript-process-exit',
    })

    for (let i = 0; i < copies; i++) {
        const command = `"${gsPath}" -dPrinted -dBATCH -dNOPAUSE -dNOSAFER -q -sDEVICE=mswinpr2 "-sOutputFile=%printer%${printerName}" -dFitPage -dAutoRotatePages=/None -dDEVICEWIDTHPOINTS=${widthPts} -dDEVICEHEIGHTPOINTS=${heightPts} -dFIXEDMEDIA "${filePath}"`
        log(printId, 'ghostscript-start', {
            copy: i + 1,
            copies,
            command,
        })
        const startedAt = Date.now()

        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 60000 })
            log(printId, 'ghostscript-exit', {
                copy: i + 1,
                copies,
                elapsedMs: Date.now() - startedAt,
                outcome: 'success',
                stdout: stdout.trim(),
                stderr: stderr.trim(),
            })
        } catch (error: unknown) {
            const printError = error as {
                message?: string
                code?: number | string
                signal?: string
                stderr?: string
                stdout?: string
            }
            log(printId, 'ghostscript-exit', {
                copy: i + 1,
                copies,
                elapsedMs: Date.now() - startedAt,
                outcome: 'error',
                error: printError.message,
                code: printError.code,
                signal: printError.signal,
                stderr: printError.stderr,
                stdout: printError.stdout,
            })
            throw new Error(`Print failed: ${printError.stderr || printError.message}`)
        }
    }
}

export async function printPdfGhostscript(
    filePath: string,
    printerName: string,
    labelWidth: number,
    labelHeight: number,
    copies: number,
    orientation: 'portrait' | 'landscape',
    printId: string,
    log: PrintDebugLogger,
): Promise<void> {
    if (printInProgress) {
        log(printId, 'print-rejected', { reason: 'another-print-in-progress' })
        throw new Error('Предыдущее задание печати ещё выполняется.')
    }

    printInProgress = true
    log(printId, 'print-lock-acquired')
    try {
        await printPdfGhostscriptUnlocked(
            filePath,
            printerName,
            labelWidth,
            labelHeight,
            copies,
            orientation,
            printId,
            log,
        )
        log(printId, 'print-button-release-delay-start', {
            delayMs: PRINT_BUTTON_RELEASE_DELAY_MS,
        })
        await new Promise<void>((resolve) => setTimeout(resolve, PRINT_BUTTON_RELEASE_DELAY_MS))
        log(printId, 'print-button-release-delay-complete', {
            delayMs: PRINT_BUTTON_RELEASE_DELAY_MS,
        })
        log(printId, 'print-finished', { outcome: 'ghostscript-process-exit' })
    } catch (error) {
        log(printId, 'print-failed', {
            error: error instanceof Error ? error.message : String(error),
        })
        throw error
    } finally {
        printInProgress = false
        log(printId, 'print-lock-released')
    }
}
