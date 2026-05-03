export default function ProgressBar({ loading, progress }) {
  if (!loading) return null
  return (
    <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-purple-500 transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
