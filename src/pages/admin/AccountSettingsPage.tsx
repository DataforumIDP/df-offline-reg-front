import { Text } from '@gravity-ui/uikit'
import { PrintSettings } from '@/components/organisms/PrintSettings'
import styles from './AccountSettingsPage.module.css'

const AccountSettingsPage = () => {
    return (
        <div className={styles.page}>
            <Text variant="display-1" className={styles.title}>
                Настройки
            </Text>

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
    )
}

export default AccountSettingsPage
