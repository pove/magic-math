import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { ErrorBoundary, useCanvasWatchdog } from './CrashOverlay'
import CastleEntranceRoom from './roomscene3d/CastleEntranceRoom'
import LibraryRoom from './roomscene3d/LibraryRoom'
import PotionLabRoom from './roomscene3d/PotionLabRoom'
import EnchantedGardenRoom from './roomscene3d/EnchantedGardenRoom'
import PortraitGalleryRoom from './roomscene3d/PortraitGalleryRoom'
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
}

// Where the camera settles once the entrance move finishes — every shot
// below converges on this same spot, so gameplay framing (character +
// question overlay) stays consistent no matter which room you came from.
const REST_POSITION = [0, 3.2, 9]
const LOOK_AT = [0, 2.4, -12]

// One distinct establishing shot per room in the floor, so walking from
// room to room doesn't repeat the same camera move every time — each starts
// from a different angle/height and sweeps into the same REST_POSITION.
// Room numbers beyond what's listed (e.g. a floor with more rooms) just
// cycle through these.
const ROOM_SHOTS = [
  { start: [0, 5.5, 21] },      // room 1: grand, centered, from high above — arriving at a new floor
  { start: [11, 2.4, 13] },     // room 2: low sweep in from the right
  { start: [-10.5, 4.6, 12] },  // room 3: higher sweep in from the left
  { start: [0, 1.3, 6.2] },     // room 4 / boss: starts close & low, pulls back for a dramatic reveal
]

function getShot(room) {
  const idx = ((room - 1) % ROOM_SHOTS.length + ROOM_SHOTS.length) % ROOM_SHOTS.length
  return ROOM_SHOTS[idx]
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

// Moves the camera in from the room's own starting shot to REST_POSITION
// over `durationMs` (matching the 2D scene's own bgDurationMs, so both
// backgrounds settle in step with the rest of the room's entrance
// choreography), then keeps a tiny idle sway going — echoing the flickering
// torches / twinkling stars the scene already animates.
function CameraRig({ durationMs, startPosition, children }) {
  const startRef = useRef(null)
  useFrame(({ camera, clock }) => {
    if (startRef.current === null) startRef.current = clock.elapsedTime
    const elapsedMs = (clock.elapsedTime - startRef.current) * 1000
    const t = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1
    const eased = easeOutCubic(t)

    camera.position.set(
      startPosition[0] + (REST_POSITION[0] - startPosition[0]) * eased,
      startPosition[1] + (REST_POSITION[1] - startPosition[1]) * eased,
      startPosition[2] + (REST_POSITION[2] - startPosition[2]) * eased
    )
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
  const shot = getShot(room)
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
            camera={{ fov: 52, position: shot.start }}
            dpr={[1, 2]}
            onCreated={({ camera, gl }) => { camera.lookAt(...LOOK_AT); watchGl(gl) }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight position={[3, 6, 10]} intensity={0.9} color="#c4b5fd" />
            <hemisphereLight args={['#8b7fd4', '#1a0533', 1.1]} />
            <CameraRig durationMs={durationMs} startPosition={shot.start}>
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
