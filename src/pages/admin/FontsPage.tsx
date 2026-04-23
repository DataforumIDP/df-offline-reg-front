import { useState, useRef } from 'react'
import {
    Text,
    Button,
    Card,
    Skeleton,
    Label,
    Dialog,
    TextInput,
    Spin as Spinner,
} from '@gravity-ui/uikit'
import { Plus, TrashBin, TextAlignLeft, CloudArrowUpIn, Check, Xmark } from '@gravity-ui/icons'
import { PageWrapper, PageHeader, PageHeaderActions } from '@/components/atoms'
import {
    useCloudFontsQuery,
    useCreateCloudFont,
    useDeleteCloudFont,
} from '@/hooks/queries/useCloudFontsQueries'
import { CloudFont } from '@/services/api/cloudFonts'
import { uploadFile, getFileUrl } from '@/services/api/files'
import styles from './FontsPage.module.css'

// ─── Стандартные шрифты ─────────────────────────────────────────────────────

const STANDARD_FONTS = [
    { name: 'InterGF', description: 'Inter GF' },
    { name: 'Roboto', description: 'Google Roboto' },
    { name: 'Segoe UI', description: 'Microsoft Segoe UI' },
    { name: 'Times New Roman', description: 'Times New Roman' },
    { name: 'TikTok Sans', description: 'TikTok Sans' },
    { name: 'Montserrat', description: 'Montserrat' },
]

// ─── Тип состояния загрузки одного файла ──────────────────────────────────

type UploadState =
    | { status: 'idle' }
    | { status: 'uploading' }
    | { status: 'done'; url: string; filename: string }
    | { status: 'error'; message: string }

// ─── Поле загрузки файла шрифта ──────────────────────────────────────────

interface FontFileFieldProps {
    label: string
    state: UploadState
    onChange: (file: File) => void
    inputRef: React.RefObject<HTMLInputElement>
}

const FontFileField = ({ label, state, onChange, inputRef }: FontFileFieldProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) onChange(file)
        // Сбрасываем чтобы можно было заново выбрать тот же файл
        e.target.value = ''
    }

    return (
        <div className={styles.fileField}>
            <input
                ref={inputRef}
                type="file"
                accept=".ttf,.otf"
                style={{ display: 'none' }}
                onChange={handleChange}
            />
            <div
                className={`${styles.fileDropzone} ${state.status === 'done' ? styles.fileDropzoneDone : ''} ${state.status === 'error' ? styles.fileDropzoneError : ''}`}
                onClick={() => inputRef.current?.click()}
            >
                <div className={styles.fileDropzoneLeft}>
                    {state.status === 'idle' && (
                        <div className={styles.fileIcon}>
                            <CloudArrowUpIn />
                        </div>
                    )}
                    {state.status === 'uploading' && (
                        <div className={styles.fileIcon}>
                            <Spinner size="s" />
                        </div>
                    )}
                    {state.status === 'done' && (
                        <div className={`${styles.fileIcon} ${styles.fileIconDone}`}>
                            <Check />
                        </div>
                    )}
                    {state.status === 'error' && (
                        <div className={`${styles.fileIcon} ${styles.fileIconError}`}>
                            <Xmark />
                        </div>
                    )}
                    <div>
                        <Text variant="body-2" className={styles.fileLabel}>
                            {label}
                        </Text>
                        <Text style={{marginLeft: 20}} variant="caption-1" color="secondary">
                            {state.status === 'idle' && 'Нажмите чтобы выбрать TTF / OTF'}
                            {state.status === 'uploading' && 'Загрузка...'}
                            {state.status === 'done' && state.filename}
                            {state.status === 'error' && state.message}
                        </Text>
                    </div>
                </div>
                {state.status === 'done' && (
                    <Label theme="success" size="s">
                        Готово
                    </Label>
                )}
                {state.status === 'error' && (
                    <Label theme="danger" size="s">
                        Ошибка
                    </Label>
                )}
            </div>
        </div>
    )
}

// ─── Модалка добавления шрифта ────────────────────────────────────────────

