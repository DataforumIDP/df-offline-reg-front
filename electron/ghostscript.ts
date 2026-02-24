import * as fs from 'fs'
import * as path from 'path'

let ghostscriptPath: string | null = null

export const findGhostscript = async (): Promise<string | null> => {
    if (ghostscriptPath) return ghostscriptPath
    const possiblePaths = ['C:\\Program Files\\gs', 'C:\\Program Files (x86)\\gs']
    for (const basePath of possiblePaths) {
        if (!fs.existsSync(basePath)) continue
        try {
            const dirs = fs.readdirSync(basePath)
            for (const dir of dirs.sort().reverse()) {
                const gsPath = path.join(basePath, dir, 'bin', 'gswin64c.exe')
                if (fs.existsSync(gsPath)) {
                    ghostscriptPath = gsPath
                    console.log(`[Ghostscript] Found: ${gsPath}`)
                    return gsPath
                }
                const gs32Path = path.join(basePath, dir, 'bin', 'gswin32c.exe')
                if (fs.existsSync(gs32Path)) {
                    ghostscriptPath = gs32Path
                    console.log(`[Ghostscript] Found: ${gs32Path}`)
                    return gs32Path
                }
            }
        } catch (e) {
            console.warn('[Ghostscript] Error while searching:', e)
        }
    }
    console.warn('[Ghostscript] Not found')
    return null
}
