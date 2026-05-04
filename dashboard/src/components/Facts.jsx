import { useState, useEffect } from 'react'
import { loadAllBin, getRawData } from '../hooks/useQuad9Data'
import { computeFacts } from '../utils/facts'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const sectionStyle = {
  border: '1px solid var(--color-darkest-gray)',
  borderRadius: 'var(--border-radius-default)',
  overflow: 'hidden',
}

const headingStyle = {
  backgroundColor: 'var(--color-darker-gray)',
  padding: 'var(--space-xs) var(--space-sm)',
  fontSize: 'var(--font-size-lg)',
  color: 'var(--color-lighter-gray)',
  borderBottom: '1px solid var(--color-darkest-gray)',
  fontWeight: 600,
}

const thStyle = {
  padding: 'var(--space-xxs) var(--space-sm)',
  color: 'var(--color-lighter-gray)',
  fontSize: 'var(--font-size-md)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-darkest-gray)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--color-darker-gray)',
}

const tdStyle = {
  padding: 'var(--space-xxs) var(--space-sm)',
  fontSize: 'var(--font-size-lg)',
  borderBottom: '1px solid var(--color-darker-gray)',
}

function Stat({ label, value }) {
  return (
    <div style={{ padding: 'var(--space-xs) var(--space-sm)', borderBottom: '1px solid var(--color-darker-gray)' }}>
      <span style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-lg)' }}>{label} </span>
      <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function DowBar({ avgs }) {
  const valid = avgs.filter(v => v !== null)
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24 }}>
      {avgs.map((v, i) => {
        const pct = v === null ? 0 : 1 - (v - min) / (max - min + 1)
        const isMin = v === Math.min(...valid)
        return (
          <div key={i} title={`${DOW[i]}: ${v?.toFixed(1) ?? 'n/a'}`} style={{
            width: 8,
            height: v === null ? 2 : Math.max(4, pct * 24),
            backgroundColor: isMin ? 'var(--color-accent)' : 'var(--color-light-gray)',
            borderRadius: 1,
            flexShrink: 0,
          }} />
        )
      })}
    </div>
  )
}

export default function Facts() {
  const [facts, setFacts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    loadAllBin()
      .then(() => {
        const { allBuf, dict, manifest } = getRawData()
        setFacts(computeFacts(allBuf, dict, manifest))
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-lighter-gray)' }}>
      Loading facts...
    </div>
  )

  if (error) return (
    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: '#f87171' }}>{error}</div>
  )

  if (!facts) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

      {/* Overview */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Overview</div>
        <Stat label="Total days of data" value={facts.totalDays} />
        <Stat label="Unique domains ever seen" value={facts.totalUniqueDomains.toLocaleString()} />
        <Stat label="Domains with hyphens" value={facts.hyphenCount} />
        <Stat label="Domains with numbers" value={facts.numericCount} />
      </div>

      {/* Most consistent */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Most consistent — top 50 by days in top 500 (no domain hit 100%)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Domain</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Days</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {facts.mostConsistent.map(({ domain, count, pct }) => (
                <tr key={domain}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--color-white)' }}>{domain}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-lighter-gray)' }}>{count}/{facts.totalDays}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-accent)', fontFamily: 'monospace' }}>
                    {(pct * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TldSection tlds={facts.tlds} total={facts.totalUniqueDomains} />

      {/* Day of week patterns */}
      <div style={sectionStyle}>
        <div style={headingStyle}>
          Day-of-week patterns — top 50 consistent domains
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Domain</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg rank</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Best day</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Worst day</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Swing</th>
                <th style={{ ...thStyle }}>S M T W T F S</th>
              </tr>
            </thead>
            <tbody>
              {facts.dowPatterns.map(p => (
                <tr key={p.domain}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--color-white)', whiteSpace: 'nowrap' }}>{p.domain}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-lighter-gray)' }}>
                    {p.avgOverall.toFixed(1)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#4ade80', fontFamily: 'monospace' }}>
                    {p.bestDay} <span style={{ color: 'var(--color-normal-gray)' }}>#{p.bestAvg.toFixed(0)}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#f87171', fontFamily: 'monospace' }}>
                    {p.worstDay} <span style={{ color: 'var(--color-normal-gray)' }}>#{p.worstAvg.toFixed(0)}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-normal-gray)' }}>
                    {p.swing.toFixed(1)}
                  </td>
                  <td style={{ ...tdStyle }}>
                    <DowBar avgs={p.dowAvgs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

function TldSection({ tlds, total }) {
  const [showMore, setShowMore] = useState(false)
  const main = tlds.filter(([, count]) => (count / total) * 100 >= 1.0)
  const rest = tlds.filter(([, count]) => (count / total) * 100 < 1.0)
  const visible = showMore ? tlds : main

  return (
    <div style={sectionStyle}>
      <div style={headingStyle}>Unique domains by TLD</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>TLD</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Domains</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(([tld, count]) => (
              <tr key={tld}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--color-white)' }}>.{tld}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-lighter-gray)' }}>{count}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-normal-gray)', fontFamily: 'monospace' }}>
                  {((count / total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rest.length > 0 && (
        <button
          onClick={() => setShowMore(v => !v)}
          style={{
            width: '100%',
            padding: 'var(--space-xxs) var(--space-sm)',
            background: 'none',
            border: 'none',
            borderTop: '1px solid var(--color-darkest-gray)',
            color: 'var(--color-normal-gray)',
            fontSize: 'var(--font-size-lg)',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
            textAlign: 'center',
          }}
        >
          {showMore ? 'Show less' : `Show ${rest.length} more TLDs (under 1%)`}
        </button>
      )}
    </div>
  )
}
