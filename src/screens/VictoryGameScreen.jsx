import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGame } from '../context/GameContext'
import DirectorMago from '../components/DirectorMago'
import Character from '../components/PixiCharacter'

export default function VictoryGameScreen() {
  const { activeProfile, completeGame, startNewGamePlus } = useGame()
  const navigate = useNavigate()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !activeProfile) return
    fired.current = true
    completeGame(activeProfile.id)
    const duration = 4000
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f59e0b', '#7c3aed', '#ec4899'] })
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f59e0b', '#7c3aed', '#ec4899'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  if (!activeProfile) return null

  const { currentMode, ageMode, unlockedModes } = activeProfile
  const canUnlockPro = currentMode === 'normal'
  const canUnlockSuperPro = currentMode === 'pro' && ageMode === 'older'
  const canUnlockSuperChachi = currentMode === 'super-pro'
  const isMaxMode = currentMode === 'super-chachi' || (currentMode === 'pro' && ageMode === 'young')

  const handleNewGamePlus = (mode) => {
    startNewGamePlus(activeProfile.id, mode)
    navigate('/castle')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#1c1405] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle text-amber-400 pointer-events-none select-none"
          style={{ left: `${(i * 11 + 3) % 95}%`, top: `${(i * 17 + 5) % 90}%`, fontSize: `${0.5 + (i % 4) * 0.4}rem`, animationDelay: `${(i * 0.2) % 2}s` }}
        >✦</div>
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
      >
        <motion.div
          className="text-8xl"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >🪄</motion.div>

        <div className="flex gap-6 items-end">
          <DirectorMago animationState="applaud" size={140} />
          <Character gender={activeProfile.gender} equippedSkins={activeProfile.equippedSkins} animationState="newSkin" size={140} />
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        >
          <div className="font-title text-amber-400 text-4xl mb-2">
            ¡FELICIDADES, MAGO SUPREMO!
          </div>
          <div className="font-title text-white text-3xl mb-4">{activeProfile.name}</div>
          <div className="font-body text-white/70 text-lg max-w-md">
            Has superado todos los exámenes del Director Mago y alcanzado lo más alto de la Torre Mayor.
            La Varita Encantada es ahora tuya. ¡Eres un verdadero mago!
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3 mt-4 w-full max-w-sm"
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
        >
          {canUnlockPro && (
            <motion.button
              onClick={() => handleNewGamePlus('pro')}
              className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-title text-xl px-8 py-4 rounded-full shadow-lg border border-purple-400"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ⚡ NUEVA PARTIDA+ (MODO PRO)
            </motion.button>
          )}
          {canUnlockSuperPro && (
            <motion.button
              onClick={() => handleNewGamePlus('super-pro')}
              className="bg-gradient-to-r from-pink-700 to-red-600 text-white font-title text-xl px-8 py-4 rounded-full shadow-lg border border-pink-400"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              🔥 NUEVA PARTIDA++ (MODO SUPER-PRO)
            </motion.button>
          )}
          {canUnlockSuperChachi && (
            <motion.button
              onClick={() => handleNewGamePlus('super-chachi')}
              className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white font-title text-xl px-8 py-4 rounded-full shadow-lg border border-amber-300"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ⏱️ NUEVA PARTIDA+++ (MODO SUPER-CHACHI)
            </motion.button>
          )}
          {isMaxMode && (
            <div className="font-title text-amber-400 text-xl py-2">
              🏆 ¡Eres el mago definitivo! No hay más retos que conquistar.
            </div>
          )}
          <motion.button
            onClick={() => navigate('/')}
            className="bg-white/20 text-white font-title text-lg px-8 py-3 rounded-full"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            VOLVER AL INICIO
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
