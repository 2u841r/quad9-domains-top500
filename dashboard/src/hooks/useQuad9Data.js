import { useState, useCallback } from 'react'
import { getDatesInRange, getPeriodRange } from '../utils/dates'
import { aggregateDays } from '../utils/aggregate'

const BASE_URL = 'https://raw.githubusercontent.com/2u841r/quad9-domains-top500/main'
const cache = new Map()

async function fetchDay(date) {
  if (cache.has(date)) return cache.get(date)
  try {
    const res = await fetch(`${BASE_URL}/top500-${date}.json`)
    if (!res.ok) return null
    const text = await res.text()
    const entries = text.trim().split('\n').flatMap(line => {
      try { return [JSON.parse(line)] } catch { return [] }
    })
    cache.set(date, entries)
    return entries
  } catch {
    return null
  }
}

export function useQuad9Data() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const fetchPeriod = useCallback(async (period) => {
    const { start, end } = getPeriodRange(period)
    setError(null)

    if (period.type === 'day') {
      setLoading(true)
      setProgress(0)
      try {
        const data = await fetchDay(start)
        if (!data) throw new Error(`No data for ${start}`)
        setProgress(100)
        return data
      } catch (e) {
        setError(e.message)
        return null
      } finally {
        setLoading(false)
      }
    }

    const dates = getDatesInRange(start, end)
    setLoading(true)
    setProgress(0)

    try {
      const dayResults = []
      const BATCH = 8
      for (let i = 0; i < dates.length; i += BATCH) {
        const batch = dates.slice(i, i + BATCH)
        const results = await Promise.all(batch.map(fetchDay))
        for (const r of results) {
          if (r) dayResults.push(r)
        }
        setProgress(Math.round(((i + batch.length) / dates.length) * 100))
      }
      if (dayResults.length === 0) throw new Error('No data found for this period')
      return aggregateDays(dayResults)
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchPeriod, loading, progress, error }
}
