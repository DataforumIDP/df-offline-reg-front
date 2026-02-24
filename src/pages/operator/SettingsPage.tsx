import { Text } from '@gravity-ui/uikit'
import { PageWrapper, PageHeader } from '@/components/atoms'
import { PrintSettings } from '@/components/organisms/PrintSettings'

const OperatorSettingsPage = () => {
    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Настройки</Text>
            </PageHeader>

            <section>
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
        </PageWrapper>
    )
}

export default OperatorSettingsPage
