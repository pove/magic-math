export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-white/70 font-body text-sm whitespace-nowrap">{current}/{total}</span>
      <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-lg select-none">⭐</span>
    </div>
  )
}
