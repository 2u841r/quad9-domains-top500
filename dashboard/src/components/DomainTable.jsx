import { useState } from 'react'
import StickyTable from './StickyTable'

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

export default function DomainTable({ entries, compareCount, loading }) {
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

  const showAgg = entries[0]?.avgPosition != null

  const minWidth = 52 + 260 + (showAgg ? 72 + 56 + 56 : 0) + compareCount * (84 + 72)

  const compareCols = []
  for (let i = 0; i < compareCount; i++) {
    compareCols.push(
      {
        key: `comparePos_${i}`,
        label: `C${i + 1}`,
        colWidth: 84,
        align: 'right',
        style: { color: 'var(--color-lighter-gray)', fontFamily: 'monospace' },
        render: v => v ?? <span style={{ color: 'var(--color-normal-gray)' }}>n/a</span>,
      },
      {
        key: `delta_${i}`,
        label: `Chg${i + 1}`,
        colWidth: 72,
        align: 'right',
        render: v => <DeltaBadge delta={v} />,
      },
    )
  }

  const columns = [
    {
      key: 'position',
      label: '#',
      sticky: true,
      width: 52,
      style: { color: 'var(--color-lighter-gray)', fontFamily: 'monospace', paddingRight: 'var(--space-xxxs)' },
    },
    {
      key: 'domain_name',
      label: 'Domain',
      sticky: true,
      colWidth: 260,
      maxWidth: 'calc(50vw - 52px)',
      expandable: true,
      href: v => `https://${v}`,
      style: { color: 'var(--color-white)', fontFamily: 'monospace', paddingLeft: 'var(--space-xxxs)' },
    },
    ...(showAgg ? [
      {
        key: 'avgPosition',
        label: 'Avg rank',
        colWidth: 72,
        align: 'right',
        style: { color: 'var(--color-white)', fontFamily: 'monospace' },
        render: v => v.toFixed(1),
      },
      {
        key: 'daysAppeared',
        label: 'Days',
        colWidth: 56,
        align: 'right',
        style: { color: 'var(--color-lighter-gray)' },
      },
      {
        key: 'bestPosition',
        label: 'Best',
        colWidth: 56,
        align: 'right',
        style: { color: 'var(--color-lighter-gray)' },
      },
    ] : []),
    ...compareCols,
  ]

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
        maxWidth: '100%',
        overflow: 'hidden',
      }}>
        <StickyTable
          columns={columns}
          rows={filtered}
          theadTop={0}
          minWidth={minWidth}
          bgBase="var(--color-dark-gray)"
          bgHover="var(--color-darker-gray)"
        />
      </div>
    </div>
  )
}
