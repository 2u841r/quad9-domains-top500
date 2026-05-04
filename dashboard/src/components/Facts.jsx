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
  wordBreak: 'break-word',
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
  const [lenModal, setLenModal] = useState(null)

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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Letters (without TLD)</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Domains</th>
              </tr>
            </thead>
            <tbody>
              {facts.lengthDist.map(([len, count]) => (
                <tr key={len} onClick={() => setLenModal({ len, domains: facts.lenDomains.get(len) })}
                  style={{ cursor: 'pointer' }}>
                  <td style={{ ...tdStyle, color: 'var(--color-lighter-gray)', fontFamily: 'monospace' }}>{len}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--color-white)' }}>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most consistent */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Most consistent — top 100 by days in top 500 (no domain hit 100%)</div>
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
          Day-of-week patterns — top 100 consistent domains
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2 }}>Domain</th>
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
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--color-white)', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--color-dark-gray)' }}>{p.domain}</td>
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

      {lenModal && <LenModal len={lenModal.len} domains={lenModal.domains} onClose={() => setLenModal(null)} />}
    </div>
  )
}

function LenModal({ len, domains, onClose }) {
  const [page, setPage] = useState(0)
  const PAGE = 100
  const pages = Math.ceil(domains.length / PAGE)
  const slice = domains.slice(page * PAGE, (page + 1) * PAGE)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-sm)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-darker-gray)',
          border: '1px solid var(--color-light-gray)',
          borderRadius: 'var(--border-radius-default)',
          width: '100%', maxWidth: 480,
          maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          padding: 'var(--space-xs) var(--space-sm)',
          borderBottom: '1px solid var(--color-darkest-gray)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>
            {len}-letter domains <span style={{ color: 'var(--color-normal-gray)', fontWeight: 400 }}>({domains.length})</span>
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-normal-gray)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {slice.map(d => (
            <div key={d} style={{
              padding: 'var(--space-xxs) var(--space-sm)',
              borderBottom: '1px solid var(--color-darkest-gray)',
              fontFamily: 'monospace', fontSize: 'var(--font-size-lg)',
              color: 'var(--color-white)',
            }}>{d}</div>
          ))}
        </div>

        {pages > 1 && (
          <div style={{
            borderTop: '1px solid var(--color-darkest-gray)',
            padding: 'var(--space-xxs) var(--space-sm)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ background: 'none', border: '1px solid var(--color-light-gray)', color: 'var(--color-lighter-gray)', borderRadius: 'var(--border-radius-default)', padding: '2px 10px', cursor: 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
              Prev
            </button>
            <span style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-lg)' }}>{page + 1} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              style={{ background: 'none', border: '1px solid var(--color-light-gray)', color: 'var(--color-lighter-gray)', borderRadius: 'var(--border-radius-default)', padding: '2px 10px', cursor: 'pointer', opacity: page === pages - 1 ? 0.3 : 1 }}>
              Next
            </button>
          </div>
        )}
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
