import {
  today, FIRST_DATE, MONTH_NAMES,
  availableYears, availableMonths, availableQuarters,
} from '../utils/dates'

const inputStyle = {
  backgroundColor: 'var(--color-darker-gray)',
  border: '1px solid var(--color-light-gray)',
  color: 'var(--color-lighter-gray)',
  fontSize: 'var(--font-size-lg)',
  fontFamily: 'var(--font-family)',
  borderRadius: 'var(--border-radius-default)',
  padding: 'var(--space-xxs) var(--space-xs)',
  outline: 'none',
  cursor: 'pointer',
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
    >
      {children}
    </select>
  )
}

function DaySelector({ period, onChange, excludes, latestDate }) {
  const disabledDates = new Set((excludes || []).map(p => p?.date).filter(Boolean))
  return (
    <input
      type="date"
      value={period?.date ?? ''}
      min={FIRST_DATE}
      max={latestDate ?? today()}
      onChange={e => {
        const d = e.target.value
        if (!disabledDates.has(d)) onChange({ type: 'day', date: d })
      }}
      style={inputStyle}
    />
  )
}

function isExcluded(excludes, type, matchFn) {
  return (excludes || []).some(e => e?.type === type && matchFn(e))
}

function MonthSelector({ period, onChange, excludes, latestDate }) {
  const years = availableYears(latestDate)
  const year = period?.year ?? years[0]
  const months = availableMonths(year, latestDate)
  return (
    <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
      <Select value={year} onChange={v => onChange({ type: 'month', year: +v, month: period?.month ?? months[0] })}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select value={period?.month ?? months[0]} onChange={v => onChange({ type: 'month', year, month: +v })}>
        {months.map(m => (
          <option key={m} value={m} disabled={isExcluded(excludes, 'month', e => e.year === year && e.month === m)}>
            {MONTH_NAMES[m]}
          </option>
        ))}
      </Select>
    </div>
  )
}

function QuarterSelector({ period, onChange, excludes, latestDate }) {
  const years = availableYears(latestDate)
  const year = period?.year ?? years[0]
  const quarters = availableQuarters(year, latestDate)
  return (
    <div style={{ display: 'flex', gap: 'var(--space-xxs)' }}>
      <Select value={year} onChange={v => onChange({ type: 'quarter', year: +v, quarter: period?.quarter ?? quarters[0] })}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select value={period?.quarter ?? quarters[0]} onChange={v => onChange({ type: 'quarter', year, quarter: +v })}>
        {quarters.map(q => (
          <option key={q} value={q} disabled={isExcluded(excludes, 'quarter', e => e.year === year && e.quarter === q)}>
            Q{q}
          </option>
        ))}
      </Select>
    </div>
  )
}

function YearSelector({ period, onChange, excludes, latestDate }) {
  const years = availableYears(latestDate)
  return (
    <Select value={period?.year ?? years[0]} onChange={v => onChange({ type: 'year', year: +v })}>
      {years.map(y => (
        <option key={y} value={y} disabled={isExcluded(excludes, 'year', e => e.year === y)}>
          {y}
        </option>
      ))}
    </Select>
  )
}

export default function PeriodSelector({ view, period, onChange, label, excludes, latestDate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <span style={{
        fontSize: 'var(--font-size-md)',
        color: 'var(--color-lighterish-gray)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        width: 60,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {view === 'daily' && <DaySelector period={period} onChange={onChange} excludes={excludes} latestDate={latestDate} />}
        {view === 'monthly' && <MonthSelector period={period} onChange={onChange} excludes={excludes} latestDate={latestDate} />}
        {view === 'quarterly' && <QuarterSelector period={period} onChange={onChange} excludes={excludes} latestDate={latestDate} />}
        {view === 'yearly' && <YearSelector period={period} onChange={onChange} excludes={excludes} latestDate={latestDate} />}
      </div>
    </div>
  )
}
