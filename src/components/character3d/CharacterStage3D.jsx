import { Canvas } from '@react-three/fiber'
import PlayerAvatar3D from '../castle3d/PlayerAvatar3D'
import { ErrorBoundary, useCanvasWatchdog } from '../CrashOverlay'

// A character standing with a companion beside it is a wide composition —
// giving it a wider box (instead of forcing it into a square) means the pair
// renders at full, consistent size instead of both shrinking to fit.
export default function CharacterStage3D({ profile, size = 110 }) {
  const hasCompanion = Boolean(profile.activeCompanion)
  const width = hasCompanion ? Math.round(size * 1.5) : size
  const watchGl = useCanvasWatchdog()

  return (
    // The width cap uses viewport units rather than a percentage: this box
    // sits inside flex ancestors that are themselves shrink-to-fit (auto
    // width), so a percentage max-width has no definite size to resolve
    // against and is silently ignored. On narrow phones a companion's 1.5x
    // width can otherwise exceed the screen; capping it just shows a
    // narrower horizontal slice of the 3D scene rather than clipping or
    // squishing the character.
    <div style={{ width, height: size, maxWidth: 'calc(100vw - 24px)' }}>
      <ErrorBoundary compact>
        <Canvas
          camera={{ fov: 35, position: [0.5, 1.1, 3.5] }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0.45, 0.8, 0)
            watchGl(gl)
          }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1} />
          <directionalLight position={[3, 5, 4]} intensity={1.6} color="#e9d5ff" />
          <hemisphereLight args={['#8b7fd4', '#2a2350', 1.2]} />
          <PlayerAvatar3D profile={profile} position={[hasCompanion ? -0.3 : 0, 0, 0]} />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
