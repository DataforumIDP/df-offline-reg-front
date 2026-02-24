import { MobileDateTimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

// Цвета из Gravity UI темы
const colors = {
    brand: 'rgb(109, 199, 255)', // --g-color-private-brand-550
    brandHover: 'rgb(138, 210, 255)', // --g-color-private-brand-650-solid
    background: 'rgb(34, 29, 34)', // --g-color-base-background
    float: 'rgb(50, 45, 50)', // немного светлее для popup
    generic: 'rgba(255, 255, 255, 0.08)', // --g-color-base-generic
    genericHover: 'rgba(255, 255, 255, 0.12)',
    textPrimary: 'rgba(255, 255, 255, 0.95)',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    line: 'rgba(255, 255, 255, 0.15)',
    lineHover: 'rgba(255, 255, 255, 0.25)',
}

// Тема MUI под Gravity UI (dark theme)
const gravityTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: colors.brand,
        },
        background: {
            paper: colors.float,
            default: colors.background,
        },
        text: {
            primary: colors.textPrimary,
            secondary: colors.textSecondary,
        },
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    components: {
        MuiTextField: {
            // sx: {

            // },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        height: '20px',
                        borderRadius: '6px',
                        backgroundColor: colors.generic,
                        '& fieldset': {
                            borderColor: colors.line,
                        },
                        '&:hover': {
                            backgroundColor: colors.genericHover,
                        },
                        '&:hover fieldset': {
                            borderColor: colors.lineHover,
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: colors.brand,
                            borderWidth: '1px',
                        },
                        '& input': {
                            padding: '0 0px',
                            fontSize: '13px',
                            color: colors.textPrimary,
                            '&::placeholder': {
                                color: colors.textSecondary,
                                opacity: 1,
                            },
                        },
                        '& .MuiInputAdornment-root .MuiIconButton-root': {
                            color: colors.textSecondary,
                            padding: '1px',
                            width: '10px !important',
                            '& svg': {
                                fontSize: '14px',
                            },
                        },
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: colors.float,
                    borderRadius: '12px',
                    border: `1px solid ${colors.line}`,
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: '12px 16px',
                    borderTop: `1px solid ${colors.line}`,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '8px',
                },
                textPrimary: {
                    color: colors.brand,
                    '&:hover': {
                        backgroundColor: 'rgba(109, 199, 255, 0.1)',
                    },
                },
            },
        },
    },
})

interface DateTimePickerProps {
    value: Dayjs | null
    onChange: (value: Dayjs | null) => void
    label?: string
    placeholder?: string
    minDateTime?: Dayjs
    maxDateTime?: Dayjs
}

export const DateTimePicker = ({
    value,
    onChange,
    label,
    placeholder,
    minDateTime,
    maxDateTime,
}: DateTimePickerProps) => {
    return (
        <ThemeProvider theme={gravityTheme}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                <MobileDateTimePicker
                    value={value}
                    onChange={onChange}
                    label={label}
                    minDateTime={minDateTime}
                    maxDateTime={maxDateTime}
                    format="DD.MM.YYYY HH:mm"
                    ampm={false}
                    slotProps={{
                        textField: {
                            size: 'small',
                            InputLabelProps: { shrink: true },
                            inputProps: {
                                placeholder: placeholder || 'дд.мм.гггг чч:мм',
                            },
                            sx: {
                                '& .MuiPickersInputBase-root': {
                                    height: '28px',
                                    borderRadius: '6px',
                                    '& input': {
                                        padding: '0 8px',
                                        fontSize: '13px',
                                        '&::placeholder': {
                                            opacity: 1,
                                        },
                                    },
                                },
                                '& .MuiPickersSectionList-root': {
                                    padding: '0px',
                                },
                                '& .MuiIconButton-root': {
                                    width: '12px',
                                    height: '12px',
                                    padding: '0px',
                                    paddingRight: '16px',
                                    '& svg': {
                                        fontSize: '16px',
                                    },
                                },
                            },
                        },
                        actionBar: {
                            actions: ['clear', 'cancel', 'accept'],
                        },
                    }}
                    localeText={{
                        cancelButtonLabel: 'Отмена',
                        okButtonLabel: 'ОК',
                        clearButtonLabel: 'Очистить',
                        todayButtonLabel: 'Сегодня',
                        fieldDayPlaceholder: () => 'дд',
                        fieldMonthPlaceholder: () => 'мм',
                        fieldYearPlaceholder: () => 'гггг',
                        fieldHoursPlaceholder: () => 'чч',
                        fieldMinutesPlaceholder: () => 'мм',
                    }}
                />
            </LocalizationProvider>
        </ThemeProvider>
    )
}

export default DateTimePicker
