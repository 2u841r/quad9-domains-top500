import { createFileRoute } from '@tanstack/react-router'
import Blog from '../components/Blog'

export const Route = createFileRoute('/blog')({
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
      <Blog />
    </main>
  ),
})
