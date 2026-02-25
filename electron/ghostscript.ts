import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

let ghostscriptPath: string | null = null

function normalizeExe(p: string) {
    try {
        // resolve any surrounding quotes and normalize path
        return p.replace(/^"|"$/g, '')
    } catch {
        return p
    }
}

export const findGhostscript = async (): Promise<string | null> => {
    if (ghostscriptPath) return ghostscriptPath

    // 1) Try OS-level lookup (Windows `where` command)
    try {
        const candidates = ['gswin64c.exe', 'gswin64.exe', 'gswin32c.exe', 'gswin32.exe', 'gs.exe']
        for (const name of candidates) {
            try {
                const out = execSync(`where ${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
                const first = out.split(/\r?\n/).map(s => s.trim()).find(s => s)
                if (first && fs.existsSync(first)) {
                    ghostscriptPath = normalizeExe(first)
                    console.log(`[Ghostscript] Found via where: ${ghostscriptPath}`)
                    return ghostscriptPath
                }
            } catch (e) {
                // ignore and continue
            }
        }
    } catch (e) {
        // non-fatal
    }

    // 2) Search common Program Files locations for gs installation folders
    const possibleRoots = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], 'C:\\Program Files\\gs', 'C:\\Program Files (x86)\\gs'].filter(Boolean) as string[]
    const seen = new Set<string>()
    for (const root of possibleRoots) {
        if (!root) continue
        // if root points directly to gs installation (like C:\Program Files\gs\gs10.06.0)
        const tryRoots = [root]
        tryRoots.push(path.join(root, 'gs'))
        for (const basePath of tryRoots) {
            if (!fs.existsSync(basePath)) continue
            try {
                const dirs = fs.readdirSync(basePath)
                // check directories and nested directories for bin\gswin*.exe
                for (const dir of dirs.sort().reverse()) {
                    const candidateDir = path.join(basePath, dir)
                    if (seen.has(candidateDir)) continue
                    seen.add(candidateDir)
                    const binDir = path.join(candidateDir, 'bin')
                    if (!fs.existsSync(binDir)) continue
                    try {
                        const files = fs.readdirSync(binDir)
                        const match = files.find(f => /^gswin.*\.exe$/i.test(f) || /^gs\.exe$/i.test(f))
                        if (match) {
                            const found = path.join(binDir, match)
                            ghostscriptPath = found
                            console.log(`[Ghostscript] Found: ${found}`)
                            return ghostscriptPath
                        }
                    } catch (e) {
                        // continue
                    }
                }
            } catch (e) {
                // continue
            }
        }
    }

    // 3) Last resort: scan Program Files for any gs* folder (may be slow)
    try {
        const scanRoots = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)']].filter(Boolean) as string[]
        for (const r of scanRoots) {
            const gsRoot = path.join(r, 'gs')
            if (!fs.existsSync(gsRoot)) continue
            const versions = fs.readdirSync(gsRoot)
            for (const v of versions.sort().reverse()) {
                const binDir = path.join(gsRoot, v, 'bin')
                if (!fs.existsSync(binDir)) continue
                const files = fs.readdirSync(binDir)
                const match = files.find(f => /^gswin.*\.exe$/i.test(f) || /^gs\.exe$/i.test(f))
                if (match) {
                    const found = path.join(binDir, match)
                    ghostscriptPath = found
                    console.log(`[Ghostscript] Found (scan): ${found}`)
                    return ghostscriptPath
                }
            }
        }
    } catch (e) {
        // ignore
    }

    console.warn('[Ghostscript] Not found')
    return null
}
