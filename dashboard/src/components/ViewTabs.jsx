import { Link } from '@tanstack/react-router'
import { useIsMobile } from '../hooks/useIsMobile'

const TABS = [
  { label: 'home', to: '/' },
  { label: 'trend', to: '/trend' },
  { label: 'facts', to: '/facts' },
  { label: 'blog', to: '/blog' },
]

export default function ViewTabs() {
  const isMobile = useIsMobile()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      borderBottom: '1px solid var(--color-darkest-gray)',
      backgroundColor: 'var(--color-darker-gray)',
    }}>
      {TABS.map(({ label, to }) => (
        <Link
          key={to}
          to={to}
          style={{
            padding: isMobile ? 'var(--space-xxs) var(--space-xxs)' : 'var(--space-xs) var(--space-xs)',
            fontSize: isMobile ? 'var(--font-size-md)' : 'var(--font-size-lg)',
            fontFamily: 'var(--font-family)',
            fontWeight: 'var(--font-weight)',
            textTransform: 'capitalize',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: '2px solid transparent',
            color: 'var(--color-lighterish-gray)',
            marginBottom: -1,
            transition: 'var(--hover-transition)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
          activeProps={{
            style: {
              padding: isMobile ? 'var(--space-xxs) var(--space-xxs)' : 'var(--space-xs) var(--space-xs)',
              fontSize: isMobile ? 'var(--font-size-md)' : 'var(--font-size-lg)',
              fontFamily: 'var(--font-family)',
              fontWeight: 'var(--font-weight)',
              textTransform: 'capitalize',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: '2px solid var(--color-accent)',
              color: 'var(--color-accent)',
              marginBottom: -1,
              transition: 'var(--hover-transition)',
              textDecoration: 'none',
              display: 'inline-block',
            },
          }}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
