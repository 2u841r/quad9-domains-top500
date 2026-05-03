import { useState } from 'react'

const PAGE_SIZE = 50

function DeltaBadge({ delta }) {
  if (delta === null) {
    return <span className="text-xs text-gray-600 font-mono">new</span>
  }
  if (delta === 0) {
    return <span className="text-xs text-gray-500 font-mono">-</span>
  }
  const up = delta > 0
  return (
    <span className={`text-xs font-mono font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'}{Math.abs(delta)}
    </span>
  )
}

function ExtraInfo({ entry }) {
  if (entry.avgPosition == null) return null
  return (
    <span className="text-xs text-gray-600">
      avg {entry.avgPosition.toFixed(1)} · {entry.daysAppeared}d · best {entry.bestPosition}
    </span>
  )
}

export default function DomainTable({ entries, hasCompare, loading, label }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const filtered = search
    ? entries?.filter(e => e.domain_name.includes(search.toLowerCase()))
    : entries

  const total = filtered?.length ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)
  const slice = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? []

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
        Loading...
      </div>
    )
  }

  if (!entries) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-600">
        {label ? `Select a period to load data` : 'Select a period'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter domains..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-purple-500 w-60"
        />
        <span className="text-xs text-gray-600">{total} domains</span>
      </div>

      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
              <th className="px-4 py-2 w-12">#</th>
              <th className="px-4 py-2">Domain</th>
              {entries[0]?.avgPosition != null && (
                <>
                  <th className="px-4 py-2 text-right">Avg rank</th>
                  <th className="px-4 py-2 text-right">Days</th>
                  <th className="px-4 py-2 text-right">Best</th>
                </>
              )}
              {hasCompare && (
                <>
                  <th className="px-4 py-2 text-right">Compare #</th>
                  <th className="px-4 py-2 text-right">Change</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900">
            {slice.map(entry => (
              <tr key={entry.domain_name} className="hover:bg-gray-900/50 transition-colors">
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{entry.position}</td>
                <td className="px-4 py-2 text-gray-200 font-mono">{entry.domain_name}</td>
                {entry.avgPosition != null && (
                  <>
                    <td className="px-4 py-2 text-right text-gray-400 font-mono text-xs">
                      {entry.avgPosition.toFixed(1)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500 text-xs">
                      {entry.daysAppeared}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500 text-xs">
                      {entry.bestPosition}
                    </td>
                  </>
                )}
                {hasCompare && (
                  <>
                    <td className="px-4 py-2 text-right text-gray-500 font-mono text-xs">
                      {entry.comparePosition ?? <span className="text-gray-700">n/a</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <DeltaBadge delta={entry.delta} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span>Page {page + 1} / {pageCount}</span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
