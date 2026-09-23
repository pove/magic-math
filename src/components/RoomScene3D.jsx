import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { ErrorBoundary, useCanvasWatchdog } from './CrashOverlay'
import CastleEntranceRoom from './roomscene3d/CastleEntranceRoom'
import LibraryRoom from './roomscene3d/LibraryRoom'
import PotionLabRoom from './roomscene3d/PotionLabRoom'
import EnchantedGardenRoom from './roomscene3d/EnchantedGardenRoom'
import PortraitGalleryRoom from './roomscene3d/PortraitGalleryRoom'
import SpellClassroomRoom from './roomscene3d/SpellClassroomRoom'
import ClockTowerRoom from './roomscene3d/ClockTowerRoom'
import CryptOfSagesRoom from './roomscene3d/CryptOfSagesRoom'
import ObservatoryRoom from './roomscene3d/ObservatoryRoom'
import CouncilHallRoom from './roomscene3d/CouncilHallRoom'
import CloudBridgeRoom from './roomscene3d/CloudBridgeRoom'
import WizardTowerRoom from './roomscene3d/WizardTowerRoom'
import { AmbientOrbs, MagicDust } from './roomscene3d/kit'
import RoomActors from './roomscene3d/RoomActors'
import RoomShell, { ROOM_THEMES } from './roomscene3d/shell'
import { RoomDecor } from './roomscene3d/props'
import { ROOM_FOV, DEFAULT_FRAMING, computeFraming, measureAnchor } from './roomscene3d/stage'
import PostFX from './three/PostFX'
import { QualityProvider } from './three/quality'
import { SceneWarmup, LoadingScreen, FpsMeter } from './three/SceneLoader'
import { FLOOR_INTRO_3D, ROOM_INTRO_3D } from '../engine/roomAnimations'
import { getRoomVariant } from '../engine/roomVariants'

// One 3D room per floor theme, mirroring SceneBackground's SCENES map.
const SCENES_3D = {
  1: CastleEntranceRoom,
  2: LibraryRoom,
  3: PotionLabRoom,
  4: EnchantedGardenRoom,
  5: PortraitGalleryRoom,
  6: SpellClassroomRoom,
  7: ClockTowerRoom,
  8: CryptOfSagesRoom,
  9: ObservatoryRoom,
  10: CouncilHallRoom,
  11: CloudBridgeRoom,
  12: WizardTowerRoom,
}

// Rooms that open onto the sky get a higher, wider tour.
const OPEN_AIR = new Set([1, 4, 9, 11, 12])

/** Where the player comes in from: the back-wall door (or the castle gate on
 *  floor 1, the rainbow on floor 11). */
export function entryDoor(floor) {
  if (floor === 1) return { x: 0, z: -9.2 }
  if (floor === 11) return { x: 0, z: -11.8 }
  const door = ROOM_THEMES[floor]?.door
  return door ? { x: door.x, z: door.z } : { x: 0, z: -12.4 }
}

// A fresh random tour each visit: which side it sweeps in from.
function randomShot() {
  return { side: Math.random() < 0.5 ? -1 : 1 }
}

/**
 * The establishing camera tour, as position/look-at curves that end exactly
 * on the resting framing. A floor's first room gets the grand version (on
 * floor 1: from high above the whole castle down to its gate); later rooms
 * a shorter sweep. Interiors stay below the ceiling and inside the walls.
 */
function buildTour(floor, framing, shot, grand) {
  const s = shot.side
  const door = entryDoor(floor)
  const open = OPEN_AIR.has(floor)
  const ceiling = ROOM_THEMES[floor]?.ceiling ? (ROOM_THEMES[floor].height ?? 8) - 1.4 : 12
  const P = []
  const L = []
  if (floor === 1 && grand) {
    P.push([s * 34, 58, 36]); L.push([0, 40, -19.4])
    P.push([s * -22, 20, 14]); L.push([0, 10, -19.4])
    P.push([s * 4, 3.5, 2]); L.push([0, 2.8, -9])
  } else if (grand) {
    P.push([s * 10.5, Math.min(open ? 11 : 6.6, ceiling), 11]); L.push([s * -2, 2, -10])
    P.push([s * -9, Math.min(open ? 6 : 4.5, ceiling), 1]); L.push([s * 2, 2.5, -10])
    P.push([door.x * 0.5, 2.3, -3.5]); L.push([door.x, 2.2, door.z])
  } else {
    P.push([s * 8.5, Math.min(open ? 6 : 4.8, ceiling), 9]); L.push([s * -1, 2.2, -10])
    P.push([door.x * 0.5 + s * 1.5, 2.4, -1.5]); L.push([door.x, 2.2, door.z])
  }
  P.push(framing.rest)
  L.push(framing.look)
  const curve = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
  return { pos: curve(P), look: curve(L) }
}

