import { Canvas } from '@react-three/fiber'
import PlayerAvatar3D from '../castle3d/PlayerAvatar3D'

// A character standing with a companion beside it is a wide composition —
// giving it a wider box (instead of forcing it into a square) means the pair
// renders at full, consistent size instead of both shrinking to fit.
export default function CharacterStage3D({ profile, size = 110 }) {
  const hasCompanion = Boolean(profile.activeCompanion)
  const width = hasCompanion ? Math.round(size * 1.5) : size

  return (
    <div style={{ width, height: size }}>
      <Canvas
        camera={{ fov: 35, position: [0.5, 1.1, 3.5] }}
        onCreated={({ camera }) => camera.lookAt(0.45, 0.8, 0)}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} color="#e9d5ff" />
        <hemisphereLight args={['#8b7fd4', '#2a2350', 1.2]} />
        <PlayerAvatar3D profile={profile} position={[hasCompanion ? -0.3 : 0, 0, 0]} />
      </Canvas>
    </div>
  )
}
