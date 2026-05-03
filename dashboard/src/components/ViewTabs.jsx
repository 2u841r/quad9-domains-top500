const VIEWS = ['daily', 'monthly', 'quarterly', 'yearly']

export default function ViewTabs({ view, onChange }) {
  return (
    <div className="flex border-b border-gray-800">
      {VIEWS.map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
            view === v
              ? 'text-purple-400 border-b-2 border-purple-400 -mb-px'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
