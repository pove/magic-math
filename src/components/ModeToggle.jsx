import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'

const MODE_LABELS = {
  normal: '⭐ Normal',
  pro: '🔥 Pro',
  'super-pro': '💎 Súper Pro',
  'super-chachi': '👑 Súper Chachi',
}

/** Pill switch to jump between already-unlocked difficulty modes without
 * losing progress — each mode keeps its own floor/room/lives snapshot. */
export default function ModeToggle({ className = '' }) {
  const { activeProfile, switchMode } = useGame()

  if (!activeProfile || activeProfile.unlockedModes.length < 2) return null

  return (
    <div className={`flex items-center bg-black/40 border border-white/20 rounded-full p-1 backdrop-blur ${className}`}>
      {activeProfile.unlockedModes.map((mode) => (
        <motion.button
          key={mode}
          onClick={() => switchMode(activeProfile.id, mode)}
          whileTap={{ scale: 0.92 }}
          className={`px-3 py-1.5 rounded-full font-title text-xs whitespace-nowrap transition-colors ${
            activeProfile.currentMode === mode ? 'bg-pink-400 text-[#1a0533]' : 'text-white/60 hover:text-white'
          }`}
        >
          {MODE_LABELS[mode] || mode}
        </motion.button>
      ))}
    </div>
  )
}
