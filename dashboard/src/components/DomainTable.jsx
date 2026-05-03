import { useState } from 'react'

function DeltaBadge({ delta }) {
  if (delta === null) {
    return <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-light-gray)', fontFamily: 'monospace' }}>new</span>
  }
  if (delta === 0) {
    return <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-light-gray)', fontFamily: 'monospace' }}>-</span>
  }
  const up = delta > 0
  return (
    <span style={{
      fontSize: 'var(--font-size-lg)',
      fontFamily: 'monospace',
      fontWeight: 600,
      color: up ? '#4ade80' : '#f87171',
    }}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  )
}

const thStyle = {
  padding: 'var(--space-xxs) var(--space-sm)',
  color: 'var(--color-lighter-gray)',
  fontSize: 'var(--font-size-md)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 'var(--font-weight)',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-darkest-gray)',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: 'var(--space-xxs) var(--space-sm)',
  fontSize: 'var(--font-size-lg)',
  borderBottom: '1px solid var(--color-darker-gray)',
}

export default function DomainTable({ entries, hasCompare, loading }) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? entries?.filter(e => e.domain_name.includes(search.toLowerCase()))
    : entries

  const total = filtered?.length ?? 0

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-lighter-gray)' }}>
        Loading...
      </div>
    )
  }

  if (!entries) {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-lighter-gray)' }}>
        Select a period to load data
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
        <input
          type="text"
          placeholder="Filter domains..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            backgroundColor: 'var(--color-darker-gray)',
            border: '1px solid var(--color-light-gray)',
            color: 'var(--color-lighter-gray)',
            fontSize: 'var(--font-size-lg)',
            fontFamily: 'var(--font-family)',
            borderRadius: 'var(--border-radius-default)',
            padding: 'var(--space-xxs) var(--space-xs)',
            outline: 'none',
            width: 240,
          }}
        />
        <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-normal-gray)' }}>
          {total} domains
        </span>
      </div>

      <div style={{
        borderRadius: 'var(--border-radius-default)',
        border: '1px solid var(--color-darkest-gray)',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 52 }}>#</th>
              <th style={thStyle}>Domain</th>
              {entries[0]?.avgPosition != null && (
                <>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Avg rank</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Days</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Best</th>
                </>
              )}
              {hasCompare && (
                <>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Compare #</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Change</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered?.map(entry => (
              <Row key={entry.domain_name} entry={entry} hasCompare={hasCompare} showAgg={entries[0]?.avgPosition != null} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ entry, hasCompare, showAgg }) {
  const [hovered, setHovered] = useState(false)
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? 'var(--color-darker-gray)' : 'transparent', transition: 'var(--hover-transition)' }}
    >
      <td style={{ ...tdStyle, color: 'var(--color-lighter-gray)', fontFamily: 'monospace' }}>{entry.position}</td>
      <td style={{ ...tdStyle, color: 'var(--color-white)', fontFamily: 'monospace' }}>{entry.domain_name}</td>
      {showAgg && (
        <>
          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-white)', fontFamily: 'monospace' }}>
            {entry.avgPosition.toFixed(1)}
          </td>
          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-lighter-gray)' }}>
            {entry.daysAppeared}
          </td>
          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-lighter-gray)' }}>
            {entry.bestPosition}
          </td>
        </>
      )}
      {hasCompare && (
        <>
          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-lighter-gray)', fontFamily: 'monospace' }}>
            {entry.comparePosition ?? <span style={{ color: 'var(--color-normal-gray)' }}>n/a</span>}
          </td>
          <td style={{ ...tdStyle, textAlign: 'right' }}>
            <DeltaBadge delta={entry.delta} />
          </td>
        </>
      )}
    </tr>
  )
}
