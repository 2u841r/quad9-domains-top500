import { useState, useCallback } from 'react'
import { getDatesInRange, getPeriodRange } from '../utils/dates'
import { aggregateDays } from '../utils/aggregate'

const BASE = import.meta.env.BASE_URL + 'data/'
const DOMAINS_PER_DAY = 500

// Dict — loaded once
let dictPromise = null
let dict = null

function loadDict() {
  if (!dictPromise) {
    dictPromise = fetch(BASE + 'dict.txt')
      .then(r => r.text())
      .then(t => { dict = t.split('\n'); return dict })
  }
  return dictPromise
}

// all.bin + manifest — loaded once on first aggregate view
let allBinPromise = null
let allBuf = null      // Uint16Array
let allManifest = null // string[]

function loadAllBin() {
  if (!allBinPromise) {
    allBinPromise = Promise.all([
      loadDict(),
      fetch(BASE + 'manifest.json').then(r => r.json()),
      fetch(BASE + 'all.bin').then(r => r.arrayBuffer()).then(b => new Uint16Array(b)),
    ]).then(([, dates, buf]) => {
      allManifest = dates
      allBuf = buf
    })
  }
  return allBinPromise
}

function sliceDay(date) {
  const idx = allManifest.indexOf(date)
  if (idx === -1) return null
  const offset = idx * DOMAINS_PER_DAY
  return Array.from(
    allBuf.subarray(offset, offset + DOMAINS_PER_DAY),
    (id, i) => ({ position: i + 1, domain_name: dict[id] })
  )
}

// Per-day cache for daily view
const dayCache = new Map()

async function fetchDay(date) {
  if (dayCache.has(date)) return dayCache.get(date)
  await loadDict()
  try {
    const res = await fetch(BASE + `${date}.bin`)
    if (!res.ok) return null
    const ids = new Uint16Array(await res.arrayBuffer())
    const entries = Array.from(ids, (id, i) => ({ position: i + 1, domain_name: dict[id] }))
    dayCache.set(date, entries)
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

    // Aggregate view — load all.bin once then slice in memory
    setLoading(true)
    setProgress(50)
    try {
      await loadAllBin()
      setProgress(100)
      const dates = getDatesInRange(start, end)
      const dayResults = dates.map(sliceDay).filter(Boolean)
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
