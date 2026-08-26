import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { JOKES } from '../data/jokes'
import DirectorMago from '../components/DirectorMago'
import SceneBackground from '../components/SceneBackground'
import Character from '../components/PixiCharacter'
import useViewport from '../hooks/useViewport'
import { sfx } from '../engine/sfx'

const usedJokesSession = new Set()

function getRandomJoke() {
  const available = JOKES.filter((_, i) => !usedJokesSession.has(i))
  if (available.length === 0) { usedJokesSession.clear() }
  const pool = JOKES.filter((_, i) => !usedJokesSession.has(i))
  const idx = Math.floor(Math.random() * pool.length)
  const realIdx = JOKES.indexOf(pool[idx])
  usedJokesSession.add(realIdx)
  return pool[idx]
}

export default function BossScreen() {
  const { activeProfile } = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  const [joke] = useState(getRandomJoke)
  const { isCompact, isShort } = useViewport()
  const directorSize = isShort ? 110 : isCompact ? 140 : 170
  const characterSize = isShort ? 86 : isCompact ? 96 : 110

  const practiceState = location.state?.practiceFloor
    ? { practiceFloor: location.state.practiceFloor, practiceRoom: location.state.practiceRoom, practiceLives: location.state.practiceLives }
    : undefined
  const displayFloor = practiceState?.practiceFloor || activeProfile?.currentFloor

  if (!activeProfile) return null

  return (
    <div className="h-dvh w-full overflow-hidden">
      <SceneBackground floor={displayFloor} introLevel="none">
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 gap-4 sm:gap-6 overflow-y-auto">
          <button
            onClick={() => { sfx.click(); navigate('/castle') }}
            className="absolute top-4 left-4 text-white/50 hover:text-white/90 text-xl transition-colors"
            title="Volver al castillo"
          >🏰</button>
          <div className="shrink-0 flex items-end justify-center gap-2 sm:gap-4">
            <motion.div
              initial={{ x: 120, opacity: 0, rotate: 8 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, delay: 0.15 }}
            >
              <Character
                gender={activeProfile.gender}
                equippedSkins={activeProfile.equippedSkins}
                animationState="idle"
                size={characterSize}
              />
            </motion.div>
            <motion.div
              initial={{ x: -300, opacity: 0, rotate: -10 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14 }}
              onAnimationComplete={() => sfx.magic()}
            >
              <DirectorMago animationState="idle" size={directorSize} talking />
            </motion.div>
          </div>

          <motion.div
            className="max-w-lg w-full bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md rounded-3xl border-2 border-amber-400/40 shadow-xl shadow-purple-900/50 p-4 sm:p-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <div className="font-title text-amber-400 text-lg sm:text-xl mb-3" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              ¡Bien hecho, pequeño mago! Antes del examen...
            </div>
            <div className="font-body text-white/80 text-sm sm:text-base italic mb-1">
              ¿A que no sabes este chiste?
            </div>
            <div className="font-title text-white text-base sm:text-lg leading-snug mt-3">
              {joke}
            </div>
          </motion.div>

          <motion.button
            onClick={() => { sfx.whoosh(); navigate('/room', practiceState ? { state: practiceState } : undefined) }}
            className="shrink-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white font-title text-lg sm:text-2xl px-6 sm:px-10 py-3 sm:py-4 rounded-full shadow-xl shadow-purple-900/60 border-2 border-white/30"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1, scale: [1, 1.04, 1] }}
            transition={{ delay: 0.8, scale: { duration: 1.4, repeat: Infinity } }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            ¡JA, JA! ¡EMPEZAR EXAMEN! 📝
          </motion.button>
        </div>
      </SceneBackground>
    </div>
  )
}
