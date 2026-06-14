import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { JOKES } from '../data/jokes'
import DirectorMago from '../components/DirectorMago'
import FloorBackground from '../components/FloorBackground'

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
  const [joke] = useState(getRandomJoke)

  if (!activeProfile) return null

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FloorBackground floor={activeProfile.currentFloor}>
        <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
          <button
            onClick={() => navigate('/castle')}
            className="absolute top-4 left-4 text-white/50 hover:text-white/90 text-xl transition-colors"
            title="Volver al castillo"
          >🏰</button>
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
          >
            <DirectorMago animationState="idle" size={160} />
          </motion.div>

          <motion.div
            className="max-w-lg w-full bg-white/10 backdrop-blur rounded-3xl border border-white/20 p-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="font-title text-amber-400 text-xl mb-3">
              ¡Bien hecho, pequeño mago! Antes del examen...
            </div>
            <div className="font-body text-white/80 text-base italic mb-1">
              ¿A que no sabes este chiste?
            </div>
            <div className="font-title text-white text-lg leading-snug mt-3">
              {joke}
            </div>
          </motion.div>

          <motion.button
            onClick={() => navigate('/room')}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-2xl px-10 py-4 rounded-full shadow-lg"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ¡JA, JA! ¡EMPEZAR EXAMEN! 📝
          </motion.button>
        </div>
      </FloorBackground>
    </div>
  )
}
