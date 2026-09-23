import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { LEVELS } from '../data/levels'
import { getDefaultCharacter3dId } from '../data/characters3d'
import { getFloorStatus } from '../engine/floorConfig'
import { DEFAULT_LIVES } from '../engine/gameConfig'
import Tower, { FLOOR_HEIGHT, FLOOR_GAP } from '../components/castle3d/Tower'
import SkyDome, { MOON_DIR } from '../components/castle3d/SkyDome'
import PostFX from '../components/three/PostFX'
import { QualityProvider, useQuality } from '../components/three/quality'
import { SceneWarmup, LoadingScreen, FpsMeter } from '../components/three/SceneLoader'
import MagicParticles from '../components/castle3d/MagicParticles'
import Ground from '../components/castle3d/Ground'
import useCameraFly from '../components/castle3d/useCameraFly'
import { framingForAspect, WIDE_FRAMING } from '../components/castle3d/framing'
import ViewModeToggle from '../components/ViewModeToggle'
import ModeToggle from '../components/ModeToggle'
import { ErrorBoundary, useCanvasWatchdog } from '../components/CrashOverlay'

const MIN_CAMERA_Y = 3

function Scene({ floorStates, currentFloor, onSelectFloor, focusY, activeProfile, ready }) {
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

  // The cinematic intro flight waits behind the loading screen
  // The top floor is an open terrace: aim at its deck and look down onto it
  const onTerrace = focusY >= (LEVELS.length - 1) * (FLOOR_HEIGHT + FLOOR_GAP) - 0.01
  // Between the ground and the terrace the characters stand on the wall-walk
  // at the foot of the floor: aim a little lower so it sits mid-frame
  const onWalk = !onTerrace && focusY > 1
  useCameraFly({
    targetY: onTerrace ? focusY + 3.5 : onWalk ? focusY - 1.5 : focusY,
    lift: onTerrace ? 6.5 : 4,
    controlsRef,
    distance: onTerrace ? distance * 0.8 : distance,
    paused: !ready,
  })

  // Never let the orbit dip below the meadow: on the lower floors the
  // target sits near ground level, so a fixed max polar angle let the camera
  // slide under the grass and see through the island. Cap the angle so the
  // camera's height stays above MIN_CAMERA_Y for the current target/zoom.
  useFrame(() => {
    const c = controlsRef.current
    if (!c) return
    const d = camera.position.distanceTo(c.target)
    const floorLimit = Math.acos(THREE.MathUtils.clamp((MIN_CAMERA_Y - c.target.y) / Math.max(d, 0.001), -1, 1))
    c.maxPolarAngle = Math.min(Math.PI * 0.52, floorLimit)
  })

  return (
    <>
      <CastleLights />

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

      <PostFX />
    </>
  )
}

/**
 * Night lighting: a cool key "moonlight" from the front-left that casts the
 * soft shadows, a lavender rim from the real moon behind the castle to
 * outline the silhouette, a low sky/ground fill, and a tiny baked
 * environment (no downloads) so metal and glazed roofs pick up reflections.
 */
function CastleLights() {
  const q = useQuality()
  const key = useRef()
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 30, 0)
    return o
  }, [])

  useEffect(() => {
    if (key.current) key.current.target = target
  }, [target])

  return (
    <>
      <primitive object={target} />
      <ambientLight intensity={0.12} color="#8b7fd4" />
      <hemisphereLight args={['#6f6ab8', '#1a1030', 0.9]} />
      <directionalLight
        ref={key}
        position={[-55, 95, 70]}
        intensity={2.6}
        color="#d6dcff"
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMapSize, q.shadowMapSize]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={70}
        shadow-camera-bottom={-50}
        shadow-camera-near={10}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
      <directionalLight position={MOON_DIR.clone().multiplyScalar(100).toArray()} intensity={1.8} color="#b9a6ff" />
      <Environment resolution={128} frames={1} environmentIntensity={0.45}>
        <Lightformer form="rect" intensity={2} color="#8b7fd4" position={[0, 5, -9]} scale={[20, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#67e8f9" position={[-9, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="circle" intensity={3} color="#fbbf24" position={[6, 1, 4]} scale={2} />
        <Lightformer form="rect" intensity={0.6} color="#1e1b4b" position={[0, -5, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
      </Environment>
    </>
  )
}

export default function CastleScreen3D({ viewMode }) {
  const { activeProfile, setCharacter3d, updateProfile } = useGame()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const watchGl = useCanvasWatchdog()
  const [ready, setReady] = useState(false)

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

  // Which floor the camera/UI is focused on is separate from which floor is
  // actually unlocked (currentFloor): a player revisiting an earlier floor
  // to practice shouldn't have the castle snap back to their current floor
  // the moment they leave and come back. Remembered per-profile so it
  // survives the round trip through the room/boss screens (which don't all
  // thread state back here) and even a page reload.
  const storedFocusFloor = activeProfile.castleSelectedFloor
  const initialFocusFloor =
    storedFocusFloor && LEVELS.some((l) => l.floor === storedFocusFloor) ? storedFocusFloor : currentFloor
  const [focusFloor, setFocusFloor] = useState(initialFocusFloor)

  // Start focused on the remembered floor so the intro flies there
  const initialY = useMemo(() => {
    const idx = Math.max(0, LEVELS.findIndex((l) => l.floor === initialFocusFloor))
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
    setFocusFloor(floor)
    updateProfile(activeProfile.id, { castleSelectedFloor: floor })
    const idx = LEVELS.findIndex((l) => l.floor === floor)
    if (idx >= 0) setFocusY(idx * (FLOOR_HEIGHT + FLOOR_GAP))
  }

  const enterFloor = (floor) => {
    if (floor === currentFloor) {
      navigate('/room')
    } else {
      navigate('/room', { state: { practiceFloor: floor, practiceRoom: 1, practiceLives: DEFAULT_LIVES } })
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0b0620] overflow-hidden select-none">
      <ErrorBoundary compact>
        {/* `flat`: no renderer tone mapping — PostFX tone-maps after bloom */}
        <Canvas
          camera={{ fov: 55, position: [0, 4, 26], near: 0.5, far: 1500 }}
          onCreated={({ gl }) => watchGl(gl)}
          dpr={1}
          shadows
          flat
          gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        >
          <QualityProvider>
            <SceneWarmup onReady={() => setReady(true)} />
            <FpsMeter />
            <Scene
              ready={ready}
              floorStates={floorStates}
              currentFloor={currentFloor}
              onSelectFloor={handleSelect}
              focusY={focusY}
              activeProfile={activeProfile}
            />
          </QualityProvider>
        </Canvas>
      </ErrorBoundary>
      <LoadingScreen visible={!ready} />

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

      {/* Up / down floor navigation — z-20 so the floor info panel below
          (which can grow tall on short screens) never paints over and
          hides these buttons. */}
      <div className="absolute z-20 right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSelect(Math.min(12, focusFloor + 1))}
          disabled={focusFloor >= 12}
          className="w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 text-white text-2xl font-title shadow-lg shadow-purple-900/50 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur"
          title="Subir de planta"
        >
          ▲
        </motion.button>
        <div className="text-center font-title text-amber-300 text-sm bg-black/40 rounded-lg py-1 px-2 backdrop-blur">
          {focusFloor}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSelect(Math.max(1, focusFloor - 1))}
          disabled={focusFloor <= 1}
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
            className="absolute z-10 inset-x-0 bottom-8 flex justify-center pointer-events-none"
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
