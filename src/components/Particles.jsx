import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const EMOJI = {
  correct: ['✨', '⭐', '💫', '🌟', '🎉'],
  wrong: ['💥', '🌀'],
  magic: ['🪄', '✨', '🔮'],
}

/**
 * Fullscreen particle burst overlay. Render when `trigger` changes.
 * type: 'correct' | 'wrong' | 'magic'
 */
export default function Particles({ trigger, type = 'correct', count = 18 }) {
  const [burstId, setBurstId] = useState(0)

  useEffect(() => {
    if (trigger) setBurstId((b) => b + 1)
  }, [trigger])

  const particles = useMemo(() => {
    if (!burstId) return []
    const emojis = EMOJI[type] || EMOJI.correct
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const dist = 120 + Math.random() * 220
      return {
        id: `${burstId}-${i}`,
        emoji: emojis[i % emojis.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 80,
        size: 22 + Math.random() * 26,
        delay: Math.random() * 0.15,
        dur: 0.9 + Math.random() * 0.7,
        rot: (Math.random() - 0.5) * 360,
      }
    })
  }, [burstId, type, count])

  if (!particles.length) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy + 150, scale: [0.3, 1.3, 0.8], opacity: [1, 1, 0], rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          style={{ position: 'absolute', fontSize: p.size, userSelect: 'none' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
