export default function ProgressBar({ loading, progress }) {
  if (!loading) return null
  return (
    <div style={{
      width: '100%',
      height: 2,
      backgroundColor: 'var(--color-darker-gray)',
      borderRadius: 'var(--border-radius-default)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        backgroundColor: 'var(--color-accent)',
        transition: 'width 0.2s ease-in-out',
      }} />
    </div>
  )
}
