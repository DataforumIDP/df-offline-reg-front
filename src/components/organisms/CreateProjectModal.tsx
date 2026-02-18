import { TextInput, Text, Dialog } from '@gravity-ui/uikit'
import { useState } from 'react'
import { useCreateProjectMutation } from '@/hooks'
import { DateField } from '@/components/atoms'

interface CreateProjectModalProps {
    open: boolean
    onClose: () => void
}

const CreateProjectModal = ({ open, onClose }: CreateProjectModalProps) => {
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [dateStart, setDateStart] = useState<Date | null>(null)
    const [dateEnd, setDateEnd] = useState<Date | null>(null)

    const { mutate, isPending, error } = useCreateProjectMutation()

    const fieldErrors = (error as any)?.errors || {}
    const generalError = (error as any)?.error || (error as any)?.message

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !dateStart || !dateEnd) {
            return
        }

        mutate({
            title,
            dateStart: dateStart.toISOString(),
            dateEnd: dateEnd.toISOString(),
            slug: slug || undefined,
            description: description || undefined,
        })
    }

    const handleClose = () => {
        if (!isPending) {
            setTitle('')
            setSlug('')
            setDescription('')
            setDateStart(null)
            setDateEnd(null)
            onClose()
        }
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <Dialog.Header caption="Создание проекта" />
            <Dialog.Body>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    {generalError && (
                        <div
                            style={{
                                padding: '12px',
                                backgroundColor: 'var(--g-color-bg-danger)',
                                borderRadius: '4px',
                            }}
                        >
                            <Text color="danger">{generalError}</Text>
                        </div>
                    )}

                    {/* Название */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Название проекта *
                        </label>
                        <TextInput
                            placeholder="Введите название"
                            value={title}
                            onUpdate={setTitle}
                            disabled={isPending}
                            size="l"
                            error={!!fieldErrors.title}
                        />
                        {fieldErrors.title && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {fieldErrors.title}
                            </Text>
                        )}
                    </div>

                    {/* Даты */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <DateField
                            label="Дата начала"
                            value={dateStart}
                            onUpdate={setDateStart}
                            disabled={isPending}
                            error={!!fieldErrors.dateStart}
                            errorMessage={fieldErrors.dateStart}
                            required
                            size="l"
                        />

                        <DateField
                            label="Дата окончания"
                            value={dateEnd}
                            onUpdate={setDateEnd}
                            disabled={isPending}
                            error={!!fieldErrors.dateEnd}
                            errorMessage={fieldErrors.dateEnd}
                            required
                            size="l"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Slug
                        </label>
                        <TextInput
                            placeholder="Оставьте пустым для автогенерации"
                            value={slug}
                            onUpdate={setSlug}
                            disabled={isPending}
                            size="l"
                            error={!!fieldErrors.slug}
                        />
                        {fieldErrors.slug && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {fieldErrors.slug}
                            </Text>
                        )}
                    </div>

                    {/* Описание */}
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '4px',
                                fontSize: '12px',
                                color: 'var(--g-color-text-secondary)',
                            }}
                        >
                            Описание
                        </label>
                        <textarea
                            placeholder="Описание проекта"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid var(--g-color-line-generic)',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                            }}
                        />
                        {fieldErrors.description && (
                            <Text
                                variant="caption-2"
                                color="danger"
                                style={{ marginTop: '4px', display: 'block' }}
                            >
                                {fieldErrors.description}
                            </Text>
                        )}
                    </div>
                </form>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonCancel={handleClose}
                onClickButtonApply={() => {
                    const event = new Event('submit') as unknown as React.FormEvent
                    handleSubmit(event)
                }}
                textButtonCancel="Отмена"
                textButtonApply="Создать"
                propsButtonApply={{
                    disabled: !title || !dateStart || !dateEnd || isPending,
                }}
                propsButtonCancel={{
                    disabled: isPending,
                }}
            />
        </Dialog>
    )
}

export default CreateProjectModal
