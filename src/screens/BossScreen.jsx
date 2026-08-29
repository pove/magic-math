import { useState, useRef, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { JOKES } from '../data/jokes'
import DirectorMago from '../components/DirectorMago'
import SceneBackground from '../components/SceneBackground'
import Character from '../components/PixiCharacter'
import useViewport from '../hooks/useViewport'
import useCastleViewMode from '../hooks/useCastleViewMode'
import { hasRoomScene3D } from '../engine/roomScenes3d'
import { sfx } from '../engine/sfx'

// three.js + fiber/drei are only paid for by profiles that picked a 3D character.
const CharacterStage3D = lazy(() => import('../components/character3d/CharacterStage3D'))
// Same 3D room background used in RoomScreen, for visual consistency right
// before walking into the boss battle in that same room.
const RoomScene3D = lazy(() => import('../components/RoomScene3D'))

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
  const { mode: castleViewMode } = useCastleViewMode()
  const directorSize = isShort ? 110 : isCompact ? 140 : 170
  const characterSize = isShort ? 86 : isCompact ? 96 : 110
  // Mirrors the castle's own 2D/3D toggle — switching the castle back to 2D
  // should show the 2D sprite here too, even if a 3D character is saved.
  const is3D = castleViewMode === '3d'
  // A 3D scene (camera margin, floor, perspective falloff) reads much smaller
  // than a flat 2D sprite at the same pixel box — needs a noticeably bigger
  // box to be legible at all.
  const character3dSize = isShort ? 120 : isCompact ? 150 : 190

  const practiceState = location.state?.practiceFloor
    ? { practiceFloor: location.state.practiceFloor, practiceRoom: location.state.practiceRoom, practiceLives: location.state.practiceLives }
    : undefined
  const displayFloor = practiceState?.practiceFloor || activeProfile?.currentFloor
  // Falls back to the 2D procedural scene for any floor that doesn't have a
  // 3D room yet (see src/engine/roomScenes3d.js for the current rollout).
  const use3DRoom = is3D && hasRoomScene3D(displayFloor)
  const SceneComponent = use3DRoom ? RoomScene3D : SceneBackground

  if (!activeProfile) return null

  return (
    <div className="h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="fixed inset-0 bg-[#1a0533]" />}>
      <SceneComponent floor={displayFloor} introLevel="none">
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 gap-4 sm:gap-6 overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => { sfx.click(); navigate('/castle') }}
            className="absolute top-4 left-4 text-white/50 hover:text-white/90 text-xl transition-colors"
            title="Volver al castillo"
          >🏰</button>
          <div className="shrink-0 flex items-end justify-center gap-2 sm:gap-4">
            <motion.div
              // rotate/scale get baked into the 3D canvas's pixel size (r3f
              // measures via getBoundingClientRect, which reflects the
              // transform mid-animation) — skip them for the 3D case.
              initial={is3D ? { x: 120, opacity: 0 } : { x: 120, opacity: 0, rotate: 8 }}
              animate={is3D ? { x: 0, opacity: 1 } : { x: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, delay: 0.15 }}
            >
              {is3D ? (
                <Suspense fallback={<div style={{ width: character3dSize, height: character3dSize }} />}>
                  <CharacterStage3D profile={activeProfile} size={character3dSize} />
                </Suspense>
              ) : (
                <Character
                  gender={activeProfile.gender}
                  equippedSkins={activeProfile.equippedSkins}
                  animationState="idle"
                  size={characterSize}
                />
              )}
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
      </SceneComponent>
      </Suspense>
    </div>
  )
}
