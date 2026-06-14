import { motion } from 'framer-motion'

export default function QuestionCard({ questionText, ageMode }) {
  const isYoung = ageMode === 'young'
  return (
    <motion.div
      className="bg-white/10 backdrop-blur rounded-3xl border border-white/20 shadow-lg shadow-purple-500/30 px-8 py-6 text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`font-title text-white ${isYoung ? 'text-4xl uppercase' : 'text-3xl'}`}
        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
      >
        {isYoung ? questionText.toUpperCase() : questionText}
      </div>
    </motion.div>
  )
}
