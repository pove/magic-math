const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🍑']
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function FruitRow({ count, fruit }) {
  if (count <= 0) return null
  return (
    <div className="flex flex-wrap gap-1 justify-center max-w-xs">
      {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
        <span key={i} className="text-2xl select-none">{fruit}</span>
      ))}
    </div>
  )
}

export default function VisualAid({ type, count, a, b }) {
  if (!type) return null

  if (type === 'fruits') {
    // Two-row mode for addition: show each addend in its own row with different fruits
    if (a !== undefined && b !== undefined) {
      const fruit = FRUITS[(a + b) % FRUITS.length]
      return (
        <div className="flex flex-col gap-2 short:gap-0.5 items-center">
          {a > 0 && <FruitRow count={a} fruit={fruit} />}
          {a > 0 && b > 0 && <div className="text-white/50 text-lg short:text-sm font-bold leading-none">+</div>}
          {b > 0 && <FruitRow count={b} fruit={fruit} />}
        </div>
      )
    }
    // Single-row mode (subtraction etc.)
    if (!count || count <= 0) return null
    const fruit = FRUITS[count % FRUITS.length]
    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
          <span key={i} className="text-2xl short:text-base select-none">{fruit}</span>
        ))}
      </div>
    )
  }

  if (type === 'blocks') {
    if (!count || count <= 0) return null
    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-xs">
        {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
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
