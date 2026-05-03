import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: 'var(--color-darker-gray)',
      border: '1px solid var(--color-light-gray)',
      borderRadius: 'var(--border-radius-default)',
      padding: 'var(--space-xxs) var(--space-xs)',
      fontSize: 'var(--font-size-lg)',
    }}>
      <p style={{ color: 'var(--color-white)', marginBottom: 4, fontFamily: 'monospace' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: 0 }}>
          {p.name}: #{p.value}
        </p>
      ))}
    </div>
  )
}

export default function TopChart({ entries, compareEntries, top = 20 }) {
  const slice = entries?.slice(0, top)
  if (!slice?.length) return null

  const data = slice.map(e => ({
    name: e.domain_name.replace(/\.(com|net|org)$/, '').slice(0, 14),
    primary: e.position,
    compare: compareEntries
      ? (compareEntries.find(c => c.domain_name === e.domain_name)?.position ?? null)
      : null,
  }))

  return (
    <div style={{
      borderRadius: 'var(--border-radius-default)',
      border: '1px solid var(--color-darkest-gray)',
      padding: 'var(--space-sm)',
      backgroundColor: 'var(--color-darker-gray)',
    }}>
      <p style={{
        fontSize: 'var(--font-size-md)',
        color: 'var(--color-lighter-gray)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--space-xs)',
      }}>
        Top {top} domains
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#c9c9c9', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            reversed
            tick={{ fill: '#c9c9c9', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="primary" name="Primary" fill="var(--color-accent)" radius={[2, 2, 0, 0]} maxBarSize={20} />
          {compareEntries && (
            <Bar dataKey="compare" name="Compare" fill="var(--color-normal-gray)" radius={[2, 2, 0, 0]} maxBarSize={20} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
