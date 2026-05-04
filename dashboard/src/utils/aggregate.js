export function aggregateDays(daysData) {
  const stats = new Map()

  for (const day of daysData) {
    for (const { position, domain_name } of day) {
      if (!stats.has(domain_name)) {
        stats.set(domain_name, { total: 0, count: 0, best: 9999, worst: 0 })
      }
      const s = stats.get(domain_name)
      s.total += position
      s.count++
      if (position < s.best) s.best = position
      if (position > s.worst) s.worst = position
    }
  }

  const result = []
  for (const [domain_name, s] of stats) {
    result.push({
      domain_name,
      avgPosition: s.total / s.count,
      daysAppeared: s.count,
      bestPosition: s.best,
      worstPosition: s.worst,
    })
  }

  return result
    .sort((a, b) => a.avgPosition - b.avgPosition)
    .map((item, i) => ({ ...item, position: i + 1 }))
}

function buildCompareMap(entries) {
  return new Map(entries.map(e => [e.domain_name, e.position]))
}

export function withDeltas(primaryEntries, compareEntries) {
  const cmap = buildCompareMap(compareEntries)
  return primaryEntries.map(entry => {
    const cpos = cmap.get(entry.domain_name) ?? null
    return {
      ...entry,
      comparePosition: cpos,
      // positive = moved up in rank (lower number = better)
      delta: cpos != null ? cpos - entry.position : null,
    }
  })
}
