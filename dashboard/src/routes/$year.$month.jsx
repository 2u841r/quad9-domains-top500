import { createFileRoute } from '@tanstack/react-router'
import PeriodTableView from '../components/PeriodTableView'

export const Route = createFileRoute('/$year/$month')({
  component: MonthRoute,
})

function MonthRoute() {
  const { year, month } = Route.useParams()
  const period = { type: 'month', year: Number(year), month: Number(month) }
  return <PeriodTableView view="monthly" initialPeriod={period} />
}
