import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs, { Dayjs } from 'dayjs'
import type { FiltersState } from '@/hooks/useParticipantsState'
import type { StatsFiltersValue } from '../types/stats'

const parseFilters = (str: string | null): FiltersState => {
    if (!str) return {}
    try {
        return JSON.parse(str)
    } catch {
        return {}
    }
}

const stringifyFilters = (filters: FiltersState): string => {
    const cleaned = Object.entries(filters).reduce((acc, [k, v]) => {
        if (v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== '')) acc[k] = v
        return acc
    }, {} as FiltersState)
    if (Object.keys(cleaned).length === 0) return ''
    return JSON.stringify(cleaned)
}

export const useStatsFilters = (): StatsFiltersValue => {
    const [searchParams, setSearchParams] = useSearchParams()

    const dateStart: Dayjs | null = searchParams.get('dateStart')
        ? dayjs(searchParams.get('dateStart')!)
        : null
    const dateEnd: Dayjs | null = searchParams.get('dateEnd')
        ? dayjs(searchParams.get('dateEnd')!)
        : null
    const [fieldFilters, setFieldFiltersState] = useState<FiltersState>(
        () => parseFilters(searchParams.get('filters')),
    )

    const updateUrl = useCallback(
        (updates: Record<string, string | null>) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev)
                    Object.entries(updates).forEach(([k, v]) => {
                        if (!v) next.delete(k)
                        else next.set(k, v)
                    })
                    return next
                },
                { replace: true },
            )
        },
        [setSearchParams],
    )

    const setDateStart = useCallback(
        (v: Dayjs | null) => updateUrl({ dateStart: v ? v.toISOString() : null }),
        [updateUrl],
    )
    const setDateEnd = useCallback(
        (v: Dayjs | null) => updateUrl({ dateEnd: v ? v.toISOString() : null }),
        [updateUrl],
    )
    const setDateRange = useCallback(
        (start: Dayjs | null, end: Dayjs | null) =>
            updateUrl({
                dateStart: start ? start.toISOString() : null,
                dateEnd: end ? end.toISOString() : null,
            }),
        [updateUrl],
    )
    const setFieldFilters = useCallback(
        (f: FiltersState) => {
            setFieldFiltersState(f)
            updateUrl({ filters: stringifyFilters(f) || null })
        },
        [updateUrl],
    )
    const resetFilters = useCallback(() => {
        setFieldFiltersState({})
        updateUrl({ dateStart: null, dateEnd: null, filters: null })
    }, [updateUrl])

    const dateParams = useMemo(
        () => ({
            dateStart: dateStart?.toISOString(),
            dateEnd: dateEnd?.toISOString(),
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dateStart?.toISOString(), dateEnd?.toISOString()],
    )

    return {
        dateStart,
        dateEnd,
        setDateStart,
        setDateEnd,
        setDateRange,
        fieldFilters,
        setFieldFilters,
        resetFilters,
        dateParams,
    }
}
