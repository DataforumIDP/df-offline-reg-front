import { useState } from 'react'
import {
    Text,
    Button,
    Card,
    Skeleton,
    Dialog,
    TextInput,
    Checkbox,
    Label,
} from '@gravity-ui/uikit'
import { Plus, TrashBin } from '@gravity-ui/icons'
import { useSnackbar } from 'notistack'
import { PageWrapper, PageHeader, PageHeaderActions } from '@/components/atoms'
import {
    useEmailAccountsQuery,
    useCreateEmailAccount,
    useUpdateEmailAccount,
    useDeleteEmailAccount,
} from '@/hooks/queries/useEmailAccountsQueries'
import { EmailAccount, EmailProvider } from '@/services/api/emailAccounts'

// ─── Форма создания / редактирования ─────────────────────────────────────────

interface AccountFormState {
    slug: string
    provider: EmailProvider
    // SMTP
    host: string
    port: string
    secure: boolean
    login: string
    password: string
    // RuSender
    apiKey: string
    // Общие
    alias: string
    fromName: string
}

const emptyForm = (): AccountFormState => ({
    slug: '',
    provider: 'smtp',
    host: '',
    port: '465',
    secure: true,
    login: '',
    password: '',
    apiKey: '',
    alias: '',
    fromName: '',
})

const formFromAccount = (account: EmailAccount): AccountFormState => ({
    slug: account.slug,
    provider: account.provider ?? 'smtp',
    host: account.host ?? '',
    port: account.port != null ? String(account.port) : '465',
    secure: account.secure ?? true,
    login: account.login ?? '',
    password: '',
    apiKey: '', // никогда не возвращается с сервера
    alias: account.alias ?? '',
    fromName: account.fromName ?? '',
})

interface AccountFormDialogProps {
    open: boolean
    onClose: () => void
    /** Если передан — режим редактирования */
    account?: EmailAccount | null
}

