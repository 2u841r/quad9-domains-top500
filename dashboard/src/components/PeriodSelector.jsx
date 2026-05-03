import {
  today, FIRST_DATE, MONTH_NAMES,
  availableYears, availableMonths, availableQuarters,
  periodLabel,
} from '../utils/dates'

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500"
    >
      {children}
    </select>
  )
}

function DaySelector({ period, onChange }) {
  const val = period?.date ?? ''
  return (
    <input
      type="date"
      value={val}
      min={FIRST_DATE}
      max={today()}
      onChange={e => onChange({ type: 'day', date: e.target.value })}
      className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500"
    />
  )
}

function MonthSelector({ period, onChange }) {
  const years = availableYears()
  const year = period?.year ?? years[0]
  const months = availableMonths(year)

  return (
    <div className="flex gap-2">
      <Select value={year} onChange={v => onChange({ type: 'month', year: +v, month: period?.month ?? months[0] })}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select value={period?.month ?? months[0]} onChange={v => onChange({ type: 'month', year, month: +v })}>
        {months.map(m => <option key={m} value={m}>{MONTH_NAMES[m]}</option>)}
      </Select>
    </div>
  )
}

function QuarterSelector({ period, onChange }) {
  const years = availableYears()
  const year = period?.year ?? years[0]
  const quarters = availableQuarters(year)

  return (
    <div className="flex gap-2">
      <Select value={year} onChange={v => onChange({ type: 'quarter', year: +v, quarter: period?.quarter ?? quarters[0] })}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select value={period?.quarter ?? quarters[0]} onChange={v => onChange({ type: 'quarter', year, quarter: +v })}>
        {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
      </Select>
    </div>
  )
}

function YearSelector({ period, onChange }) {
  const years = availableYears()
  return (
    <Select value={period?.year ?? years[0]} onChange={v => onChange({ type: 'year', year: +v })}>
      {years.map(y => <option key={y} value={y}>{y}</option>)}
    </Select>
  )
}

export default function PeriodSelector({ view, period, onChange, label = 'Period' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 uppercase tracking-wider w-16">{label}</span>
      {view === 'daily' && <DaySelector period={period} onChange={onChange} />}
      {view === 'monthly' && <MonthSelector period={period} onChange={onChange} />}
      {view === 'quarterly' && <QuarterSelector period={period} onChange={onChange} />}
      {view === 'yearly' && <YearSelector period={period} onChange={onChange} />}
    </div>
  )
}
