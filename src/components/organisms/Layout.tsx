import { Outlet } from 'react-router-dom'
import { Text, Flex } from '@gravity-ui/uikit'

const Layout = () => {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      {/* Header / AppBar */}
      <Flex
        alignItems="center"
        style={{
          backgroundColor: 'var(--g-color-base-brand)',
          padding: '16px 24px',
        }}
      >
        <Text variant="header-1" color="light-primary">
          Offline Registration
        </Text>
      </Flex>

      {/* Main content */}
      <Flex
        direction="column"
        style={{
          flex: 1,
          padding: '32px 24px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <Outlet />
      </Flex>

      {/* Footer */}
      <Flex
        justifyContent="center"
        style={{
          padding: '24px 16px',
          marginTop: 'auto',
          backgroundColor: 'var(--g-color-base-float)',
          borderTop: '1px solid var(--g-color-line-generic)',
        }}
      >
        <Text variant="body-2" color="secondary">
          © 2025 Offline Registration. Все права защищены.
        </Text>
      </Flex>
    </Flex>
  )
}

export default Layout
