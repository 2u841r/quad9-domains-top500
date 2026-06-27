import { createRootRoute, Outlet } from '@tanstack/react-router'
import ViewTabs from '../components/ViewTabs'

export const Route = createRootRoute({
  component: RootLayout,
})

function Header() {
  return (
    <header style={{
      backgroundColor: 'var(--color-darker-gray)',
      borderBottom: '1px solid var(--color-darkest-gray)',
      padding: 'var(--space-sm) var(--space-xs)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-xs)',
    }}>
      <img
        src={`${import.meta.env.BASE_URL}logo_light.svg`}
        alt="Quad9"
        style={{ height: 28, flexShrink: 0 }}
      />
      <span style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-lg)' }}>
        Top 500 Domain ranking explorer
      </span>
    </header>
  )
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-darkest-gray)',
      padding: 'var(--space-sm) var(--space-xs)',
      textAlign: 'center',
      fontSize: 'var(--font-size-lg)',
      color: 'var(--color-normal-gray)',
      display: 'flex',
      justifyContent: 'center',
      gap: 'var(--space-md)',
      flexWrap: 'wrap',
    }}>
      <span>
        Built by{' '}
        <a href="https://github.com/2u841r" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-lighter-gray)', textDecoration: 'none' }}>
          Zubair Ibn Zamir
        </a>
      </span>
      <span>
        Data by{' '}
        <a href="https://github.com/Quad9DNS/quad9-domains-top500" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-lighter-gray)', textDecoration: 'none' }}>
          Quad9
        </a>
      </span>
    </footer>
  )
}

function RootLayout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-gray)', color: 'var(--color-white)', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ViewTabs />
      <Outlet />
      <Footer />
    </div>
  )
}
