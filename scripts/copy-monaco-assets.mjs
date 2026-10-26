import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const source = path.resolve(scriptDirectory, '../node_modules/monaco-editor/min/vs')
const destination = path.resolve(scriptDirectory, '../public/monaco/vs')

if (!fs.existsSync(source)) {
    throw new Error(
        `Monaco assets were not found at ${source}. Install frontend dependencies first.`,
    )
}

fs.rmSync(destination, { recursive: true, force: true })
fs.mkdirSync(path.dirname(destination), { recursive: true })
fs.cpSync(source, destination, { recursive: true })

process.stdout.write(`Copied Monaco assets to ${destination}\n`)
