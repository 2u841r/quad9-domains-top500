import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import PeriodTableView from '../components/PeriodTableView'
import { useIsMobile } from '../hooks/useIsMobile'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const PERIOD_VIEWS = ['daily', 'monthly', 'quarterly', 'yearly']

function HomePage() {
  const [view, setView] = useState('daily')
  const isMobile = useIsMobile()

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs) var(--space-xs) 0',
        backgroundColor: 'var(--color-dark-gray)',
      }}>
        {PERIOD_VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: isMobile ? 'var(--space-xxxs) var(--space-xs)' : 'var(--space-xxs) var(--space-sm)',
              fontSize: isMobile ? 'var(--font-size-md)' : 'var(--font-size-lg)',
              fontFamily: 'var(--font-family)',
              fontWeight: 'var(--font-weight)',
              textTransform: 'capitalize',
              cursor: 'pointer',
              background: 'none',
              borderRadius: 'var(--border-radius-default)',
              border: view === v
                ? '1px solid var(--color-accent)'
                : '1px solid var(--color-normal-gray)',
              color: view === v ? 'var(--color-accent)' : 'var(--color-lighterish-gray)',
              transition: 'var(--hover-transition)',
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <PeriodTableView key={view} view={view} />
    </>
  )
}
