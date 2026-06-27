import { createFileRoute } from '@tanstack/react-router'
import Facts from '../components/Facts'

export const Route = createFileRoute('/facts')({
  component: () => (
    <main style={{
      flex: 1,
      padding: 'var(--space-md) var(--space-xs)',
      maxWidth: 780,
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-md)',
    }}>
      <Facts />
    </main>
  ),
})
