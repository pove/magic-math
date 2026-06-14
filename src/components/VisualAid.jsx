const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🍑']
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function VisualAid({ type, count }) {
  if (!type || !count || count <= 0) return null
  const capped = Math.min(count, 20)

  if (type === 'fruits') {
    const fruit = FRUITS[count % FRUITS.length]
    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: capped }).map((_, i) => (
          <span key={i} className="text-2xl select-none">{fruit}</span>
        ))}
      </div>
    )
  }

  if (type === 'blocks') {
    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: capped }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-md border-2 border-white/30 flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  }

  return null
}
