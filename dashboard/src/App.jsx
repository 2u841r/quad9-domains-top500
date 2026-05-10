import { useState, useEffect, useCallback } from 'react'
import { defaultPeriod, periodLabel, periodId, addDays } from './utils/dates'
import { withMultiDeltas } from './utils/aggregate'
import { useQuad9Data, fetchPeriodData, loadManifest } from './hooks/useQuad9Data'
import ViewTabs from './components/ViewTabs'
import PeriodSelector from './components/PeriodSelector'
import DomainTable from './components/DomainTable'
import ProgressBar from './components/ProgressBar'
import Facts from './components/Facts'
import Blog from './components/Blog'

let nextCmpId = 0

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
  const [primary, setPrimary] = useState(null)
  const [compareItems, setCompareItems] = useState([])
  const [latestDate, setLatestDate] = useState(undefined)

  const [primaryData, setPrimaryData] = useState(null)
  const [primaryLoading, setPrimaryLoading] = useState(false)

  const primaryHook = useQuad9Data()

  const onCompareDataLoaded = useCallback((id, data) => {
    setCompareItems(prev => prev.map(c => c.id === id ? { ...c, data } : c))
  }, [])

  useEffect(() => {
    loadManifest()
      .then(dates => setLatestDate(dates[dates.length - 1] ?? null))
      .catch(() => setLatestDate(null))
  }, [])

  useEffect(() => {
    if (latestDate === undefined) return
    const def = defaultPeriod(view, latestDate)
    setPrimary(def)
    setCompareItems([])
    setPrimaryData(null)
  }, [view, latestDate])

  useEffect(() => {
    if (!primary) return
    setPrimaryData(null)
    setPrimaryLoading(true)
    primaryHook.fetchPeriod(primary).then(data => {
      setPrimaryData(data)
      setPrimaryLoading(false)
    })
  }, [primary ? periodId(primary) : ''])

  const addCompare = useCallback(() => {
    const id = nextCmpId++
    const lastPeriod = compareItems.length > 0 ? compareItems[compareItems.length - 1].period : primary
    setCompareItems(prev => [...prev, { id, period: adjacentPeriod(lastPeriod) }])
  }, [primary, compareItems])

  const removeCompare = useCallback((id) => {
    setCompareItems(prev => prev.filter(c => c.id !== id))
  }, [])

  const updateComparePeriod = useCallback((id, period) => {
    setCompareItems(prev => prev.map(c => c.id === id ? { ...c, period } : c))
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-gray)', color: 'var(--color-white)', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ViewTabs view={view} onChange={setView} />

      <main style={{
        flex: 1,
        padding: 'var(--space-md) var(--space-xs)',
        maxWidth: view === 'facts' ? 780 : view === 'blog' ? 780 : undefined,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}>
        {view === 'facts' ? <Facts /> : view === 'blog' ? <Blog /> : <div style={{ width: 'fit-content', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <PeriodSelector view={view} period={primary} onChange={setPrimary} label="Period" excludes={compareItems.map(c => c.period)} latestDate={latestDate} />
              {primary && compareItems.length === 0 && (
                <button onClick={addCompare} style={actionBtnStyle}>
                  <span className="hide-mobile">+ Compare</span>
                  <span className="show-mobile">+</span>
                </button>
              )}
            </div>
            {compareItems.map((cmp, i) => (
              <CompareRow
                key={cmp.id}
                view={view}
                compare={cmp}
                index={i}
                isLast={i === compareItems.length - 1}
                latestDate={latestDate}
                excludes={[primary, ...compareItems.filter((_, j) => j !== i).map(c => c.period)]}
                onPeriodChange={updateComparePeriod}
                onRemove={removeCompare}
                onAdd={addCompare}
                onDataLoaded={onCompareDataLoaded}
              />
            ))}
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xxxs)' }}>
            <ProgressBar loading={primaryHook.loading} progress={primaryHook.progress} />
          </div>

          {primaryHook.error && <p style={{ color: '#f87171', fontSize: 'var(--font-size-lg)' }}>{primaryHook.error}</p>}

          <CompareLabels primary={primary} primaryData={primaryData} compareItems={compareItems} />

          <DomainTable
            entries={computeEntries(primaryData, compareItems)}
            compareCount={compareItems.length > 0 && compareItems.every(c => c.data) ? compareItems.length : 0}
            loading={primaryLoading && !primaryData}
          />
        </div>}
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

function computeEntries(primaryData, compareItems) {
  if (!primaryData) return null
  if (compareItems.length === 0) return primaryData
  const allLoaded = compareItems.every(c => c.data)
  if (!allLoaded) return primaryData
  return withMultiDeltas(primaryData, compareItems.map((c, i) => ({ entries: c.data, index: i })))
}

const compareColors = [
  'var(--color-accent)',
  '#a78bfa',
  '#38bdf8',
  '#fb923c',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#818cf8',
]

function CompareLabels({ primary, primaryData, compareItems }) {
  if (!primaryData) return null
  return (
    <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-size-lg)', flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: compareColors[0], flexShrink: 0 }} />
        <span style={{ color: 'var(--color-white)' }}>{periodLabel(primary)}</span>
      </span>
      {compareItems.map((cmp, i) => (
        <span key={cmp.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: compareColors[(i + 1) % compareColors.length], flexShrink: 0 }} />
          <span style={{ color: 'var(--color-white)' }}>{periodLabel(cmp.period)}</span>
        </span>
      ))}
    </div>
  )
}

function CompareRow({ view, compare, index, isLast, latestDate, excludes, onPeriodChange, onRemove, onAdd, onDataLoaded }) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!compare.period) return
    let cancelled = false
    setLoading(true)
    fetchPeriodData(compare.period)
      .then(data => {
        if (!cancelled && data) {
          onDataLoaded(compare.id, data)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [compare.period ? periodId(compare.period) : ''])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <PeriodSelector
        view={view}
        period={compare.period}
        onChange={p => onPeriodChange(compare.id, p)}
        label={`C${index + 1}`}
        excludes={excludes}
        latestDate={latestDate}
      />
      <button onClick={() => onRemove(compare.id)} style={actionBtnStyle}>x</button>
      {loading && <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-lighter-gray)' }}>...</span>}
      {isLast && <button onClick={onAdd} style={actionBtnStyle}><span className="hide-mobile">+ Compare</span><span className="show-mobile">+</span></button>}
    </div>
  )
}

const actionBtnStyle = {
  fontSize: 'var(--font-size-lg)',
  padding: 'var(--space-xxs) var(--space-sm)',
  borderRadius: 'var(--border-radius-default)',
  border: '1px solid var(--color-normal-gray)',
  color: 'var(--color-lighter-gray)',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'var(--hover-transition)',
  fontFamily: 'var(--font-family)',
  fontWeight: 'var(--font-weight)',
}

function adjacentPeriod(period) {
  if (period.type === 'quarter') {
    if (period.quarter > 1) return { type: 'quarter', year: period.year, quarter: period.quarter - 1 }
    return { type: 'quarter', year: period.year - 1, quarter: 4 }
  }
  if (period.type === 'month') {
    if (period.month > 1) return { type: 'month', year: period.year, month: period.month - 1 }
    return { type: 'month', year: period.year - 1, month: 12 }
  }
  if (period.type === 'year') {
    return { type: 'year', year: period.year - 1 }
  }
  if (period.type === 'day') {
    return { type: 'day', date: addDays(period.date, -1) }
  }
}
