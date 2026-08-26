import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { LEVELS } from '../data/levels'
import { getFloorStatus } from '../engine/floorConfig'
import Tower, { FLOOR_HEIGHT, FLOOR_GAP } from '../components/castle3d/Tower'
import SkyDome from '../components/castle3d/SkyDome'
import MagicParticles from '../components/castle3d/MagicParticles'
import Ground from '../components/castle3d/Ground'
import useCameraFly from '../components/castle3d/useCameraFly'
import ViewModeToggle from '../components/ViewModeToggle'

function Scene({ floorStates, currentFloor, onSelectFloor, focusY }) {
  const controlsRef = useRef()
  const { camera } = useThree()

  // Cinematic intro: start far/high, then glide to the active floor
  useEffect(() => {
    camera.position.set(45, 40, 60)
  }, [camera])

  useCameraFly({ targetY: focusY, controlsRef })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[20, 60, 30]} intensity={1.8} color="#e9d5ff" />
      <directionalLight position={[-30, 20, -20]} intensity={0.9} color="#93c5fd" />
      <hemisphereLight args={['#8b7fd4', '#2a2350', 1.3]} />

      <SkyDome />
      <Ground />
      <MagicParticles />
      <Tower levels={LEVELS} floorStates={floorStates} currentFloor={currentFloor} onSelect={onSelectFloor} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={14}
        maxDistance={80}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.52}
      />
    </>
  )
}

export default function CastleScreen3D({ viewMode }) {
  const { activeProfile } = useGame()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  if (!activeProfile) return null

  const currentFloor = activeProfile.currentFloor

  // Start focused on the current floor so the intro flies there
  const initialY = useMemo(() => {
    const idx = Math.max(0, LEVELS.findIndex((l) => l.floor === currentFloor))
    return idx * (FLOOR_HEIGHT + FLOOR_GAP)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [focusY, setFocusY] = useState(initialY)

  const floorStates = useMemo(() => {
    const states = {}
    LEVELS.forEach((l) => {
      states[l.floor] = getFloorStatus(l.floor, currentFloor)
    })
    return states
  }, [currentFloor])

  const handleSelect = (floor) => {
    setSelected(floor)
    const idx = LEVELS.findIndex((l) => l.floor === floor)
    if (idx >= 0) setFocusY(idx * (FLOOR_HEIGHT + FLOOR_GAP))
  }

  const enterFloor = (floor) => {
    if (floor === currentFloor) {
      navigate('/room')
    } else {
      navigate('/room', { state: { practiceFloor: floor, practiceRoom: 1, practiceLives: 3 } })
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0b0620] overflow-hidden select-none">
      <Canvas camera={{ fov: 55, position: [0, 4, 26] }} dpr={[1, 2]} gl={{ toneMappingExposure: 1.35 }}>
        <Scene
          floorStates={floorStates}
          currentFloor={currentFloor}
          onSelectFloor={handleSelect}
          focusY={focusY}
        />
      </Canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <ViewModeToggle viewMode={viewMode} />
        <div className="bg-black/50 text-amber-300 font-title px-4 py-2 rounded-xl border border-white/10 backdrop-blur text-sm">
          🧙 {activeProfile.name} · Planta {currentFloor}/12
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.button
          onClick={() => navigate('/profiles')}
          className="bg-black/50 hover:bg-black/70 text-white font-title px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition text-sm"
        >
          👤
        </motion.button>
        <motion.button
          onClick={() => navigate('/wardrobe')}
          className="bg-black/50 hover:bg-black/70 text-white font-title px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition text-sm"
        >
          👗
        </motion.button>
      </div>

      <div className="absolute top-16 right-4 bg-black/40 text-white/70 font-body text-xs px-3 py-2 rounded-lg backdrop-blur hidden md:block">
        Arrastra para girar · Rueda/dedo para zoom · Toca una planta
      </div>

      {/* Up / down floor navigation */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSelect(Math.min(12, (selected ?? currentFloor) + 1))}
          disabled={(selected ?? currentFloor) >= 12}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 text-white text-2xl font-title shadow-lg shadow-purple-900/50 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur"
          title="Subir de planta"
        >
          ▲
        </motion.button>
        <div className="text-center font-title text-amber-300 text-sm bg-black/40 rounded-lg py-1 px-2 backdrop-blur">
          {(selected ?? currentFloor)}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSelect(Math.max(1, (selected ?? currentFloor) - 1))}
          disabled={(selected ?? currentFloor) <= 1}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 text-white text-2xl font-title shadow-lg shadow-purple-900/50 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur"
          title="Bajar de planta"
        >
          ▼
        </motion.button>
      </div>

      {/* Selected floor modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto bg-gradient-to-b from-[#2d1b69]/95 to-[#0f0c29]/95 border border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-900/50 backdrop-blur max-w-md w-full mx-4 text-center">
              <div className="text-5xl mb-2 pointer-events-none">{LEVELS[selected - 1].decorations[0]}</div>
              <h2 className="font-title text-amber-300 text-xl mb-1">
                Planta {selected} — {LEVELS[selected - 1].name}
              </h2>
              <p className="font-body text-white/60 text-sm mb-4">
                {selected === currentFloor
                  ? '¡Supera las habitaciones y el examen del Director Mago!'
                  : selected < currentFloor
                    ? 'Planta completada. ¡Repítela para practicar sin riesgo!'
                    : '🔒 Supera las plantas anteriores para desbloquearla'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSelected(null)}
                  className="px-5 py-2 rounded-xl font-title bg-white/10 text-white/80 hover:bg-white/20 transition"
                >
                  Cerrar
                </button>
                {selected <= currentFloor && (
                  <button
                    onClick={() => enterFloor(selected)}
                    className={`px-5 py-2 rounded-xl font-title text-[#1a0533] shadow-lg transition ${
                      selected === currentFloor
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 shadow-amber-500/30'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-emerald-500/30'
                    }`}
                  >
                    {selected === currentFloor ? '🪄 Entrar' : '🔁 Practicar'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
