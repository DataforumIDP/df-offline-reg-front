import { findGhostscript } from './ghostscript'
import * as fs from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

export async function printPdfGhostscript(
    filePath: string,
    printerName: string,
    labelWidth: number,
    labelHeight: number,
    copies: number,
    orientation: 'portrait' | 'landscape',
): Promise<void> {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
    }
    const gsPath = await findGhostscript()
    if (!gsPath) {
        throw new Error('Ghostscript not installed. Download from https://ghostscript.com')
    }
    // Convert mm to points (1 mm = 2.83465 points)
    const widthPts = Math.round(labelWidth * 2.83465)
    const heightPts = Math.round(labelHeight * 2.83465)
    for (let i = 0; i < copies; i++) {
        const cmd = `"${gsPath}" -dPrinted -dBATCH -dNOPAUSE -dNOSAFER -q -sDEVICE=mswinpr2 "-sOutputFile=%printer%${printerName}" -dFitPage -dAutoRotatePages=/None -dDEVICEWIDTHPOINTS=${widthPts} -dDEVICEHEIGHTPOINTS=${heightPts} -dFIXEDMEDIA "${filePath}"`
        try {
            await execAsync(cmd, { timeout: 60000 })
        } catch (error: any) {
            throw new Error(`Print failed: ${error.stderr || error.message}`)
        }
    }
}
