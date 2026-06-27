import { createFileRoute } from '@tanstack/react-router'
import PeriodTableView from '../components/PeriodTableView'

export const Route = createFileRoute('/$year/$month/$day')({
  component: DayRoute,
})

function DayRoute() {
  const { year, month, day } = Route.useParams()
  const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const period = { type: 'day', date }
  return <PeriodTableView view="daily" initialPeriod={period} />
}
