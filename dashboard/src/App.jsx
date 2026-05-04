import { useState, useEffect } from 'react'
import { defaultPeriod, periodLabel, periodId, addDays } from './utils/dates'
import { withDeltas } from './utils/aggregate'
import { useQuad9Data } from './hooks/useQuad9Data'
import ViewTabs from './components/ViewTabs'
import PeriodSelector from './components/PeriodSelector'
import DomainTable from './components/DomainTable'
import ProgressBar from './components/ProgressBar'
import TopChart from './components/TopChart'
import Facts from './components/Facts'
import Blog from './components/Blog'

function Header() {
  return (
    <header style={{
      backgroundColor: 'var(--color-darker-gray)',
      borderBottom: '1px solid var(--color-darkest-gray)',
      padding: 'var(--space-sm) var(--space-xs)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-xs)',
    }}>
      <img
        src={`${import.meta.env.BASE_URL}logo_light.svg`}
        alt="Quad9"
        style={{ height: 28, flexShrink: 0 }}
      />
      <span style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-lg)' }}>
        Top 500 Domain ranking explorer
      </span>
    </header>
  )
}

export default function App() {
  const [view, setView] = useState('daily')
  const [primary, setPrimary] = useState(() => defaultPeriod('daily'))
  const [compare, setCompare] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showChart, setShowChart] = useState(false)

  const [primaryData, setPrimaryData] = useState(null)
  const [compareData, setCompareData] = useState(null)
  const [primaryLoading, setPrimaryLoading] = useState(false)

  const hook1 = useQuad9Data()
  const hook2 = useQuad9Data()

  useEffect(() => {
    const def = defaultPeriod(view)
    setPrimary(def)
    setCompare(null)
    setShowCompare(false)
    setPrimaryData(null)
    setCompareData(null)
  }, [view])

  useEffect(() => {
    if (!primary) return
    setPrimaryData(null)
    setPrimaryLoading(true)
    hook1.fetchPeriod(primary).then(data => {
      setPrimaryData(data)
      setPrimaryLoading(false)
    })
  }, [primary ? periodId(primary) : ''])

  useEffect(() => {
    if (!compare || !showCompare) {
      setCompareData(null)
      return
    }
    hook2.fetchPeriod(compare).then(data => setCompareData(data))
  }, [compare ? periodId(compare) : '', showCompare])

  const displayEntries = primaryData && compareData
    ? withDeltas(primaryData, compareData)
    : primaryData ?? null

  const hasCompare = !!(primaryData && compareData)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-gray)', color: 'var(--color-white)' }}>
      <Header />
      <ViewTabs view={view} onChange={setView} />

      <main style={{
        padding: 'var(--space-md) var(--space-xs)',
        maxWidth: view === 'facts' ? 960 : view === 'blog' ? 780 : 780,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}>
        {view === 'facts' ? <Facts /> : view === 'blog' ? <Blog /> : <>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <PeriodSelector view={view} period={primary} onChange={setPrimary} label="Period" />
              {showCompare && (
                <PeriodSelector view={view} period={compare} onChange={setCompare} label="Compare" />
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <ToggleBtn
                active={showCompare}
                onClick={() => {
                  setShowCompare(v => {
                    if (!v && primary) setCompare(adjacentPeriod(primary))
                    if (v) setCompareData(null)
                    return !v
                  })
                }}
                activeColor="var(--color-accent)"
              >
                {showCompare ? 'Remove compare' : '+ Compare'}
              </ToggleBtn>
              <ToggleBtn
                active={showChart}
                onClick={() => setShowChart(v => !v)}
                activeColor="var(--color-normal-gray)"
              >
                {showChart ? 'Hide chart' : 'Show chart'}
              </ToggleBtn>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxxs)' }}>
            <ProgressBar loading={hook1.loading} progress={hook1.progress} />
            {showCompare && <ProgressBar loading={hook2.loading} progress={hook2.progress} />}
          </div>

          {hook1.error && <p style={{ color: '#f87171', fontSize: 'var(--font-size-lg)' }}>{hook1.error}</p>}
          {hook2.error && <p style={{ color: '#f87171', fontSize: 'var(--font-size-lg)' }}>{hook2.error}</p>}

          {/* Period labels */}
          {primaryData && (
            <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-size-lg)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-white)' }}>{periodLabel(primary)}</span>
              </span>
              {hasCompare && compare && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-normal-gray)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--color-white)' }}>{periodLabel(compare)}</span>
                </span>
              )}
            </div>
          )}

          {showChart && primaryData && (
            <TopChart entries={primaryData} compareEntries={compareData} />
          )}

          <DomainTable
            entries={displayEntries}
            hasCompare={hasCompare}
            loading={primaryLoading && !primaryData}
          />
        </>}
      </main>

      <footer style={{
        borderTop: '1px solid var(--color-darkest-gray)',
        padding: 'var(--space-sm) var(--space-xs)',
        textAlign: 'center',
        fontSize: 'var(--font-size-lg)',
        color: 'var(--color-normal-gray)',
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--space-md)',
        flexWrap: 'wrap',
      }}>
        <span>
          Built by{' '}
          <a href="https://github.com/2u841r" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--color-lighter-gray)', textDecoration: 'none' }}>
            Zubair Ibn Zamir
          </a>
        </span>
        <span>
          Data by{' '}
          <a href="https://github.com/Quad9DNS/quad9-domains-top500" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--color-lighter-gray)', textDecoration: 'none' }}>
            Quad9
          </a>
        </span>
      </footer>
    </div>
  )
}

function ToggleBtn({ active, onClick, activeColor, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 'var(--font-size-lg)',
        padding: 'var(--space-xxs) var(--space-sm)',
        borderRadius: 'var(--border-radius-default)',
        border: `1px solid ${active ? activeColor : 'var(--color-normal-gray)'}`,
        color: active ? activeColor : 'var(--color-lighter-gray)',
        backgroundColor: active ? `${activeColor}18` : 'transparent',
        cursor: 'pointer',
        transition: 'var(--hover-transition)',
        fontFamily: 'var(--font-family)',
        fontWeight: 'var(--font-weight)',
      }}
    >
      {children}
    </button>
  )
}

function adjacentPeriod(period) {
  if (period.type === 'quarter') {
    const q = period.quarter < 4 ? period.quarter + 1 : period.quarter - 1
    return { type: 'quarter', year: period.year, quarter: q }
  }
  if (period.type === 'month') {
    const m = period.month < 12 ? period.month + 1 : period.month - 1
    return { type: 'month', year: period.year, month: m }
  }
  if (period.type === 'year') {
    return { type: 'year', year: period.year - 1 }
  }
  if (period.type === 'day') {
    return { type: 'day', date: addDays(period.date, -1) }
  }
}
