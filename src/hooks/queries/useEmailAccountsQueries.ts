import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchEmailAccounts,
    createEmailAccount,
    updateEmailAccount,
    deleteEmailAccount,
    CreateEmailAccountPayload,
    UpdateEmailAccountPayload,
} from '@/services/api/emailAccounts'

const QUERY_KEY = 'email-accounts'

export const useEmailAccountsQuery = () =>
    useQuery({
        queryKey: [QUERY_KEY],
        queryFn: fetchEmailAccounts,
        staleTime: 5 * 60 * 1000,
    })

export const useCreateEmailAccount = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateEmailAccountPayload) => createEmailAccount(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    })
}

export const useUpdateEmailAccount = (id: number) => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateEmailAccountPayload) => updateEmailAccount(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    })
}

export const useDeleteEmailAccount = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => deleteEmailAccount(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    })
}