interface AddFontModalProps {
    open: boolean
    onClose: () => void
}

type VariantKey = 'normal' | 'bold' | 'italic' | 'bolditalic'

const VARIANT_LABELS: Record<VariantKey, string> = {
    normal: 'Regular',
    bold: 'Bold',
    italic: 'Italic',
    bolditalic: 'Bold Italic',
}

const emptyState = (): UploadState => ({ status: 'idle' })

const AddFontModal = ({ open, onClose }: AddFontModalProps) => {
    const [name, setName] = useState('')
    const [nameError, setNameError] = useState('')
    const [uploads, setUploads] = useState<Record<VariantKey, UploadState>>({
        normal: emptyState(),
        bold: emptyState(),
        italic: emptyState(),
        bolditalic: emptyState(),
    })

    const refs = {
        normal: useRef<HTMLInputElement>(null),
        bold: useRef<HTMLInputElement>(null),
        italic: useRef<HTMLInputElement>(null),
        bolditalic: useRef<HTMLInputElement>(null),
    }

    const createMutation = useCreateCloudFont()

    const handleFileChange = async (variant: VariantKey, file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext !== 'ttf' && ext !== 'otf') {
            setUploads((prev) => ({
                ...prev,
                [variant]: { status: 'error', message: 'Только TTF или OTF' },
            }))
            return
        }

        setUploads((prev) => ({ ...prev, [variant]: { status: 'uploading' } }))
        try {
            const key = await uploadFile(file, file.name)
            const url = getFileUrl(key)
            setUploads((prev) => ({
                ...prev,
                [variant]: { status: 'done', url, filename: file.name },
            }))
        } catch {
            setUploads((prev) => ({
                ...prev,
                [variant]: { status: 'error', message: 'Ошибка загрузки' },
            }))
        }
    }

    const allDone = (Object.keys(uploads) as VariantKey[]).every(
        (k) => uploads[k].status === 'done',
    )

    const handleCreate = async () => {
        if (!name.trim()) {
            setNameError('Название обязательно')
            return
        }
        setNameError('')
        if (!allDone) return

        const getUrl = (v: VariantKey) => (uploads[v] as { status: 'done'; url: string }).url

        try {
            await createMutation.mutateAsync({
                name: name.trim(),
                normalUrl: getUrl('normal'),
                boldUrl: getUrl('bold'),
                italicUrl: getUrl('italic'),
                bolditalicUrl: getUrl('bolditalic'),
            })
            handleClose()
        } catch (e: any) {
            // ошибки будут отображены через mutation error
        }
    }

    const handleClose = () => {
        setName('')
        setNameError('')
        setUploads({ normal: emptyState(), bold: emptyState(), italic: emptyState(), bolditalic: emptyState() })
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} size="m">
            <Dialog.Header caption="Добавить облачный шрифт" />
            <Dialog.Body>
                <div className={styles.modalBody}>
                    <div className={styles.modalNameField}>
                        <Text variant="subheader-2">Название шрифта</Text>
                        <TextInput
                            value={name}
                            onUpdate={(v) => {
                                setName(v)
                                if (v.trim()) setNameError('')
                            }}
                            placeholder="Например: BrandFont"
                            size="l"
                            error={nameError || undefined}
                            autoFocus
                        />
                    </div>

                    <div className={styles.modalDivider} />

                    <Text variant="subheader-2">Файлы шрифта</Text>
                    <Text variant="body-2" color="secondary" className={styles.modalHint}>
                        Загрузите 4 варианта. Файлы загружаются сразу после выбора.
                    </Text>

                    <div className={styles.fileGrid}>
                        {(Object.keys(VARIANT_LABELS) as VariantKey[]).map((variant) => (
                            <FontFileField
                                key={variant}
                                label={VARIANT_LABELS[variant]}
                                state={uploads[variant]}
                                onChange={(file) => handleFileChange(variant, file)}
                                inputRef={refs[variant]}
                            />
                        ))}
                    </div>

                    {createMutation.isError && (
                        <Text variant="body-2" color="danger">
                            Ошибка сохранения шрифта. Попробуйте снова.
                        </Text>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer
                onClickButtonApply={handleCreate}
                onClickButtonCancel={handleClose}
                textButtonApply="Сохранить"
                textButtonCancel="Отмена"
                loading={createMutation.isPending}
                propsButtonApply={{ disabled: !allDone || !name.trim() || createMutation.isPending }}
            />
        </Dialog>
    )
}

