import { useIsMobile } from '../hooks/useIsMobile'

const VIEWS = ['daily', 'monthly', 'quarterly', 'yearly', 'trend', 'facts', 'blog']

export default function ViewTabs({ view, onChange }) {
  const isMobile = useIsMobile()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      borderBottom: '1px solid var(--color-darkest-gray)',
      backgroundColor: 'var(--color-darker-gray)',
    }}>
      {VIEWS.map(v => {
        const active = view === v
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            style={{
              padding: isMobile ? 'var(--space-xxs) var(--space-xxs)' : 'var(--space-xs) var(--space-xs)',
              fontSize: isMobile ? 'var(--font-size-md)' : 'var(--font-size-lg)',
              fontFamily: 'var(--font-family)',
              fontWeight: 'var(--font-weight)',
              textTransform: 'capitalize',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: active ? 'var(--color-accent)' : 'var(--color-lighterish-gray)',
              marginBottom: -1,
              transition: 'var(--hover-transition)',
            }}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
