import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface StoreData {
    printMode: 'native' | 'pdf-browser'
    selectedPrinter: string
    labelWidth: number
    labelHeight: number
    orientation: 'portrait' | 'landscape'
    updateServer: string
    updateChannel: string
    printServerPort: number
}

const defaultStoreData: StoreData = {
    printMode: 'native',
    selectedPrinter: '',
    labelWidth: 70,
    labelHeight: 50,
    orientation: 'landscape',
    updateServer: '',
    updateChannel: 'r',
    printServerPort: 4400,
}

export class SimpleStore {
    private filePath: string
    private data: StoreData
    constructor() {
        const userDataPath = app.getPath('userData')
        this.filePath = path.join(userDataPath, 'settings.json')
        this.data = this.load()
    }
    private load(): StoreData {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf-8')
                return { ...defaultStoreData, ...JSON.parse(raw) }
            }
        } catch {}
        return { ...defaultStoreData }
    }
    private save(): void {
        try { fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2)) } catch {}
    }
    get<K extends keyof StoreData>(key: K): StoreData[K] { return this.data[key] }
    set<K extends keyof StoreData>(key: K, value: StoreData[K]): void { this.data[key] = value; this.save() }
    getAll(): StoreData { return { ...this.data } }
}
