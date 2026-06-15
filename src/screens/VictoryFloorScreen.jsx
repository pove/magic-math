import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGame } from '../context/GameContext'
import { getLevelData } from '../data/levels'
import { SKINS } from '../data/skins'
import DirectorMago from '../components/DirectorMago'

export default function VictoryFloorScreen() {
  const { activeProfile } = useGame()
  const navigate = useNavigate()
  const { state } = useLocation()
  const fired = useRef(false)

  const floor = activeProfile?.currentFloor || 1
  const prevFloor = floor > 1 ? floor - 1 : floor
  const newSkinIds = state?.newSkinIds || []
  const outfitItems = SKINS.filter((s) => newSkinIds.includes(s.id))
  const levelData = getLevelData(prevFloor)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }), 300)
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }), 600)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
        <DirectorMago animationState="applaud" size={160} />
      </motion.div>

      <motion.div
        className="mt-4"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="font-title text-amber-400 text-4xl mb-1">
          ¡PLANTA {prevFloor} SUPERADA!
        </div>
        <div className="font-title text-white text-2xl mb-1">{levelData.name}</div>
        {outfitItems.length > 0 && (
          <div className="font-body text-white/60 text-lg mb-6">
            Nuevo conjunto desbloqueado en tu armario
          </div>
        )}
      </motion.div>

      {outfitItems.length > 0 && (
        <motion.div
          className="flex gap-4 justify-center mb-8 flex-wrap"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          {outfitItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center gap-1 bg-white/10 rounded-2xl p-4 border border-amber-400/50">
              <span className="text-4xl">{item.emoji}</span>
              <span className="font-body text-white text-sm">{item.name}</span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.button
        onClick={() => navigate('/wardrobe')}
        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-2xl px-10 py-4 rounded-full shadow-lg"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        VER MI ARMARIO 👗
      </motion.button>

      <motion.button
        onClick={() => navigate('/castle')}
        className="mt-3 text-white/60 font-body underline"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      >
        Continuar al castillo
      </motion.button>
    </div>
  )
}
