import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function TimerBar({ timeLimit = 30, onTimeUp, active = true }) {
  const [remaining, setRemaining] = useState(timeLimit)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(timeLimit)
  }, [timeLimit])

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active, onTimeUp])

  const pct = (remaining / timeLimit) * 100
  const color = pct > 50 ? '#10b981' : pct > 25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="w-full flex items-center gap-3">
      <span className="text-2xl">⏱️</span>
      <div className="flex-1 h-4 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="font-title text-xl text-white w-8 text-right">{remaining}</span>
    </div>
  )
}