const AccountFormDialog = ({ open, onClose, account }: AccountFormDialogProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const createMutation = useCreateEmailAccount()
    const updateMutation = useUpdateEmailAccount(account?.id ?? 0)

    const [form, setForm] = useState<AccountFormState>(() =>
        account ? formFromAccount(account) : emptyForm(),
    )
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleOpen = () => {
        setErrors({})
        setForm(account ? formFromAccount(account) : emptyForm())
    }

    const set = (key: keyof AccountFormState) => (v: string | boolean) =>
        setForm((f) => ({ ...f, [key]: v }))

    const validate = (): boolean => {
        const e: Record<string, string> = {}
        if (!form.slug.trim()) e.slug = 'Slug обязателен'
        else if (!/^[a-z0-9_-]{1,100}$/.test(form.slug)) e.slug = 'Только a-z, 0-9, _ и -'

        if (form.provider === 'smtp') {
            if (!form.host.trim()) e.host = 'Хост обязателен'
            const p = Number(form.port)
            if (!Number.isInteger(p) || p < 1 || p > 65535) e.port = 'Порт от 1 до 65535'
            if (!form.login.trim()) e.login = 'Логин обязателен'
            if (!account && !form.password.trim()) e.password = 'Пароль обязателен'
        } else {
            if (!form.login.trim()) e.login = 'Email отправителя обязателен'
            if (!account && !form.apiKey.trim()) e.apiKey = 'API-ключ обязателен'
        }

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return

        if (account) {
            const payload: Record<string, any> = {
                slug: form.slug,
                provider: form.provider,
                login: form.login || undefined,
                alias: form.alias || undefined,
                fromName: form.fromName || undefined,
            }
            if (form.provider === 'smtp') {
                payload.host = form.host
                payload.port = Number(form.port)
                payload.secure = form.secure
                if (form.password.trim()) payload.password = form.password.trim()
            } else {
                if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim()
            }
            updateMutation.mutate(payload as any, {
                onSuccess: () => {
                    enqueueSnackbar('Аккаунт обновлён', { variant: 'success' })
                    onClose()
                },
                onError: () => enqueueSnackbar('Ошибка при обновлении', { variant: 'error' }),
            })
        } else {
            const payload: any = {
                slug: form.slug,
                provider: form.provider,
                login: form.login,
                alias: form.alias || undefined,
                fromName: form.fromName || undefined,
            }
            if (form.provider === 'smtp') {
                payload.host = form.host
                payload.port = Number(form.port)
                payload.secure = form.secure
                payload.password = form.password.trim()
            } else {
                payload.apiKey = form.apiKey.trim()
            }
            createMutation.mutate(payload, {
                onSuccess: () => {
                    enqueueSnackbar('Аккаунт добавлен', { variant: 'success' })
                    onClose()
                },
                onError: () => enqueueSnackbar('Ошибка при создании', { variant: 'error' }),
            })
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const isSmtp = form.provider === 'smtp'

    return (
        <Dialog open={open} onClose={onClose} onTransitionEnter={handleOpen}>
            <Dialog.Header caption={account ? 'Редактировать аккаунт' : 'Добавить email-аккаунт'} />
            <Dialog.Body>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 380 }}>
                    <Field label="Slug *" error={errors.slug}>
                        <TextInput
                            value={form.slug}
                            onUpdate={set('slug')}
                            placeholder="my-account"
                            error={!!errors.slug}
                            size="l"
                        />
                    </Field>

                    <Field label="Тип">
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                                view={isSmtp ? 'action' : 'outlined'}
                                size="m"
                                onClick={() => set('provider')('smtp')}
                            >
                                SMTP
                            </Button>
                            <Button
                                view={!isSmtp ? 'action' : 'outlined'}
                                size="m"
                                onClick={() => set('provider')('rusender')}
                            >
                                RuSender API
                            </Button>
                        </div>
                    </Field>

                    {isSmtp && (
                        <>
                            <Field label="SMTP хост *" error={errors.host}>
                                <TextInput
                                    value={form.host}
                                    onUpdate={set('host')}
                                    placeholder="smtp.example.com"
                                    error={!!errors.host}
                                    size="l"
                                />
                            </Field>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <Field label="Порт *" error={errors.port}>
                                        <TextInput
                                            value={form.port}
                                            onUpdate={set('port')}
                                            type="number"
                                            error={!!errors.port}
                                            size="l"
                                        />
                                    </Field>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                    <Checkbox checked={form.secure} onUpdate={(v) => set('secure')(v)}>
                                        SSL/TLS
                                    </Checkbox>
                                </div>
                            </div>
                        </>
                    )}

                    <Field label={isSmtp ? 'Логин (email) *' : 'Email отправителя *'} error={errors.login}>
                        <TextInput
                            value={form.login}
                            onUpdate={set('login')}
                            placeholder="no-reply@example.com"
                            error={!!errors.login}
                            size="l"
                        />
                    </Field>

                    {isSmtp && (
                        <Field
                            label={account ? 'Новый пароль (оставьте пустым — не менять)' : 'Пароль *'}
                            error={errors.password}
                        >
                            <TextInput
                                value={form.password}
                                onUpdate={set('password')}
                                type="password"
                                error={!!errors.password}
                                size="l"
                            />
                        </Field>
                    )}

                    {!isSmtp && (
                        <Field
                            label={account ? 'API-ключ (оставьте пустым — не менять)' : 'API-ключ *'}
                            error={errors.apiKey}
                        >
                            <TextInput
                                value={form.apiKey}
                                onUpdate={set('apiKey')}
                                type="password"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                error={!!errors.apiKey}
                                size="l"
                            />
                        </Field>
                    )}

                    {isSmtp && (
                        <Field label="Алиас (адрес отправителя)">
                            <TextInput
                                value={form.alias}
                                onUpdate={set('alias')}
                                placeholder="no-reply@example.com"
                                size="l"
                            />
                        </Field>
                    )}

                    <Field label="Имя отправителя">
                        <TextInput
                            value={form.fromName}
                            onUpdate={set('fromName')}
                            placeholder="Моя компания"
                            size="l"
                        />
                    </Field>
                </div>
            </Dialog.Body>
            <Dialog.Footer
                textButtonCancel="Отмена"
                textButtonApply={account ? 'Сохранить' : 'Создать'}
                onClickButtonCancel={onClose}
                onClickButtonApply={handleSubmit}
                propsButtonApply={{ loading: isPending }}
            />
        </Dialog>
    )
}

// ─── Вспомогательный компонент поля ──────────────────────────────────────────

const Field = ({
    label,
    error,
    children,
}: {
    label: string
    error?: string
    children: React.ReactNode
}) => (
    <div>
        <label
            style={{
                display: 'block',
                marginBottom: 4,
                fontSize: 12,
                color: 'var(--g-color-text-secondary)',
            }}
        >
            {label}
        </label>
        {children}
        {error && (
            <Text variant="caption-2" color="danger" style={{ marginTop: 4, display: 'block' }}>
                {error}
            </Text>
        )}
    </div>
)

// ─── Модалка просмотра / удаления ────────────────────────────────────────────

interface ViewDialogProps {
    account: EmailAccount | null
    onClose: () => void
    onEdit: () => void
}

