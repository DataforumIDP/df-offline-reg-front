import { Text } from '@gravity-ui/uikit'
import { PrintSettings } from '@/components/organisms/PrintSettings'

const OperatorSettingsPage = () => {
    return (
        <div style={{ padding: '24px', maxWidth: '800px' }}>
            <Text 
                variant="display-1" 
                style={{ 
                    display: 'block',
                    marginBottom: '32px',
                }}
            >
                Настройки
            </Text>

            <section style={{ marginBottom: '40px' }}>
                <Text 
                    variant="header-1" 
                    style={{ 
                        display: 'block',
                        marginBottom: '12px',
                    }}
                >
                    Печать
                </Text>
                <Text 
                    variant="body-2" 
                    color="secondary" 
                    style={{ 
                        display: 'block',
                        marginBottom: '20px',
                        lineHeight: '1.5',
                    }}
                >
                    Выберите способ печати бейджей. В режиме «WEB» PDF будет открываться в новой
                    вкладке браузера. В режиме «Сервер» PDF будет отправляться на приложение REGA
                    Print для прямой печати.
                </Text>
                <PrintSettings />
            </section>
        </div>
    )
}

export default OperatorSettingsPage
