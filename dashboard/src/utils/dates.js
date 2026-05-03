export const FIRST_DATE = '2025-06-01'

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function getDatesInRange(start, end) {
  const dates = []
  let cur = start
  while (cur <= end) {
    dates.push(cur)
    cur = addDays(cur, 1)
  }
  return dates
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
  return { start, end: lastDay }
}

export function getQuarterRange(year, quarter) {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = quarter * 3
  const start = `${year}-${String(startMonth).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).toISOString().slice(0, 10)
  return { start, end: lastDay }
}

export function getYearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` }
}

export function getPeriodRange(period) {
  const cap = (range) => ({ start: range.start, end: range.end > today() ? today() : range.end })
  if (period.type === 'day') return { start: period.date, end: period.date }
  if (period.type === 'month') return cap(getMonthRange(period.year, period.month))
  if (period.type === 'quarter') return cap(getQuarterRange(period.year, period.quarter))
  if (period.type === 'year') return cap(getYearRange(period.year))
}

export function periodLabel(period) {
  if (period.type === 'day') return period.date
  if (period.type === 'month') {
    return new Date(Date.UTC(period.year, period.month - 1, 1))
      .toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }
  if (period.type === 'quarter') return `Q${period.quarter} ${period.year}`
  if (period.type === 'year') return `${period.year}`
}

export function periodId(period) {
  if (period.type === 'day') return period.date
  if (period.type === 'month') return `${period.year}-M${period.month}`
  if (period.type === 'quarter') return `${period.year}-Q${period.quarter}`
  if (period.type === 'year') return `${period.year}`
}

export function defaultPeriod(view) {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1
  const q = Math.ceil(m / 3)
  const yest = addDays(today(), -1)

  if (view === 'daily') return { type: 'day', date: yest < FIRST_DATE ? FIRST_DATE : yest }
  if (view === 'monthly') return { type: 'month', year: y, month: m }
  if (view === 'quarterly') return { type: 'quarter', year: y, quarter: q }
  if (view === 'yearly') return { type: 'year', year: y }
}

export function availableYears() {
  const first = 2025
  const cur = new Date().getUTCFullYear()
  const out = []
  for (let y = cur; y >= first; y--) out.push(y)
  return out
}

export function availableMonths(year) {
  const firstYear = 2025, firstMonth = 6
  const now = new Date()
  const curY = now.getUTCFullYear()
  const curM = now.getUTCMonth() + 1
  const out = []
  for (let m = 12; m >= 1; m--) {
    if (year === firstYear && m < firstMonth) continue
    if (year === curY && m > curM) continue
    out.push(m)
  }
  return out
}

export function availableQuarters(year) {
  const now = new Date()
  const curY = now.getUTCFullYear()
  const curQ = Math.ceil((now.getUTCMonth() + 1) / 3)
  const out = []
  for (let q = 4; q >= 1; q--) {
    if (year === 2025 && q < 2) continue // data starts June 2025 = Q2
    if (year === curY && q > curQ) continue
    out.push(q)
  }
  return out
}

export const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
