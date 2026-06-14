import { motion, AnimatePresence } from 'framer-motion'
import { getSkinById } from '../data/skins'

export default function RewardModal({ skinId, onClose, isOutfit = false }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-amber-400 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
          initial={{ scale: 0.3, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <motion.div
            className="text-8xl mb-4"
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {skin.emoji}
          </motion.div>

          <div className="font-title text-amber-400 text-2xl mb-2">
            {isOutfit ? '¡NUEVO CONJUNTO!' : '¡NUEVO COMPLEMENTO!'}
          </div>

          <div className="font-title text-white text-3xl mb-1">{skin.name}</div>

          <div className="text-white/60 font-body text-sm mb-6">
            {isOutfit ? 'Se ha añadido a tu armario' : 'Ya puedes usarlo'}
          </div>

          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: 3 }}
          >
            {['✨', '⭐', '✦', '🌟', '✨', '⭐', '✦', '🌟'].map((star, i) => (
              <span
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${10 + i * 11}%`,
                  top: `${5 + (i % 3) * 30}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {star}
              </span>
            ))}
          </motion.div>

          <motion.button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-xl px-10 py-3 rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ¡GENIAL!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
