import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { getLevelData } from '../data/levels'
import { getFloorStatus } from '../engine/floorConfig'
import { DEFAULT_LIVES } from '../engine/gameConfig'
import HeartsBar from '../components/HeartsBar'
import Character from '../components/PixiCharacter'
import ViewModeToggle from '../components/ViewModeToggle'
import ModeToggle from '../components/ModeToggle'

function FloorTile({ level, status, onClick }) {
  const data = getLevelData(level)
  const isActive = status === 'active'
  const isDone = status === 'done'
  const isLocked = status === 'locked'

  return (
    <motion.button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
        isActive ? 'border-amber-400 bg-amber-400/20 cursor-pointer' :
        isDone ? 'border-emerald-400/50 bg-emerald-400/10 cursor-pointer' :
        'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
      }`}
      animate={isActive ? { boxShadow: ['0 0 0px #f59e0b', '0 0 20px #f59e0b', '0 0 0px #f59e0b'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <span className="text-2xl w-8 text-center">
        {isDone ? '⭐' : isActive ? '🪄' : '🔒'}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`font-title text-sm ${isActive ? 'text-amber-400' : isDone ? 'text-emerald-400' : 'text-white/40'}`}>
          Planta {level}
        </div>
        <div className={`font-body text-xs truncate ${isActive ? 'text-white' : isDone ? 'text-white/70' : 'text-white/30'}`}>
          {data.name}{isDone ? ' · 🔁 Repasar' : ''}
        </div>
      </div>
    </motion.button>
  )
}

export default function CastleScreen2D({ viewMode }) {
  const { activeProfile } = useGame()
  const navigate = useNavigate()

  if (!activeProfile) return null

  return (
    <div className="h-dvh bg-gradient-to-b from-[#0f0c29] via-[#1a1040] to-[#0f0c29] flex flex-col overflow-hidden">
      {/* Header — wraps onto a second row rather than squashing on phones */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Character gender={activeProfile.gender} equippedSkins={activeProfile.equippedSkins} animationState="idle" size={50} />
          <div className="min-w-0">
            <div className="font-title text-white text-base sm:text-lg truncate">{activeProfile.name}</div>
            <div className="font-body text-white/60 text-xs sm:text-sm">
              {activeProfile.ageMode === 'young' ? '⭐ Sumas y Restas' : '✦ Multiplicación'}
              {activeProfile.currentMode !== 'normal' && <span className="text-pink-400 ml-2">· Modo {activeProfile.currentMode.toUpperCase()}</span>}
            </div>
          </div>
        </div>
        <HeartsBar lives={activeProfile.lives} />
        <div className="flex items-center gap-2">
          <ModeToggle />
          {viewMode.supports3D && <ViewModeToggle viewMode={viewMode} />}
          <motion.button
            onClick={() => navigate('/profiles')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-title px-3 sm:px-4 py-2 rounded-full text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Jugadores"
          >
            👤<span className="hidden lg:inline"> JUGADORES</span>
          </motion.button>
          <motion.button
            onClick={() => navigate('/wardrobe')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-title px-3 sm:px-4 py-2 rounded-full text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Armario"
          >
            👗<span className="hidden lg:inline"> ARMARIO</span>
          </motion.button>
        </div>
      </div>

      {/* Castle visual + floor list */}
      <div className="flex-1 flex overflow-hidden">
        {/* Castle illustration placeholder */}
        <div className="hidden md:flex flex-col items-center justify-center w-56 p-4 border-r border-white/10">
          <div className="text-8xl mb-4">🏰</div>
          <div className="font-title text-amber-400 text-center text-sm">Planta {activeProfile.currentFloor} de 12</div>
          <div className="mt-2 w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all"
              style={{ width: `${((activeProfile.currentFloor - 1) / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Floor list - ascending 1 to 12 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((floor) => {
              const status = getFloorStatus(floor, activeProfile.currentFloor)
              return (
                <FloorTile
                  key={floor}
                  level={floor}
                  status={status}
                  onClick={() => {
                    if (status === 'done') {
                      navigate('/room', { state: { practiceFloor: floor, practiceRoom: 1, practiceLives: DEFAULT_LIVES } })
                    } else {
                      navigate('/room')
                    }
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Play button */}
      <div className="p-3 sm:p-4 border-t border-white/10 flex justify-center">
        <motion.button
          onClick={() => navigate('/room')}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-lg sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-full shadow-lg shadow-purple-500/40 whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 0 10px rgba(124,58,237,0.4)', '0 0 25px rgba(124,58,237,0.7)', '0 0 10px rgba(124,58,237,0.4)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🪄 JUGAR — Planta {activeProfile.currentFloor}
        </motion.button>
      </div>
    </div>
  )
}
