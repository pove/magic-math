import { motion } from 'framer-motion'

/** Pill switch to force the castle into 2D or 3D mode, regardless of device support. */
export default function ViewModeToggle({ viewMode, className = '' }) {
  const { mode, setPreference } = viewMode

  return (
    <div className={`flex items-center bg-black/40 border border-white/20 rounded-full p-1 backdrop-blur ${className}`}>
      {['2d', '3d'].map((value) => (
        <motion.button
          key={value}
          onClick={() => setPreference(value)}
          whileTap={{ scale: 0.92 }}
          className={`px-3 py-1.5 rounded-full font-title text-xs transition-colors ${
            mode === value ? 'bg-amber-400 text-[#1a0533]' : 'text-white/60 hover:text-white'
          }`}
        >
          {value === '2d' ? '📜 2D' : '🧊 3D'}
        </motion.button>
      ))}
    </div>
  )
}
