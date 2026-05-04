import { useState, useEffect, useRef } from 'react'
import { loadAllBin, getRawData } from '../hooks/useQuad9Data'
import { computeFacts } from '../utils/facts'
import StickyTable from './StickyTable'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const sectionStyle = {
  border: '1px solid var(--color-darkest-gray)',
  borderRadius: 'var(--border-radius-default)',
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

function Section({ heading, children }) {
  const headingRef = useRef(null)
  const [headingH, setHeadingH] = useState(0)
  useEffect(() => {
    if (!headingRef.current) return
    const ro = new ResizeObserver(() => setHeadingH(headingRef.current.offsetHeight))
    ro.observe(headingRef.current)
    setHeadingH(headingRef.current.offsetHeight)
    return () => ro.disconnect()
  }, [])
  return (
    <div style={sectionStyle}>
      <div ref={headingRef} style={{ ...headingStyle, position: 'sticky', top: 0, zIndex: 10 }}>
        {heading}
      </div>
      {children({ theadTop: headingH })}
    </div>
  )
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
  const [modal, setModal] = useState(null) // { title, domains }

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
        <div style={thStyle}>Letters (without TLD)</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          backgroundColor: 'var(--color-darkest-gray)',
          borderTop: '1px solid var(--color-darkest-gray)',
        }} className="len-grid">
          {facts.lengthDist.map(([len, count]) => (
            <div
              key={len}
              onClick={() => setModal({ title: `${len}-letter domains`, domains: facts.lenDomains.get(len) })}
              style={{
                backgroundColor: 'var(--color-dark-gray)',
                padding: 'var(--space-xxs) var(--space-xs)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-md)', fontFamily: 'monospace' }}>{len} letters</span>
              <span style={{ color: 'var(--color-white)', fontFamily: 'monospace', fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most consistent */}
      <Section heading="Most consistent — top 100 by days in top 500 (no domain hit 100%)">
        {({ theadTop }) => (
          <StickyTable
            theadTop={theadTop}
            columns={[
              {
                key: 'domain',
                label: 'Domain',
                colWidth: '60%',
                style: { fontFamily: 'monospace', color: 'var(--color-white)' },
                render: v => <a href={`https://${v}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{v}</a>,
              },
              {
                key: 'count',
                label: 'Days',
                align: 'right',
                style: { color: 'var(--color-lighter-gray)' },
                render: (v, row) => `${v}/${facts.totalDays}`,
              },
              {
                key: 'pct',
                label: 'Coverage',
                align: 'right',
                style: { color: 'var(--color-accent)', fontFamily: 'monospace' },
                render: v => `${(v * 100).toFixed(1)}%`,
              },
            ]}
            rows={facts.mostConsistent}
          />
        )}
      </Section>

      <TldSection tlds={facts.tlds} tldDomains={facts.tldDomains} total={facts.totalUniqueDomains} onTldClick={(tld, domains) => setModal({ title: `.${tld} domains`, domains })} />

      {/* Day of week patterns */}
      <Section heading="Day-of-week patterns — top 100 consistent domains">
        {({ theadTop }) => (
        <StickyTable
          theadTop={theadTop}
          minWidth={520}
          columns={[
            {
              key: 'domain',
              label: 'Domain',
              sticky: true,
              maxWidth: '33vw',
              colWidth: '35%',
              expandable: true,
              href: v => `https://${v}`,
              style: { fontFamily: 'monospace', color: 'var(--color-white)' },
            },
            {
              key: 'avgOverall',
              label: 'Avg rank',
              align: 'right',
              style: { fontFamily: 'monospace', color: 'var(--color-lighter-gray)' },
              render: v => v.toFixed(1),
            },
            {
              key: 'bestDay',
              label: 'Best day',
              align: 'center',
              style: { fontFamily: 'monospace', color: '#4ade80' },
              render: (v, row) => <>{v} <span style={{ color: 'var(--color-normal-gray)' }}>#{row.bestAvg.toFixed(0)}</span></>,
            },
            {
              key: 'worstDay',
              label: 'Worst day',
              align: 'center',
              style: { fontFamily: 'monospace', color: '#f87171' },
              render: (v, row) => <>{v} <span style={{ color: 'var(--color-normal-gray)' }}>#{row.worstAvg.toFixed(0)}</span></>,
            },
            {
              key: 'swing',
              label: 'Swing',
              align: 'right',
              style: { fontFamily: 'monospace', color: 'var(--color-normal-gray)' },
              render: v => v.toFixed(1),
            },
            {
              key: 'dowAvgs',
              label: 'S M T W T F S',
              render: v => <DowBar avgs={v} />,
            },
          ]}
          rows={facts.dowPatterns}
        />
        )}
      </Section>

      {modal && <DomainListModal title={modal.title} domains={modal.domains} onClose={() => setModal(null)} />}
    </div>
  )
}

function DomainListModal({ title, domains, onClose }) {
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
            {title} <span style={{ color: 'var(--color-normal-gray)', fontWeight: 400 }}>({domains.length})</span>
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-normal-gray)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {slice.map(d => (
            <a key={d} href={`https://${d}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'block',
              padding: 'var(--space-xxs) var(--space-sm)',
              borderBottom: '1px solid var(--color-darkest-gray)',
              fontFamily: 'monospace', fontSize: 'var(--font-size-lg)',
              color: 'var(--color-white)',
              textDecoration: 'none',
            }}>{d}</a>
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

function TldSection({ tlds, tldDomains, total, onTldClick }) {
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
              <tr key={tld} onClick={() => onTldClick(tld, tldDomains.get(tld))} style={{ cursor: 'pointer' }}>
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
