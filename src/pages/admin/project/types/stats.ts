import type { Dayjs } from 'dayjs'

export interface SelectedOperator {
    userId: number
    userName: string
    userLogin: string
}

export interface UserStatRow {
    userId: number
    userName: string
    userLogin: string
    CREATE: number
    UPDATE: number
    DELETE: number
    PRINT: number
    total: number
}

export interface StatsCounts {
    CREATE: number
    UPDATE: number
    DELETE: number
    PRINT: number
    uniqPrints: number
}

export interface StatsDateParams {
    dateStart: string | undefined
    dateEnd: string | undefined
}

export interface StatsFiltersValue {
    dateStart: Dayjs | null
    dateEnd: Dayjs | null
    setDateStart: (v: Dayjs | null) => void
    setDateEnd: (v: Dayjs | null) => void
    setDateRange: (start: Dayjs | null, end: Dayjs | null) => void
    fieldFilters: Record<string, string | string[] | undefined>
    setFieldFilters: (f: Record<string, string | string[] | undefined>) => void
    resetFilters: () => void
    dateParams: StatsDateParams
}
