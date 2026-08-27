import { motion } from 'framer-motion'

export default function QuestionCard({ questionText, ageMode }) {
  const isYoung = ageMode === 'young'
  return (
    <motion.div
      className="relative bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md rounded-3xl border-2 border-amber-400/40 shadow-xl shadow-purple-900/50 px-4 py-4 sm:px-8 sm:py-6 short:py-1 short:px-4 text-center"
      initial={{ scale: 0.85, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      {/* Smaller, tighter offset on narrow screens — the card sits close enough
          to the edge there that the old -top-3/-left-2 spilled past the
          viewport and got clipped by the page's overflow-hidden. */}
      <span className="absolute top-0 left-0 sm:-top-3 sm:-left-2 text-xl sm:text-2xl select-none" style={{ animation: 'floatEmoji 3s ease-in-out infinite' }}>✨</span>
      <span className="absolute bottom-0 right-0 sm:-bottom-2 sm:-right-2 text-xl sm:text-2xl select-none" style={{ animation: 'floatEmoji 3.6s ease-in-out infinite reverse' }}>⭐</span>
      <div
        className={`font-title text-white break-words ${isYoung ? 'text-3xl sm:text-4xl short:text-2xl uppercase' : 'text-2xl sm:text-3xl short:text-xl'}`}
        style={{ textShadow: '0 3px 10px rgba(0,0,0,0.6), 0 0 24px rgba(251,191,36,0.35)' }}
      >
        {isYoung ? questionText.toUpperCase() : questionText}
      </div>
    </motion.div>
  )
}
