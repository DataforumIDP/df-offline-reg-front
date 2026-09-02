import type { Project } from '@/services/api/projects'

export const MAX_REPEAT_PRINT_COUNT = 10

export function normalizePrintCopies(value: unknown): number {
    const count = Number(value)

    if (!Number.isFinite(count)) {
        return 1
    }

    return Math.min(MAX_REPEAT_PRINT_COUNT, Math.max(1, Math.trunc(count)))
}

export function getProjectPrintCopies(project?: Pick<Project, 'repeatPrintEnabled' | 'repeatPrintCount'> | null): number {
    if (!project?.repeatPrintEnabled) {
        return 1
    }

    return normalizePrintCopies(project.repeatPrintCount)
}
