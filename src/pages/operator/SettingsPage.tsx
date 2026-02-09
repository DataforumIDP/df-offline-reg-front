import { Text } from '@gravity-ui/uikit'
import { PrintSettings } from '@/components/organisms/PrintSettings'

const OperatorSettingsPage = () => {
    return (
        <div style={{ padding: '24px' }}>
            <Text variant="display-1" style={{ marginBottom: '24px' }}>
                Настройки
            </Text>

            <div style={{ marginBottom: '32px' }}>
                <Text variant="header-1" style={{ marginBottom: '8px' }}>
                    Печать
                </Text>
                <Text variant="body-2" color="secondary" style={{ marginBottom: '16px' }}>
                    Выберите способ печати бейджей. В режиме «WEB» PDF будет открываться в новой
                    вкладке браузера. В режиме «Сервер» PDF будет отправляться на приложение REGA
                    Print для прямой печати.
                </Text>
                <PrintSettings />
            </div>
        </div>
    )
}

export default OperatorSettingsPage
