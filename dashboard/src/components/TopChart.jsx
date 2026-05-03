import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'

const PRIMARY_COLOR = '#a855f7'
const COMPARE_COLOR = '#38bdf8'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs">
      <p className="text-gray-300 mb-1 font-mono">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
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
    name: e.domain_name.replace(/\.com$/, '').replace(/\.net$/, '').slice(0, 14),
    primary: e.position,
    compare: compareEntries
      ? (compareEntries.find(c => c.domain_name === e.domain_name)?.position ?? null)
      : null,
  }))

  return (
    <div className="rounded border border-gray-800 p-4">
      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Top {top} domains</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            reversed
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="primary" name="Primary" fill={PRIMARY_COLOR} radius={[2, 2, 0, 0]} maxBarSize={20} />
          {compareEntries && (
            <Bar dataKey="compare" name="Compare" fill={COMPARE_COLOR} radius={[2, 2, 0, 0]} maxBarSize={20} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
