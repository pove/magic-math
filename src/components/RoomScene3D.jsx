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
import { FLOOR_INTRO, ROOM_INTRO } from '../engine/roomAnimations'
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

// The camera orbits the framing's look-at point in polar coordinates
// (azimuth + radius + height) instead of flying in a straight line. That's
// what lets an entrance start far away at a random angle and swoop/curve
// its way in to the resting shot — every entrance reads differently.
function restPolar(framing) {
  const dx = framing.rest[0] - framing.look[0]
  const dz = framing.rest[2] - framing.look[2]
  return {
    radius: Math.hypot(dx, dz),
    azimuth: Math.atan2(dx, dz),
    height: framing.rest[1] - framing.look[1],
  }
}

// A fresh, random establishing shot, relative to wherever the camera will
// end up: far above and beyond the room, at a wide random angle either side
// of the final approach, sometimes with an extra swirl. Stored as offsets so
// it still converges if the framing changes mid-flight (e.g. a rotation).
function randomEstablishingShot() {
  const azimuthSpread = (120 * Math.PI) / 180
  const spiralTurns =
    Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 2 * (0.15 + Math.random() * 0.3)) : 0
  return {
    azimuthOffset: (Math.random() * 2 - 1) * azimuthSpread,
    radiusMul: 2.3 + Math.random() * 1.6,
    heightAdd: 9 + Math.random() * 15,
    spiralTurns,
  }
}

function cameraPositionAt(framing, shot, eased) {
  const rest = restPolar(framing)
  const startAz = rest.azimuth + shot.azimuthOffset
  const azimuth = startAz + (rest.azimuth - startAz) * eased + shot.spiralTurns * (1 - eased)
  const radius = rest.radius * (shot.radiusMul + (1 - shot.radiusMul) * eased)
  const height = rest.height + shot.heightAdd * (1 - eased)
  return [
    framing.look[0] + Math.sin(azimuth) * radius,
    framing.look[1] + height,
    framing.look[2] + Math.cos(azimuth) * radius,
  ]
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

// Swoops the camera in from the establishing shot to the resting framing
// over `durationMs`, then keeps a tiny idle sway going. Reads the framing
// from a ref so a layout change (rotation, resize) re-aims it smoothly.
function CameraRig({ durationMs, shot, framingRef }) {
  const startRef = useRef(null)
  const look = useMemo(() => new THREE.Vector3(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, clock }, dt) => {
    const framing = framingRef.current
    if (startRef.current === null) {
      startRef.current = clock.elapsedTime
      look.set(...framing.look)
    }
    const elapsedMs = (clock.elapsedTime - startRef.current) * 1000
    const t = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1
    const eased = easeOutCubic(t)

    target.set(...cameraPositionAt(framing, shot, eased))
    // Sway fades in alongside the approach so it never fights the move.
    target.x += Math.sin(clock.elapsedTime * 0.15) * 0.12 * eased
    target.y += Math.sin(clock.elapsedTime * 0.2) * 0.05 * eased
    if (t < 1) camera.position.copy(target)
    else camera.position.lerp(target, 1 - Math.exp(-dt * 4)) // settle smoothly on re-frames
    lookTarget.set(...framing.look)
    look.lerp(lookTarget, t < 1 ? 1 : 1 - Math.exp(-dt * 4))
    camera.lookAt(look)
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
export default function RoomScene3D({ floor = 1, room = 1, introLevel = 'room', actors, children }) {
  const watchGl = useCanvasWatchdog()
  const containerRef = useRef()
  // How far open the back-wall door is (0..1), driven by the entrance choreography
  const doorOpenRef = useRef(0)
  const Scene = SCENES_3D[floor] || CastleEntranceRoom
  const durationMs = introLevel === 'floor' ? FLOOR_INTRO.bgDurationMs : introLevel === 'room' ? ROOM_INTRO.bgDurationMs : 0
  // A fresh random establishing shot each time this room is entered — see
  // the `key={room}` below, which remounts the Canvas (and so re-rolls this).
  const shot = useMemo(() => randomEstablishingShot(), [room])
  const variant = getRoomVariant(room)

  const framing = useStageFraming(actors?.anchorRef, containerRef, actors?.wizard ? 2.2 : 1.6)
  const framingRef = useRef(framing)
  framingRef.current = framing
  const initialPosition = useMemo(() => cameraPositionAt(framing, shot, durationMs > 0 ? 0 : 1), [shot]) // eslint-disable-line react-hooks/exhaustive-deps

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
            onCreated={({ camera, gl }) => { camera.lookAt(...framing.look); watchGl(gl) }}
          >
            <QualityProvider>
              <FovSync />
              {/* The daytime cloud bridge brings its own sunlight */}
              {floor !== 11 && <RoomLights variant={variant} />}
              <CameraRig durationMs={durationMs} shot={shot} framingRef={framingRef} />
              {ROOM_THEMES[floor] && <RoomShell theme={ROOM_THEMES[floor]} />}
              <RoomDecor theme={ROOM_THEMES[floor]} doorOpenRef={doorOpenRef} />
              <Scene accent={variant.accent} doorOpenRef={doorOpenRef} />
              <AmbientOrbs accent={variant.accent} seed={floor * 97 + room * 13} />
              <MagicDust color={variant.accent} seed={floor * 53 + room * 7} />
              {actors && <RoomActors stage={framing.stage} {...actors} />}
              {/* The daytime cloud bridge is bright everywhere: only its sun and rainbow should bloom */}
              <PostFX bloom={1} bloomThreshold={floor === 11 ? 1.6 : 0.8} aoRadius={1.6} aoIntensity={1.6} vignette={0.45} />
            </QualityProvider>
          </Canvas>
        </ErrorBoundary>
      </motion.div>
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