const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2

// Plays the tour over `durationMs`, then keeps a tiny idle sway going and
// eases onto any new framing (rotation/resize) smoothly.
function CameraRig({ durationMs, tourRef, framingRef, ready }) {
  const startRef = useRef(null)
  const look = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, clock }, dt) => {
    const framing = framingRef.current
    const tour = tourRef.current
    // Hold on the tour's first frame until the scene has finished loading
    if (!ready) {
      if (durationMs > 0) {
        camera.position.copy(tour.pos.getPoint(0))
        camera.lookAt(tour.look.getPoint(0))
      }
      return
    }
    if (startRef.current === null) {
      startRef.current = clock.elapsedTime
      look.copy(durationMs > 0 ? tour.look.getPoint(0) : lookTarget.set(...framing.look))
    }
    const elapsedMs = (clock.elapsedTime - startRef.current) * 1000
    const t = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1
    if (t < 1) {
      const e = easeInOutSine(t)
      camera.position.copy(tour.pos.getPoint(e))
      look.copy(tour.look.getPoint(e))
    } else {
      target.set(...framing.rest)
      target.x += Math.sin(clock.elapsedTime * 0.15) * 0.12
      target.y += Math.sin(clock.elapsedTime * 0.2) * 0.05
      camera.position.lerp(target, 1 - Math.exp(-dt * 4))
      lookTarget.set(...framing.look)
      look.lerp(lookTarget, 1 - Math.exp(-dt * 4))
    }
    camera.lookAt(look)
  })
  return null
}

/** Swings the entry door open as the player comes through, then shut. */
function DoorDriver({ phase, openRef }) {
  const since = useRef({ phase, t: null })
  useFrame((state, dt) => {
    if (since.current.phase !== phase || since.current.t === null) since.current = { phase, t: state.clock.elapsedTime }
    const el = state.clock.elapsedTime - since.current.t
    const target = phase === 'entering' && el < 1.5 ? 1 : 0
    openRef.current = THREE.MathUtils.damp(openRef.current, target, target ? 5 : 3, dt)
  })
  return null
}

/**
 * Tracks the HTML slot reserved for the actors and turns it into a camera
 * framing (see roomscene3d/stage.js). Re-measures on resize/rotation.
 */
