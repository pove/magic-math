import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import DirectorMago from '../components/DirectorMago'
import Character from '../components/PixiCharacter'
import FloorBackground from '../components/FloorBackground'

const ENCOURAGING = [
  '¡Los grandes magos aprenden de sus errores! ¡Tú puedes!',
  '¡Cada intento te hace más sabio! ¡Vuelve a intentarlo!',
  '¡No te preocupes, los mejores magos también fallan a veces!',
  '¡La persistencia es la magia más poderosa que existe!',
  '¡Respira hondo, concéntrate y esta vez lo conseguirás!',
]

export default function DefeatScreen() {
  const { activeProfile, resetFloor } = useGame()
  const navigate = useNavigate()
  const [msg] = useState(() => ENCOURAGING[Math.floor(Math.random() * ENCOURAGING.length)])

  const handleRetry = () => {
    resetFloor(activeProfile.id)
    navigate('/room')
  }

  if (!activeProfile) return null

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FloorBackground floor={activeProfile.currentFloor}>
        <div className="h-full flex flex-col items-center justify-center p-6 gap-6 text-center">
          <div className="flex gap-6 items-end">
            <DirectorMago animationState="sad" size={130} />
            <Character
              gender={activeProfile.gender}
              equippedSkins={activeProfile.equippedSkins}
              animationState="wrongAnswer"
              size={130}
            />
          </div>

          <motion.div
            className="max-w-md"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          >
            <div className="font-title text-red-400 text-3xl mb-2">
              ¡Has perdido todas las vidas!
            </div>
            <div className="font-body text-white/70 text-lg mb-4">
              Planta {activeProfile.currentFloor} — vuelve al principio de la planta
            </div>
            <div className="font-title text-amber-400 text-xl">
              {msg}
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={handleRetry}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-2xl px-10 py-4 rounded-full shadow-lg"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ¡INTENTARLO DE NUEVO! 🪄
            </motion.button>
            <motion.button
              onClick={() => navigate('/castle')}
              className="text-white/50 font-body underline"
            >
              Volver al castillo
            </motion.button>
          </motion.div>
        </div>
      </FloorBackground>
    </div>
  )
}
