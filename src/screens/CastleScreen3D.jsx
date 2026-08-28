import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { LEVELS } from '../data/levels'
import { getDefaultCharacter3dId } from '../data/characters3d'
import { getFloorStatus } from '../engine/floorConfig'
import Tower, { FLOOR_HEIGHT, FLOOR_GAP } from '../components/castle3d/Tower'
import SkyDome from '../components/castle3d/SkyDome'
import MagicParticles from '../components/castle3d/MagicParticles'
import Ground from '../components/castle3d/Ground'
import useCameraFly from '../components/castle3d/useCameraFly'
import { framingForAspect, WIDE_FRAMING } from '../components/castle3d/framing'
import ViewModeToggle from '../components/ViewModeToggle'
import ModeToggle from '../components/ModeToggle'
import { ErrorBoundary, useCanvasWatchdog } from '../components/CrashOverlay'

function Scene({ floorStates, currentFloor, onSelectFloor, focusY, activeProfile }) {
  const controlsRef = useRef()
  const { camera, size } = useThree()

  const { fov, distance } = framingForAspect(size.width / Math.max(1, size.height))

  // Keep the lens in step with the viewport — this also runs on rotation,
  // and useCameraFly picks up the matching distance change.
  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [camera, fov])

  // Cinematic intro: start far/high, then glide to the active floor. The
  // start point scales with the framing so portrait opens equally wide.
  useEffect(() => {
    const zoom = distance / WIDE_FRAMING.distance
    camera.position.set(45 * zoom, 40 * zoom, 60 * zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  useCameraFly({ targetY: focusY, controlsRef, distance })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[20, 60, 30]} intensity={1.8} color="#e9d5ff" />
      <directionalLight position={[-30, 20, -20]} intensity={0.9} color="#93c5fd" />
      <hemisphereLight args={['#8b7fd4', '#2a2350', 1.3]} />

      <SkyDome />
      <Ground />
      <MagicParticles />
      <Tower levels={LEVELS} floorStates={floorStates} currentFloor={currentFloor} onSelect={onSelectFloor} activeProfile={activeProfile} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={distance * 0.55}
        maxDistance={distance * 3}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.52}
      />
    </>
  )
}

export default function CastleScreen3D({ viewMode }) {
  const { activeProfile, setCharacter3d } = useGame()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const watchGl = useCanvasWatchdog()

  // Reaching the 3D castle (whether picked at creation or toggled later)
  // needs a 3D character on the profile — grant the default one for their
  // gender instead of leaving it unset.
  useEffect(() => {
    if (activeProfile && !activeProfile.character3dId) {
      setCharacter3d(activeProfile.id, getDefaultCharacter3dId(activeProfile.gender))
    }
  }, [activeProfile, setCharacter3d])

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
      <ErrorBoundary compact>
        <Canvas
          camera={{ fov: 55, position: [0, 4, 26] }}
          onCreated={({ gl }) => watchGl(gl)}
          dpr={[1, 2]}
          gl={{ toneMappingExposure: 1.35 }}
        >
          <Scene
            floorStates={floorStates}
            currentFloor={currentFloor}
            onSelectFloor={handleSelect}
            focusY={focusY}
            activeProfile={activeProfile}
          />
        </Canvas>
      </ErrorBoundary>

      {/* HUD — one bar rather than two floating corners, so the left and right
          groups can never overlap on a narrow phone */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ViewModeToggle viewMode={viewMode} />
          <ModeToggle />
          <div className="bg-black/50 text-amber-300 font-title px-3 sm:px-4 py-2 rounded-xl border border-white/10 backdrop-blur text-xs sm:text-sm truncate">
            🧙 <span className="hidden sm:inline">{activeProfile.name} · </span>Planta {currentFloor}/12
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            onClick={() => navigate('/profiles')}
            className="bg-black/50 hover:bg-black/70 text-white font-title px-3 sm:px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition text-sm"
            title="Jugadores"
          >
            👤
          </motion.button>
          {/* No skins are visible on a 3D character, so the Armario (2D outfits) has nothing to show here — only the Guardería applies. */}
          <motion.button
            onClick={() => navigate('/nursery')}
            className="bg-black/50 hover:bg-black/70 text-white font-title px-3 sm:px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition text-sm"
            title="Guardería"
          >
            🐾
          </motion.button>
        </div>
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
