import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { ErrorBoundary, useCanvasWatchdog } from './CrashOverlay'
import CastleEntranceRoom from './roomscene3d/CastleEntranceRoom'
import { FLOOR_INTRO, ROOM_INTRO } from '../engine/roomAnimations'

// One 3D room per floor theme, mirroring SceneBackground's SCENES map. Only
// floor 1 has a 3D take so far — this is a first experiment to see whether a
// 3D room can read as "the same place" as its 2D counterpart.
const SCENES_3D = {
  1: CastleEntranceRoom,
}

// Where the camera settles once the entrance dolly finishes, vs. where it
// starts — pulled back and a little higher, like approaching the gate from
// across the courtyard.
const REST_POSITION = [0, 3.2, 9]
const FAR_POSITION = [0, 5.5, 21]
const LOOK_AT = [0, 2.4, -12]

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

// Dollies the camera in from FAR_POSITION to REST_POSITION over `durationMs`
// (matching the 2D scene's own bgDurationMs, so both backgrounds settle in
// step with the rest of the room's entrance choreography), then keeps a
// tiny idle sway going — echoing the flickering torches / twinkling stars
// the scene already animates.
function CameraRig({ durationMs, children }) {
  const startRef = useRef(null)
  useFrame(({ camera, clock }) => {
    if (startRef.current === null) startRef.current = clock.elapsedTime
    const elapsedMs = (clock.elapsedTime - startRef.current) * 1000
    const t = durationMs > 0 ? Math.min(1, elapsedMs / durationMs) : 1
    const eased = easeOutCubic(t)

    camera.position.set(
      FAR_POSITION[0] + (REST_POSITION[0] - FAR_POSITION[0]) * eased,
      FAR_POSITION[1] + (REST_POSITION[1] - FAR_POSITION[1]) * eased,
      FAR_POSITION[2] + (REST_POSITION[2] - FAR_POSITION[2]) * eased
    )
    // Sway fades in alongside the dolly so it never fights the approach motion.
    camera.position.x += Math.sin(clock.elapsedTime * 0.15) * 0.4 * eased
    camera.position.y += Math.sin(clock.elapsedTime * 0.2) * 0.15 * eased
    camera.lookAt(...LOOK_AT)
  })
  return children
}

export function hasRoomScene3D(floor) {
  return Boolean(SCENES_3D[floor])
}

export default function RoomScene3D({ floor = 1, introLevel = 'room', children }) {
  const watchGl = useCanvasWatchdog()
  const Scene = SCENES_3D[floor] || CastleEntranceRoom
  const durationMs = introLevel === 'floor' ? FLOOR_INTRO.bgDurationMs : introLevel === 'room' ? ROOM_INTRO.bgDurationMs : 0

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={introLevel !== 'none' ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <ErrorBoundary compact>
          <Canvas
            camera={{ fov: 52, position: FAR_POSITION }}
            dpr={[1, 2]}
            onCreated={({ camera, gl }) => { camera.lookAt(...LOOK_AT); watchGl(gl) }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight position={[3, 6, 10]} intensity={0.9} color="#c4b5fd" />
            <hemisphereLight args={['#8b7fd4', '#1a0533', 1.1]} />
            <CameraRig durationMs={durationMs}>
              <Scene />
            </CameraRig>
          </Canvas>
        </ErrorBoundary>
      </motion.div>
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
