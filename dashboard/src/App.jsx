import { useState, useEffect } from 'react'
import { defaultPeriod, periodLabel, periodId } from './utils/dates'
import { withDeltas } from './utils/aggregate'
import { useQuad9Data } from './hooks/useQuad9Data'
import ViewTabs from './components/ViewTabs'
import PeriodSelector from './components/PeriodSelector'
import DomainTable from './components/DomainTable'
import ProgressBar from './components/ProgressBar'
import TopChart from './components/TopChart'

function Header() {
  return (
    <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
        <span className="text-white text-xs font-bold">Q9</span>
      </div>
      <h1 className="text-lg font-semibold text-gray-100">Quad9 Top 500</h1>
      <span className="text-gray-600 text-sm">Domain ranking explorer</span>
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

  // Reset on view change
  useEffect(() => {
    const def = defaultPeriod(view)
    setPrimary(def)
    setCompare(null)
    setShowCompare(false)
    setPrimaryData(null)
    setCompareData(null)
  }, [view])

  // Load primary data when period changes
  useEffect(() => {
    if (!primary) return
    setPrimaryData(null)
    setPrimaryLoading(true)
    hook1.fetchPeriod(primary).then(data => {
      setPrimaryData(data)
      setPrimaryLoading(false)
    })
  }, [primary ? periodId(primary) : ''])

  // Load compare data
  useEffect(() => {
    if (!compare || !showCompare) {
      setCompareData(null)
      return
    }
    hook2.fetchPeriod(compare).then(data => {
      setCompareData(data)
    })
  }, [compare ? periodId(compare) : '', showCompare])

  const displayEntries = primaryData && compareData
    ? withDeltas(primaryData, compareData)
    : primaryData ?? null

  const hasCompare = !!(primaryData && compareData)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <ViewTabs view={view} onChange={setView} />

      <main className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-start gap-6">
          <div className="space-y-3">
            <PeriodSelector
              view={view}
              period={primary}
              onChange={setPrimary}
              label="Period"
            />
            {showCompare && (
              <PeriodSelector
                view={view}
                period={compare}
                onChange={setCompare}
                label="Compare"
              />
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                setShowCompare(v => {
                  if (v) setCompareData(null)
                  return !v
                })
              }}
              className={`text-sm px-4 py-2 rounded border transition-colors ${
                showCompare
                  ? 'border-sky-500 text-sky-400 bg-sky-900/20'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {showCompare ? 'Remove compare' : '+ Compare'}
            </button>
            <button
              onClick={() => setShowChart(v => !v)}
              className={`text-sm px-4 py-2 rounded border transition-colors ${
                showChart
                  ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {showChart ? 'Hide chart' : 'Show chart'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <ProgressBar loading={hook1.loading} progress={hook1.progress} />
          {showCompare && (
            <ProgressBar loading={hook2.loading} progress={hook2.progress} />
          )}
        </div>

        {/* Errors */}
        {hook1.error && <p className="text-red-400 text-sm">{hook1.error}</p>}
        {hook2.error && <p className="text-red-400 text-sm">{hook2.error}</p>}

        {/* Period labels */}
        {primaryData && (
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              <span className="text-gray-300">{periodLabel(primary)}</span>
            </span>
            {hasCompare && compare && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                <span className="text-gray-300">{periodLabel(compare)}</span>
              </span>
            )}
          </div>
        )}

        {/* Chart */}
        {showChart && primaryData && (
          <TopChart entries={primaryData} compareEntries={compareData} />
        )}

        {/* Table */}
        <DomainTable
          entries={displayEntries}
          hasCompare={hasCompare}
          loading={primaryLoading && !primaryData}
        />
      </main>
    </div>
  )
}