function useStageFraming(anchorRef, containerRef, actorsHeight) {
  const [framing, setFraming] = useState(DEFAULT_FRAMING)
  useLayoutEffect(() => {
    const container = containerRef.current
    const el = anchorRef?.current
    if (!container || !el) return undefined
    const update = () => {
      const c = container.getBoundingClientRect()
      const anchor = measureAnchor(el, container)
      if (anchor) setFraming(computeFraming(anchor, c.width / Math.max(1, c.height), actorsHeight))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [anchorRef, containerRef, actorsHeight])
  return framing
}

/** Room lights, tinted per room variant (the old CSS hue filter tinted the
 *  characters too — tinting the light keeps skin and robes natural). */
function RoomLights({ variant }) {
  const colors = useMemo(() => {
    const shift = (hex) => {
      const c = new THREE.Color(hex)
      c.offsetHSL(variant.hue / 360, (variant.sat - 1) * 0.5, 0)
      return c
    }
    return { sky: shift('#8b7fd4'), key: shift('#c4b5fd'), ground: shift('#1a0533') }
  }, [variant])
  return (
    <>
      <ambientLight intensity={0.9} color={colors.sky} />
      <directionalLight position={[3, 6, 10]} intensity={1.1} color={colors.key} />
      <hemisphereLight args={[colors.sky, colors.ground, 1.1]} />
    </>
  )
}

function FovSync() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.fov = ROOM_FOV
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

/**
 * actors (optional): { anchorRef, profile, phase, enterMs, leaveMs, action,
 * questionKey, wizard, wizardTalking } — puts the player and the Director
 * Mago inside the room, framed onto the `anchorRef` HTML slot.
 */
export default function RoomScene3D({ floor = 1, room = 1, introLevel = 'room', actors, onReady, children }) {
  const watchGl = useCanvasWatchdog()
  const containerRef = useRef()
  // Behind a loading curtain until models are in and shaders compiled
  const [ready, setReady] = useState(false)
  const handleReady = () => {
    setReady(true)
    onReady?.()
  }
  // How far open the back-wall door is (0..1), driven by the entrance choreography
  const doorOpenRef = useRef(0)
  const Scene = SCENES_3D[floor] || CastleEntranceRoom
  const durationMs = introLevel === 'floor' ? FLOOR_INTRO_3D.bgDurationMs : introLevel === 'room' ? ROOM_INTRO_3D.bgDurationMs : 0
  // A fresh random establishing shot each time this room is entered — see
  // the `key={room}` below, which remounts the Canvas (and so re-rolls this).
  const shot = useMemo(() => randomShot(), [room])
  const variant = getRoomVariant(room)

  const framing = useStageFraming(actors?.anchorRef, containerRef, actors?.wizard ? 2.2 : 1.6)
  const framingRef = useRef(framing)
  framingRef.current = framing
  const tour = useMemo(() => buildTour(floor, framing, shot, introLevel === 'floor'), [floor, framing, shot, introLevel])
  const tourRef = useRef(tour)
  tourRef.current = tour
  const initialPosition = useMemo(() => (durationMs > 0 ? tour.pos.getPoint(0).toArray() : framing.rest), [shot]) // eslint-disable-line react-hooks/exhaustive-deps
  const door = entryDoor(floor)

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <motion.div
        // key={room}: force a fresh Canvas per room so each visit replays its
        // own establishing shot from the start.
        key={room}
        className="absolute inset-0"
        initial={introLevel !== 'none' ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ErrorBoundary compact>
          {/* `flat`: no renderer tone mapping — PostFX tone-maps after bloom */}
          <Canvas
            camera={{ fov: ROOM_FOV, position: initialPosition }}
            dpr={1}
            flat
            gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
            onCreated={({ camera, gl }) => { camera.lookAt(durationMs > 0 ? tour.look.getPoint(0) : new THREE.Vector3(...framing.look)); watchGl(gl) }}
          >
            <QualityProvider measuring={ready}>
              <SceneWarmup onReady={handleReady} />
              <FpsMeter />
              <FovSync />
              {/* The daytime cloud bridge brings its own sunlight */}
              {floor !== 11 && <RoomLights variant={variant} />}
              <CameraRig durationMs={durationMs} tourRef={tourRef} framingRef={framingRef} ready={ready} />
              {actors && <DoorDriver phase={actors.phase} openRef={doorOpenRef} />}
              {ROOM_THEMES[floor] && <RoomShell theme={ROOM_THEMES[floor]} />}
              <RoomDecor theme={ROOM_THEMES[floor]} doorOpenRef={doorOpenRef} />
              <Scene accent={variant.accent} doorOpenRef={doorOpenRef} />
              <AmbientOrbs accent={variant.accent} seed={floor * 97 + room * 13} />
              <MagicDust color={variant.accent} seed={floor * 53 + room * 7} />
              {actors && <RoomActors stage={framing.stage} entryFrom={[door.x, 0, door.z + 0.9]} {...actors} />}
              {/* The daytime cloud bridge is bright everywhere: only its sun and rainbow should bloom */}
              <PostFX bloom={1} bloomThreshold={floor === 11 ? 1.6 : 0.8} aoRadius={1.6} aoIntensity={1.6} vignette={0.45} />
            </QualityProvider>
          </Canvas>
        </ErrorBoundary>
      </motion.div>
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <LoadingScreen visible={!ready} />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
