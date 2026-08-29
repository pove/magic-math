import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
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
import { FLOOR_INTRO, ROOM_INTRO } from '../engine/roomAnimations'
import { getRoomVariant } from '../engine/roomVariants'

// One 3D room per floor theme, mirroring SceneBackground's SCENES map.
// Extended floor by floor — see src/engine/roomScenes3d.js for which floors
// currently have one.
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

// Where the camera settles once the entrance move finishes — every shot
// below converges on this same spot, so gameplay framing (character +
// question overlay) stays consistent no matter which room you came from.
const REST_POSITION = [0, 3.2, 9]
const LOOK_AT = [0, 2.4, -12]

// The camera orbits LOOK_AT in polar coordinates (azimuth angle + radius +
// height above the pivot) instead of flying in a straight line. That's what
// lets an entrance start from miles away at a random angle and swoop/curve
// its way in to face the room dead-on, rather than sliding in on a fixed
// rail — every entrance reads differently and never feels like it's on the
// same track twice.
function polarOffset(azimuth, radius) {
  return [Math.sin(azimuth) * radius, Math.cos(azimuth) * radius]
}

// Describes REST_POSITION itself in the same polar terms, so the rig always
// has a consistent target to spiral into regardless of where it started.
const REST_DX = REST_POSITION[0] - LOOK_AT[0]
const REST_DZ = REST_POSITION[2] - LOOK_AT[2]
const REST_RADIUS = Math.hypot(REST_DX, REST_DZ)
const REST_AZIMUTH = Math.atan2(REST_DX, REST_DZ)
const REST_HEIGHT = REST_POSITION[1] - LOOK_AT[1]

// Picks a fresh, random establishing shot: far above and beyond the room,
// at a wide random angle either side of the final approach direction, with
// a chance of an extra swirling loop thrown in for flair. Kept within
// ±120° of dead-on so the start point never ends up looking back through
// the room's own back wall.
function randomEstablishingShot() {
  const azimuthSpread = (120 * Math.PI) / 180
  const azimuthOffset = (Math.random() * 2 - 1) * azimuthSpread
  const spiralTurns =
    Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 2 * (0.15 + Math.random() * 0.3)) : 0
  return {
    azimuth: REST_AZIMUTH + azimuthOffset,
    radius: REST_RADIUS * (2.3 + Math.random() * 1.6),
    height: REST_HEIGHT + 9 + Math.random() * 15,
    spiralTurns,
  }
}

// Cartesian camera position for how far along (0..1) the approach is.
function cameraPositionAt(shot, eased) {
  const azimuth = shot.azimuth + (REST_AZIMUTH - shot.azimuth) * eased + shot.spiralTurns * (1 - eased)
  const radius = shot.radius + (REST_RADIUS - shot.radius) * eased
  const height = shot.height + (REST_HEIGHT - shot.height) * eased
  const [dx, dz] = polarOffset(azimuth, radius)
  return [LOOK_AT[0] + dx, LOOK_AT[1] + height, LOOK_AT[2] + dz]
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

// Swoops the camera in from a random, far-off establishing shot to
// REST_POSITION over `durationMs` (matching the 2D scene's own
// bgDurationMs, so both backgrounds settle in step with the rest of the
// room's entrance choreography), curving through the angle change rather
// than sliding in a straight line, then keeps a tiny idle sway going —
// echoing the flickering torches / twinkling stars the scene already
// animates.
function CameraRig({ durationMs, shot, children }) {
  const startRef = useRef(null)
  useFrame(({ camera, clock }) => {
    if (startRef.current === null) startRef.current = clock.elapsedTime
    const elapsedMs = (clock.elapsedTime - startRef.current) * 1000
    const t = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1
    const eased = easeOutCubic(t)

    const [x, y, z] = cameraPositionAt(shot, eased)
    camera.position.set(x, y, z)
    // Sway fades in alongside the approach so it never fights the move.
    camera.position.x += Math.sin(clock.elapsedTime * 0.15) * 0.4 * eased
    camera.position.y += Math.sin(clock.elapsedTime * 0.2) * 0.15 * eased
    camera.lookAt(...LOOK_AT)
  })
  return children
}

export default function RoomScene3D({ floor = 1, room = 1, introLevel = 'room', children }) {
  const watchGl = useCanvasWatchdog()
  const Scene = SCENES_3D[floor] || CastleEntranceRoom
  const durationMs = introLevel === 'floor' ? FLOOR_INTRO.bgDurationMs : introLevel === 'room' ? ROOM_INTRO.bgDurationMs : 0
  // A fresh random establishing shot each time this room is entered — see
  // the `key={room}` below, which remounts the Canvas (and so re-rolls this)
  // on every visit, even revisiting the same room number.
  const shot = useMemo(() => randomEstablishingShot(), [room])
  const initialPosition = useMemo(() => cameraPositionAt(shot, 0), [shot])
  // Same hue/saturation tint + accent color the 2D scene uses per room, so
  // rooms feel distinct in 3D too without redoing the geometry per room.
  const variant = getRoomVariant(room)

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        // key={room}: force a fresh Canvas per room so each visit replays its
        // own establishing shot from the start, instead of picking up
        // mid-move from wherever the previous room's camera ended up.
        key={room}
        className="absolute inset-0"
        style={{ filter: `saturate(${variant.sat}) hue-rotate(${variant.hue}deg)` }}
        initial={introLevel !== 'none' ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ErrorBoundary compact>
          <Canvas
            camera={{ fov: 52, position: initialPosition }}
            dpr={[1, 2]}
            onCreated={({ camera, gl }) => { camera.lookAt(...LOOK_AT); watchGl(gl) }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight position={[3, 6, 10]} intensity={0.9} color="#c4b5fd" />
            <hemisphereLight args={['#8b7fd4', '#1a0533', 1.1]} />
            <CameraRig durationMs={durationMs} shot={shot}>
              <Scene accent={variant.accent} />
              <AmbientOrbs accent={variant.accent} seed={floor * 97 + room * 13} />
              <MagicDust color={variant.accent} seed={floor * 53 + room * 7} />
            </CameraRig>
          </Canvas>
        </ErrorBoundary>
      </motion.div>
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
