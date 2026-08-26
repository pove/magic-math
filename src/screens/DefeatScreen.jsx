import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import DirectorMago from '../components/DirectorMago'
import Character from '../components/PixiCharacter'
import SceneBackground from '../components/SceneBackground'
import useViewport from '../hooks/useViewport'
import { sfx } from '../engine/sfx'
import { useEffect } from 'react'

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
  const { isCompact, isShort } = useViewport()
  // Two figures side by side, so they have to share the width on a phone
  const characterSize = isShort ? 90 : isCompact ? 105 : 130

  useEffect(() => { sfx.defeat() }, [])

  const handleRetry = () => {
    resetFloor(activeProfile.id)
    navigate('/room')
  }

  if (!activeProfile) return null

  return (
    <div className="h-dvh w-full overflow-hidden">
      <SceneBackground floor={activeProfile.currentFloor}>
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 gap-4 sm:gap-6 text-center overflow-y-auto">
          <div className="flex gap-3 sm:gap-6 items-end shrink-0">
            <DirectorMago animationState="sad" size={characterSize} />
            <Character
              gender={activeProfile.gender}
              equippedSkins={activeProfile.equippedSkins}
              animationState="wrongAnswer"
              size={characterSize}
            />
          </div>

          <motion.div
            className="max-w-md"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          >
            <div className="font-title text-red-400 text-2xl sm:text-3xl mb-2">
              ¡Has perdido todas las vidas!
            </div>
            <div className="font-body text-white/70 text-base sm:text-lg mb-4">
              Planta {activeProfile.currentFloor} — vuelve al principio de la planta
            </div>
            <div className="font-title text-amber-400 text-lg sm:text-xl">
              {msg}
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3"
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={() => { sfx.click(); handleRetry() }}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-lg sm:text-2xl px-6 sm:px-10 py-3 sm:py-4 rounded-full shadow-lg"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ¡INTENTARLO DE NUEVO! 🪄
            </motion.button>
            <motion.button
              onClick={() => { sfx.click(); navigate('/castle') }}
              className="text-white/50 font-body underline"
            >
              Volver al castillo
            </motion.button>
          </motion.div>
        </div>
      </SceneBackground>
    </div>
  )
}
