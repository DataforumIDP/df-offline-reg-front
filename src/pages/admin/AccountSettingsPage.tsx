import { Text } from '@gravity-ui/uikit'
import { PageWrapper, PageHeader } from '@/components/atoms'
import { PrintSettings } from '@/components/organisms/PrintSettings'
import { SessionsBlock } from '@/components/organisms/SessionsBlock'
import styles from './AccountSettingsPage.module.css'

const AccountSettingsPage = () => {
    return (
        <PageWrapper>
            <PageHeader>
                <Text variant="display-1">Настройки</Text>
            </PageHeader>

            <div className={styles.sectionsGrid}>
                <div className={styles.section}>
                    <Text variant="header-1" className={styles.sectionTitle}>
                        Сессии
                    </Text>
                    <Text variant="body-2" color="secondary" className={styles.sectionDescription}>
                        Управление активными сессиями вашего аккаунта. Вы можете завершить сессии на
                        других устройствах или авторизовать новое устройство по QR коду.
                    </Text>
                    <SessionsBlock />
                </div>

                <div className={styles.section}>
                    <Text variant="header-1" className={styles.sectionTitle}>
                        Печать
                    </Text>
                    <Text variant="body-2" color="secondary" className={styles.sectionDescription}>
                        Выберите способ печати бейджей. В режиме «WEB» PDF будет открываться в новой
                        вкладке браузера. В режиме «Сервер» PDF будет отправляться на приложение REGA
                        Print для прямой печати.
                    </Text>
                    <PrintSettings />
                </div>
            </div>
        </PageWrapper>
    )
}

export default AccountSettingsPage
