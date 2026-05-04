const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function computeFacts(allBuf, dict, manifest) {
  const totalDays = manifest.length
  const DOMAINS_PER_DAY = 500

  // Per-domain accumulators
  const dayCount   = new Map() // id → number of days appeared
  const totalPos   = new Map() // id → sum of positions
  const dowPos     = new Map() // id → [7][] of positions per day-of-week

  for (let d = 0; d < totalDays; d++) {
    const dow = new Date(manifest[d] + 'T00:00:00Z').getUTCDay()
    const offset = d * DOMAINS_PER_DAY
    for (let r = 0; r < DOMAINS_PER_DAY; r++) {
      const id  = allBuf[offset + r]
      const pos = r + 1
      dayCount.set(id, (dayCount.get(id) ?? 0) + 1)
      totalPos.set(id, (totalPos.get(id) ?? 0) + pos)
      if (!dowPos.has(id)) dowPos.set(id, Array.from({ length: 7 }, () => []))
      dowPos.get(id)[dow].push(pos)
    }
  }

  // 1. Most consistent — top 20 by days appeared
  const allDomains = [...dayCount.entries()]
    .map(([id, count]) => ({ domain: dict[id], count, pct: count / totalDays }))
    .sort((a, b) => b.count - a.count)
  const mostConsistent = allDomains.slice(0, 100)

  // 2. TLD breakdown + length distribution (count unique domains)
  const tldMap     = new Map()
  const lenMap     = new Map()
  let hyphenCount  = 0
  let numericCount = 0

  const lenDomains = new Map() // length → domain[]

  const tldDomains = new Map()

  for (const [id] of dayCount) {
    const domain = dict[id]
    const tld    = domain.split('.').pop()
    const label  = domain.slice(0, domain.lastIndexOf('.'))
    tldMap.set(tld, (tldMap.get(tld) ?? 0) + 1)
    if (!tldDomains.has(tld)) tldDomains.set(tld, [])
    tldDomains.get(tld).push(domain)
    lenMap.set(label.length, (lenMap.get(label.length) ?? 0) + 1)
    if (!lenDomains.has(label.length)) lenDomains.set(label.length, [])
    lenDomains.get(label.length).push(domain)
    if (domain.includes('-')) hyphenCount++
    if (/\d/.test(domain)) numericCount++
  }

  const lengthDist = [...lenMap.entries()].sort((a, b) => a[0] - b[0])
  for (const arr of lenDomains.values()) arr.sort()
  for (const arr of tldDomains.values()) arr.sort()

  const tlds = [...tldMap.entries()].sort((a, b) => b[1] - a[1])

  // 3. Day-of-week patterns — top 100 consistent domains
  const minDays = Math.floor(totalDays * 0.8)
  const pool = []
  for (const [id, count] of dayCount) {
    if (count < minDays) continue
    pool.push({ id, domain: dict[id], avg: totalPos.get(id) / count, count })
  }
  pool.sort((a, b) => a.avg - b.avg)
  const top100 = pool.slice(0, 100)

  const dowPatterns = top100.map(({ id, domain, avg, count }) => {
    const avgs = dowPos.get(id).map(positions =>
      positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null
    )
    const validIdxs = avgs.map((v, i) => v !== null ? i : -1).filter(i => i !== -1)
    const bestIdx  = validIdxs.reduce((b, i) => avgs[i] < avgs[b] ? i : b, validIdxs[0])
    const worstIdx = validIdxs.reduce((b, i) => avgs[i] > avgs[b] ? i : b, validIdxs[0])
    return {
      domain,
      avgOverall: avg,
      daysAppeared: count,
      bestDay:  DOW[bestIdx],
      bestAvg:  avgs[bestIdx],
      worstDay: DOW[worstIdx],
      worstAvg: avgs[worstIdx],
      swing: avgs[worstIdx] - avgs[bestIdx],
      dowAvgs: avgs,
    }
  })

  return {
    totalDays,
    totalUniqueDomains: dayCount.size,
    mostConsistent,
    tlds,
    tldDomains,
    hyphenCount,
    numericCount,
    lengthDist,
    lenDomains,
    dowPatterns,
  }
}
