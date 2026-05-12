import { useDeferredValue, useEffect, useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getRawData, loadAllBin } from '../hooks/useQuad9Data'
import { buildTrendData } from '../utils/trends'

const RANGE_OPTIONS = [
  { key: '7', label: '7d' },
  { key: '30', label: '30d' },
  { key: '90', label: '90d' },
  { key: 'all', label: 'All' },
]

const COLORS = [
  'var(--color-accent)',
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
]

const FAANG = ['facebook.com', 'amazon.com', 'apple.com', 'netflix.com', 'google.com']
const CDN = ['cloudfront.net', 'akamaiedge.net', 'cloudflare.net', 'fastly.net', 'cdn77.org']

const panelStyle = {
  borderRadius: 'var(--border-radius-default)',
  border: '1px solid var(--color-darkest-gray)',
  backgroundColor: 'var(--color-darker-gray)',
}

function getRankAxisMax(domainStats, rangeDays) {
  const focusRank = Math.max(...domainStats.map(series => getSeriesFocusRank(series, rangeDays)), 0)
  const latestRank = Math.max(...domainStats.map(series => series.latestPosition ?? 0), 0)
  const bestWorst = Math.max(focusRank, latestRank)
  if (bestWorst <= 10) return Math.max(2, bestWorst)
  if (bestWorst <= 20) return Math.ceil(bestWorst / 5) * 5
  if (bestWorst <= 50) return Math.ceil(bestWorst / 10) * 10
  if (bestWorst <= 120) return Math.ceil(bestWorst / 20) * 20
  return Math.min(500, Math.ceil(bestWorst / 50) * 50)
}

function getSeriesFocusRank(series, rangeDays) {
  const positions = series.samples
    .map(sample => sample.position)
    .filter(position => position != null)
    .sort((a, b) => a - b)

  if (!positions.length) return 0

  // For long windows, show more of the tail; for short windows, keep the chart tighter.
  const percentile = rangeDays >= 180 ? 0.995 : rangeDays >= 90 ? 0.99 : 0.97
  const percentileIndex = Math.max(0, Math.ceil(positions.length * percentile) - 1)
  return positions[percentileIndex]
}

function getRankTicks(maxRank) {
  if (maxRank <= 6) return Array.from({ length: maxRank }, (_, i) => i + 1)
  if (maxRank <= 8) return [1, 2, 3, 4, 5, 6, 7, 8]
  if (maxRank <= 10) return [1, 2, 4, 6, 8, 10]
  if (maxRank <= 20) return [1, 5, 10, 15, 20].filter(tick => tick <= maxRank)
  if (maxRank <= 50) return [1, 10, 20, 30, 40, 50].filter(tick => tick <= maxRank)
  if (maxRank <= 120) return [1, 20, 40, 60, 80, 100, 120].filter(tick => tick <= maxRank)
  const ticks = [1]
  for (let tick = 50; tick <= maxRank; tick += 50) ticks.push(tick)
  return ticks
}

function SelectionChip({ domain, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-xxs)',
      padding: 'var(--space-4xs) var(--space-xxs)',
      borderRadius: 'var(--border-radius-default)',
      backgroundColor: 'rgba(255,255,255,0.06)',
      color: 'var(--color-white)',
      fontFamily: 'monospace',
      fontSize: 'var(--font-size-lg)',
    }}>
      {domain}
      <button onClick={() => onRemove(domain)} style={{
        background: 'none',
        border: 'none',
        color: 'var(--color-lighter-gray)',
        cursor: 'pointer',
        font: 'inherit',
        padding: 0,
      }}>
        x
      </button>
    </span>
  )
}

function TrendTooltip({ active, payload, label, selectedDomains, statsByDomain }) {
  if (!active || !payload?.length) return null
  const visible = payload
    .map((item) => {
      const match = /^(count|latest)_(\d+)$/.exec(item.dataKey)
      if (!match || !item.value) return null
      const idx = Number(match[2])
      return { item, idx }
    })
    .filter(Boolean)

  if (!visible.length) return null

  return (
    <div style={{
      backgroundColor: 'var(--color-darker-gray)',
      border: '1px solid var(--color-light-gray)',
      borderRadius: 'var(--border-radius-default)',
      padding: 'var(--space-xxs) var(--space-xs)',
      fontSize: 'var(--font-size-lg)',
    }}>
      <p style={{ color: 'var(--color-white)', margin: 0, fontFamily: 'monospace' }}>Rank #{label}</p>
      {visible.map(({ item, idx }) => {
        const domain = selectedDomains[idx]
        const latestPosition = statsByDomain.get(domain)?.latestPosition
        return (
          <p key={item.dataKey} style={{ color: item.color, margin: 0 }}>
            {domain}: {item.value} sample{item.value === 1 ? '' : 's'}
            {latestPosition === label ? ' • latest' : ''}
          </p>
        )
      })}
    </div>
  )
}