const ViewDialog = ({ account, onClose, onEdit }: ViewDialogProps) => {
    const { enqueueSnackbar } = useSnackbar()
    const deleteMutation = useDeleteEmailAccount()
    const [confirmDelete, setConfirmDelete] = useState(false)

    if (!account) return null

    const handleDelete = () => {
        deleteMutation.mutate(account.id, {
            onSuccess: () => {
                enqueueSnackbar('Аккаунт удалён', { variant: 'success' })
                onClose()
            },
            onError: () => enqueueSnackbar('Ошибка при удалении', { variant: 'error' }),
        })
    }

    const isSmtp = (account.provider ?? 'smtp') === 'smtp'

    return (
        <Dialog open={!!account} onClose={onClose}>
            <Dialog.Header caption={account.slug} />
            <Dialog.Body>
                {!confirmDelete ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 300 }}>
                        <Row label="Тип" value={isSmtp ? 'SMTP' : 'RuSender API'} />
                        {isSmtp ? (
                            <>
                                <Row label="Хост" value={account.host ?? '—'} />
                                <Row label="Порт" value={account.port != null ? String(account.port) : '—'} />
                                <Row label="SSL/TLS" value={account.secure ? 'Да' : 'Нет'} />
                                <Row label="Логин" value={account.login ?? '—'} />
                                {account.alias && <Row label="Алиас (from)" value={account.alias} />}
                            </>
                        ) : (
                            <Row label="Email отправителя" value={account.login ?? '—'} />
                        )}
                        {account.fromName && <Row label="Имя отправителя" value={account.fromName} />}
                    </div>
                ) : (
                    <Text>Удалить аккаунт <b>{account.slug}</b>? Это действие нельзя отменить.</Text>
                )}
            </Dialog.Body>
            <Dialog.Footer
                textButtonCancel={confirmDelete ? 'Нет' : 'Закрыть'}
                textButtonApply={confirmDelete ? 'Удалить' : 'Редактировать'}
                onClickButtonCancel={confirmDelete ? () => setConfirmDelete(false) : onClose}
                onClickButtonApply={confirmDelete ? handleDelete : onEdit}
                propsButtonApply={
                    confirmDelete
                        ? { view: 'outlined-danger' as const, loading: deleteMutation.isPending }
                        : { view: 'outlined' as const }
                }
                renderButtonsStart={() =>
                    !confirmDelete ? (
                        <Button view="outlined-danger" onClick={() => setConfirmDelete(true)}>
                            <TrashBin />
                            Удалить
                        </Button>
                    ) : null
                }
            />
        </Dialog>
    )
}

const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <Text variant="caption-2" color="secondary" style={{ minWidth: 130 }}>
            {label}
        </Text>
        <Text variant="body-2">{value}</Text>
    </div>
)

// ─── Страница ─────────────────────────────────────────────────────────────────

const EmailAccountsPage = () => {
    const { data, isLoading } = useEmailAccountsQuery()
    const accounts = data?.accounts ?? []

    const [createOpen, setCreateOpen] = useState(false)
    const [viewAccount, setViewAccount] = useState<EmailAccount | null>(null)
    const [editAccount, setEditAccount] = useState<EmailAccount | null>(null)

    const handleEditFromView = () => {
        setEditAccount(viewAccount)
        setViewAccount(null)
    }

    return (
        <PageWrapper>
            <PageHeader title="Email аккаунты">
                <PageHeaderActions>
                    <Button view="action" size="l" onClick={() => setCreateOpen(true)}>
                        <Plus />
                        Добавить
                    </Button>
                </PageHeaderActions>
            </PageHeader>

            {isLoading ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} style={{ width: 280, height: 110, borderRadius: 8 }} />
                    ))}
                </div>
            ) : accounts.length === 0 ? (
                <Text color="secondary">Нет добавленных email-аккаунтов</Text>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {accounts.map((acc) => {
                        const isSmtp = (acc.provider ?? 'smtp') === 'smtp'
                        return (
                            <Card
                                key={acc.id}
                                type="action"
                                onClick={() => setViewAccount(acc)}
                                style={{ width: 280, padding: '16px 20px', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <Text variant="subheader-2">{acc.slug}</Text>
                                    <Label theme={isSmtp ? (acc.secure ? 'success' : 'warning') : 'info'} size="s">
                                        {isSmtp ? (acc.secure ? 'SSL' : 'SMTP') : 'RuSender'}
                                    </Label>
                                </div>
                                {isSmtp ? (
                                    <>
                                        <Text variant="body-1" color="secondary" style={{ display: 'block' }}>
                                            {acc.host}:{acc.port}
                                        </Text>
                                        <Text variant="caption-2" color="secondary" style={{ display: 'block', marginTop: 4 }}>
                                            {acc.login}
                                        </Text>
                                    </>
                                ) : (
                                    <Text variant="body-1" color="secondary" style={{ display: 'block' }}>
                                        {acc.login}
                                    </Text>
                                )}
                                {acc.fromName && (
                                    <Text variant="caption-2" color="secondary" style={{ display: 'block', marginTop: 4 }}>
                                        {acc.fromName}
                                    </Text>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Создание */}
            <AccountFormDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />

            {/* Просмотр */}
            <ViewDialog
                account={viewAccount}
                onClose={() => setViewAccount(null)}
                onEdit={handleEditFromView}
            />

            {/* Редактирование */}
            <AccountFormDialog
                open={!!editAccount}
                account={editAccount}
                onClose={() => setEditAccount(null)}
            />
        </PageWrapper>
    )
}

export default EmailAccountsPage