// ─── Карточка облачного шрифта ───────────────────────────────────────────

interface CloudFontCardProps {
    font: CloudFont
    onDelete: (id: number) => void
    isDeleting: boolean
}

const CloudFontCard = ({ font, onDelete, isDeleting }: CloudFontCardProps) => (
    <Card className={styles.card}>
        <div className={styles.cardIconWrap}>
            <CloudArrowUpIn className={styles.cardCloudIcon} />
        </div>
        <div className={styles.cardBody}>
            <Text variant="subheader-2" className={styles.cardName}>
                {font.name}
            </Text>
            <Label theme="info" size="s">
                Облачный
            </Label>
        </div>
        <Button
            view="flat-danger"
            size="s"
            className={styles.cardDelete}
            onClick={() => onDelete(font.id)}
            loading={isDeleting}
        >
            <Button.Icon>
                <TrashBin />
            </Button.Icon>
        </Button>
    </Card>
)

// ─── Карточка стандартного шрифта ────────────────────────────────────────

const StandardFontCard = ({ name, description }: { name: string; description: string }) => (
    <Card className={styles.card}>
        <div className={styles.cardIconWrap}>
            <TextAlignLeft className={styles.cardStdIcon} />
        </div>
        <div className={styles.cardBody}>
            <Text variant="subheader-2" className={styles.cardName}>
                {name}
            </Text>
            <Text variant="caption-1" color="secondary">
                {description}
            </Text>
        </div>
        <Label theme="normal" size="s" className={styles.cardLabel}>
            Встроенный
        </Label>
    </Card>
)

// ─── Главная страница ────────────────────────────────────────────────────

const FontsPage = () => {
    const [addOpen, setAddOpen] = useState(false)
    const { data, isLoading } = useCloudFontsQuery()
    const deleteMutation = useDeleteCloudFont()

    const cloudFonts = data?.fonts || []

    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Шрифты</Text>
                <PageHeaderActions>
                    <Button view="action" size="l" onClick={() => setAddOpen(true)}>
                        <Button.Icon>
                            <Plus />
                        </Button.Icon>
                        Добавить шрифт
                    </Button>
                </PageHeaderActions>
            </PageHeader>

            {/* Стандартные */}
            <section className={styles.section}>
                <Text variant="header-1" className={styles.sectionTitle}>
                    Стандартные шрифты
                </Text>
                <div className={styles.grid}>
                    {STANDARD_FONTS.map((f) => (
                        <StandardFontCard key={f.name} name={f.name} description={f.description} />
                    ))}
                </div>
            </section>

            {/* Облачные */}
            <section className={styles.section}>
                <Text variant="header-1" className={styles.sectionTitle}>
                    Облачные шрифты
                </Text>

                {isLoading ? (
                    <div className={styles.grid}>
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className={styles.card}>
                                <Skeleton style={{ height: 60 }} />
                            </Card>
                        ))}
                    </div>
                ) : cloudFonts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <CloudArrowUpIn className={styles.emptyIcon} />
                        <Text variant="subheader-2">Нет облачных шрифтов</Text>
                        <Text variant="body-2" color="secondary">
                            Нажмите «Добавить шрифт» чтобы загрузить первый
                        </Text>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {cloudFonts.map((font) => (
                            <CloudFontCard
                                key={font.id}
                                font={font}
                                onDelete={(id) => deleteMutation.mutate(id)}
                                isDeleting={
                                    deleteMutation.isPending &&
                                    deleteMutation.variables === font.id
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            <AddFontModal open={addOpen} onClose={() => setAddOpen(false)} />
        </PageWrapper>
    )
}

export default FontsPage
