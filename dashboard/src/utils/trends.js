const DOMAINS_PER_DAY = 500

export const DOMAIN_ALIASES = {
  'x.com': ['twitter.com'],
}

function clampRangeDays(rangeKey, totalDays) {
  if (rangeKey === 'all') return totalDays
  const parsed = Number.parseInt(rangeKey, 10)
  if (!Number.isFinite(parsed)) return Math.min(totalDays, 7)
  return Math.min(totalDays, Math.max(parsed, 7))
}

export function buildTrendData({ allBuf, dict, manifest }, domains, rangeKey = '30') {
  if (!allBuf || !dict || !manifest?.length || !domains?.length) return null

  const rangeDays = clampRangeDays(rangeKey, manifest.length)
  const startIdx = Math.max(0, manifest.length - rangeDays)
  const dates = manifest.slice(startIdx)

  const domainToId = new Map(dict.map((domain, id) => [domain, id]))
  const selected = domains
    .map((domain) => ({ domain, id: domainToId.get(domain) }))
    .filter(item => item.id != null)

  if (!selected.length) return null

  const selectedIds = new Map(selected.map(item => [item.id, item.domain]))
  for (const { domain } of selected) {
    for (const alias of (DOMAIN_ALIASES[domain] ?? [])) {
      const aliasId = domainToId.get(alias)
      if (aliasId != null && !selectedIds.has(aliasId)) selectedIds.set(aliasId, domain)
    }
  }
  const seriesMap = new Map(
    selected.map(({ domain }) => [
      domain,
      {
        domain,
        histogram: Array.from({ length: DOMAINS_PER_DAY }, () => ({ count: 0, recency: 0 })),
        samples: [],
        latestPosition: null,
        bestPosition: null,
        worstPosition: null,
        appearances: 0,
      },
    ])
  )

  dates.forEach((date, dateOffset) => {
    const absoluteIdx = startIdx + dateOffset
    const bufOffset = absoluteIdx * DOMAINS_PER_DAY
    const positions = new Map()

    for (let rank = 0; rank < DOMAINS_PER_DAY; rank++) {
      const id = allBuf[bufOffset + rank]
      const domain = selectedIds.get(id)
      if (!domain) continue
      const position = rank + 1
      const existing = positions.get(domain)
      if (existing == null || position < existing) positions.set(domain, position)
    }

    for (const [domain, position] of positions) {
      const rank = position - 1
      const series = seriesMap.get(domain)
      const bucket = series.histogram[rank]
      bucket.count += 1
      bucket.recency += dateOffset + 1
      series.appearances += 1
      series.bestPosition = series.bestPosition == null ? position : Math.min(series.bestPosition, position)
      series.worstPosition = series.worstPosition == null ? position : Math.max(series.worstPosition, position)
    }

    selected.forEach(({ domain }) => {
      const position = positions.get(domain) ?? null
      const series = seriesMap.get(domain)
      series.samples.push({ date, position, isLatest: dateOffset === dates.length - 1 })
      if (dateOffset === dates.length - 1) {
        series.latestPosition = position
      }
    })
  })

  const chartData = Array.from({ length: DOMAINS_PER_DAY }, (_, idx) => {
    const row = { rank: idx + 1 }
    selected.forEach(({ domain }, seriesIdx) => {
      const series = seriesMap.get(domain)
      const bucket = series.histogram[idx]
      row[`count_${seriesIdx}`] = bucket.count
      row[`recency_${seriesIdx}`] = bucket.recency
      row[`latest_${seriesIdx}`] = series.latestPosition === idx + 1 ? bucket.count || 1 : null
    })
    return row
  })

  const domainStats = selected.map(({ domain }) => {
    const series = seriesMap.get(domain)
    return {
      domain,
      latestPosition: series.latestPosition,
      bestPosition: series.bestPosition,
      worstPosition: series.worstPosition,
      appearances: series.appearances,
      missingDays: dates.length - series.appearances,
      samples: series.samples,
    }
  })

  const recentRows = dates
    .slice()
    .reverse()
    .map((date) => {
      const row = { date }
      domainStats.forEach((series, idx) => {
        const sample = series.samples.find(item => item.date === date)
        row[`position_${idx}`] = sample?.position ?? null
      })
      return row
    })

  return {
    rangeDays: dates.length,
    dates,
    chartData,
    domainStats,
    recentRows,
  }
}