function TrendChart({ trendData, selectedDomains }) {
  const isMobile = useIsMobile()
  const statsByDomain = new Map(trendData.domainStats.map(series => [series.domain, series]))
  const maxRank = getRankAxisMax(trendData.domainStats, trendData.rangeDays)
  const ticks = getRankTicks(maxRank)
  const chartData = trendData.chartData.filter(row => row.rank <= maxRank)
  const hiddenOutliers = trendData.domainStats
    .map(series => ({
      domain: series.domain,
      count: series.samples.filter(sample => sample.position != null && sample.position > maxRank).length,
    }))
    .filter(item => item.count > 0)

  return (
    <div style={{ ...panelStyle, padding: isMobile ? 'var(--space-xs)' : 'var(--space-sm)' }}>
      <div style={{ marginBottom: 'var(--space-xs)' }}>
        <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-md)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Rank distribution
        </div>
        <div style={{ color: 'var(--color-normal-gray)', fontSize: isMobile ? 'var(--font-size-md)' : 'var(--font-size-lg)' }}>
          X = rank 1-{maxRank}, Y = appearances in the selected window. Solid overlays mark the latest sample.
        </div>
        {hiddenOutliers.length > 0 && (
          <div style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-md)', marginTop: 'var(--space-4xs)' }}>
            Hidden outliers beyond #{maxRank}:{' '}
            {hiddenOutliers.map(item => `${item.domain} (${item.count})`).join(', ')}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 240 : 320}>
        <BarChart data={chartData} margin={{ top: 0, right: isMobile ? 4 : 16, bottom: 0, left: isMobile ? 4 : 56 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="rank"
            tick={{ fill: '#c9c9c9', fontSize: isMobile ? 9 : 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            ticks={ticks}
            type="number"
            domain={[1, maxRank]}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#c9c9c9', fontSize: isMobile ? 9 : 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={isMobile ? 30 : 68}
            tickMargin={isMobile ? 2 : 12}
          />
          <Tooltip
            content={<TrendTooltip selectedDomains={selectedDomains} statsByDomain={statsByDomain} />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            offset={10}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {selectedDomains.map((domain, idx) => (
            <Bar
              key={`count_${domain}`}
              dataKey={`count_${idx}`}
              name={domain}
              fill={COLORS[idx % COLORS.length]}
              fillOpacity={0.22}
              stroke={COLORS[idx % COLORS.length]}
              strokeOpacity={0.6}
              maxBarSize={14}
              activeBar={{
                fill: COLORS[idx % COLORS.length],
                fillOpacity: 0.38,
                stroke: COLORS[idx % COLORS.length],
                strokeOpacity: 0.95,
              }}
            />
          ))}
          {selectedDomains.map((domain, idx) => (
            <Bar
              key={`latest_${domain}`}
              dataKey={`latest_${idx}`}
              name={`${domain} latest`}
              fill={COLORS[idx % COLORS.length]}
              maxBarSize={6}
              legendType="none"
              radius={[2, 2, 0, 0]}
              activeBar={{
                fill: COLORS[idx % COLORS.length],
                fillOpacity: 0.95,
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SummaryCards({ trendData }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-xs)' }}>
      {trendData.domainStats.map((series, idx) => (
        <div key={series.domain} style={{ ...panelStyle, padding: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)', marginBottom: 'var(--space-xxs)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length], flexShrink: 0 }} />
            <span style={{ color: 'var(--color-white)', fontFamily: 'monospace', fontSize: 'var(--font-size-lg)' }}>{series.domain}</span>
          </div>
          <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-lg)' }}>Latest: {series.latestPosition ? `#${series.latestPosition}` : 'n/a'}</div>
          <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-lg)' }}>Best: {series.bestPosition ? `#${series.bestPosition}` : 'n/a'}</div>
          <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-lg)' }}>Worst: {series.worstPosition ? `#${series.worstPosition}` : 'n/a'}</div>
          <div style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-md)' }}>
            Appeared {series.appearances}/{trendData.rangeDays} days
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentSamplesTable({ trendData, selectedDomains }) {
  const rows = trendData.recentRows.slice(0, 14)

  return (
    <div style={panelStyle}>
      <div style={{
        padding: 'var(--space-xs) var(--space-sm)',
        borderBottom: '1px solid var(--color-darkest-gray)',
        color: 'var(--color-lighter-gray)',
        fontSize: 'var(--font-size-md)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        Recent samples
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-lg)' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              {selectedDomains.map((domain, idx) => (
                <th key={domain} style={{ ...thStyle, color: COLORS[idx % COLORS.length] }}>{domain}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td style={tdStyleMono}>{row.date}</td>
                {selectedDomains.map((domain, idx) => (
                  <td key={domain} style={tdStyleMono}>
                    {row[`position_${idx}`] ? `#${row[`position_${idx}`]}` : <span style={{ color: 'var(--color-normal-gray)' }}>n/a</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle = {
  padding: 'var(--space-xxs) var(--space-sm)',
  textAlign: 'left',
  borderBottom: '1px solid var(--color-darkest-gray)',
  fontSize: 'var(--font-size-md)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  backgroundColor: 'var(--color-darker-gray)',
  whiteSpace: 'nowrap',
}

const tdStyleMono = {
  padding: 'var(--space-xxs) var(--space-sm)',
  borderBottom: '1px solid var(--color-darkest-gray)',
  fontFamily: 'monospace',
  color: 'var(--color-white)',
  whiteSpace: 'nowrap',
}

export default function TrendView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dict, setDict] = useState([])
  const [selectedDomains, setSelectedDomains] = useState([])
  const [rangeKey, setRangeKey] = useState('30')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    loadAllBin()
      .then(() => {
        const raw = getRawData()
        const loadedDict = raw.dict ?? []
        setDict(loadedDict)
        setSelectedDomains(loadedDict[0] ? [loadedDict[0]] : [])
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const trimmedSearch = deferredSearch.trim().toLowerCase()
  const suggestions = trimmedSearch
    ? dict
      .filter(domain => domain.includes(trimmedSearch) && !selectedDomains.includes(domain))
      .slice(0, 25)
    : []

  const addDomain = (domain) => {
    if (!domain || selectedDomains.includes(domain) || selectedDomains.length >= 5) return
    setSelectedDomains(prev => [...prev, domain])
    setSearch('')
  }

  const removeDomain = (domain) => {
    setSelectedDomains(prev => prev.filter(item => item !== domain))
  }

  const trendData = buildTrendData(getRawData(), selectedDomains, rangeKey)

  if (loading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-lighter-gray)' }}>Loading trend data...</div>
  }

  if (error) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: '#f87171' }}>{error}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ ...panelStyle, padding: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', flex: '1 1 320px' }}>
            <div>
              <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-md)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Domains
              </div>
              <div style={{ color: 'var(--color-normal-gray)', fontSize: 'var(--font-size-lg)' }}>
                Select up to 5 domains to compare rank distributions over time.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xxs)', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSelectedDomains(FAANG.filter(domain => dict.includes(domain)))
                  setSearch('')
                }}
                style={{
                  padding: 'var(--space-xxs) var(--space-sm)',
                  borderRadius: 'var(--border-radius-default)',
                  border: '1px solid var(--color-light-gray)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-lighter-gray)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-lg)',
                }}
              >
                FAANG
              </button>
              <button
                onClick={() => {
                  setSelectedDomains(CDN.filter(domain => dict.includes(domain)))
                  setSearch('')
                }}
                style={{
                  padding: 'var(--space-xxs) var(--space-sm)',
                  borderRadius: 'var(--border-radius-default)',
                  border: '1px solid var(--color-light-gray)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-lighter-gray)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                  fontSize: 'var(--font-size-lg)',
                }}
              >
                CDN
              </button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xxs)', flexWrap: 'wrap' }}>
              {selectedDomains.map(domain => (
                <SelectionChip key={domain} domain={domain} onRemove={removeDomain} />
              ))}
            </div>
            <div style={{ position: 'relative', maxWidth: 420 }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={selectedDomains.length >= 5 ? 'Remove a domain to add another' : 'Search domains...'}
                disabled={selectedDomains.length >= 5}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-dark-gray)',
                  border: '1px solid var(--color-light-gray)',
                  color: 'var(--color-lighter-gray)',
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family)',
                  borderRadius: 'var(--border-radius-default)',
                  padding: 'var(--space-xxs) var(--space-xs)',
                  outline: 'none',
                }}
              />
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  border: '1px solid var(--color-darkest-gray)',
                  backgroundColor: 'var(--color-dark-gray)',
                  zIndex: 5,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}>
                  {suggestions.map(domain => (
                    <button
                      key={domain}
                      onClick={() => addDomain(domain)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--space-xxs) var(--space-xs)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-white)',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                      }}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <div style={{ color: 'var(--color-lighter-gray)', fontSize: 'var(--font-size-md)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Range
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-xxs)', flexWrap: 'wrap' }}>
              {RANGE_OPTIONS.map(option => {
                const active = option.key === rangeKey
                return (
                  <button
                    key={option.key}
                    onClick={() => setRangeKey(option.key)}
                    style={{
                      padding: 'var(--space-xxs) var(--space-sm)',
                      borderRadius: 'var(--border-radius-default)',
                      border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-light-gray)'}`,
                      backgroundColor: active ? 'rgba(219,31,93,0.14)' : 'transparent',
                      color: active ? 'var(--color-white)' : 'var(--color-lighter-gray)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family)',
                      fontSize: 'var(--font-size-lg)',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {trendData && selectedDomains.length > 0 ? (
        <>
          <SummaryCards trendData={trendData} />
          <TrendChart trendData={trendData} selectedDomains={selectedDomains} />
          <RecentSamplesTable trendData={trendData} selectedDomains={selectedDomains} />
        </>
      ) : (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-lighter-gray)' }}>
          Select at least one domain to view trends.
        </div>
      )}
    </div>
  )
}
