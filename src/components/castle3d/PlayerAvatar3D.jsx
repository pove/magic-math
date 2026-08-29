import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import GltfCharacter from '../character3d/GltfCharacter'
import { getCharacter3dById, getDefaultCharacter3dId } from '../../data/characters3d'
import { getPetById } from '../../data/pets'
import { getMonsterById } from '../../data/monsters'

function getCompanion(activeCompanion) {
  if (!activeCompanion) return null
  return activeCompanion.type === 'pet' ? getPetById(activeCompanion.id) : getMonsterById(activeCompanion.id)
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

// How far to the (camera) left the character starts, and how small, when
// walking into a room. Kept inside the character's own fixed-size 3D
// viewport (rather than a CSS transform on the outer HTML box) so it grows
// for real — a CSS scale would get baked into the canvas's render
// resolution at whatever size it happened to be mid-transition — and so the
// effect looks identical whether that viewport sits in a landscape row or a
// portrait stack.
const WALK_IN_OFFSET_X = -1.6
const WALK_IN_START_SCALE = 0.35

export default function PlayerAvatar3D({
  profile,
  position = [0, 0, 0],
  animationOverride,
  walkIn = false,
  walkInDelayMs = 0,
  walkInDurationMs = 1000,
}) {
  const character = getCharacter3dById(profile.character3dId) || getCharacter3dById(getDefaultCharacter3dId(profile.gender))
  const companion = getCompanion(profile.activeCompanion)
  const rigRef = useRef()
  const startRef = useRef(null)

  useFrame(() => {
    if (!walkIn || !rigRef.current) return
    if (startRef.current === null) startRef.current = performance.now()
    const elapsed = performance.now() - startRef.current - walkInDelayMs
    const t = walkInDurationMs > 0 ? Math.min(1, Math.max(0, elapsed / walkInDurationMs)) : 1
    const eased = easeOutCubic(t)
    rigRef.current.position.x = position[0] + WALK_IN_OFFSET_X * (1 - eased)
    rigRef.current.scale.setScalar(WALK_IN_START_SCALE + (1 - WALK_IN_START_SCALE) * eased)
  })

  return (
    <Suspense fallback={null}>
      <group ref={rigRef} position={walkIn ? [position[0] + WALK_IN_OFFSET_X, position[1], position[2]] : position}>
        <GltfCharacter key={character.file} src={character.file} animationName={animationOverride || character.animation} targetHeight={character.height} rotationY={0.5} />
        {companion && (
          <GltfCharacter
            key={companion.file}
            src={companion.file}
            animationName={companion.animation}
            targetHeight={companion.height}
            position={[0.9, 0, 0.3]}
            rotationY={-0.6}
          />
        )}
      </group>
    </Suspense>
  )
}
