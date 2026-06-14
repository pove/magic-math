import { motion, AnimatePresence } from 'framer-motion'

export default function HeartsBar({ lives = 3, maxLives = 3 }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: maxLives }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1 }}
          animate={i >= lives ? { scale: [1, 1.3, 0.8, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="text-3xl select-none"
            style={{ filter: i < lives ? 'none' : 'grayscale(1) opacity(0.3)' }}
          >
            ❤️
          </span>
        </motion.div>
      ))}
    </div>
  )
}
