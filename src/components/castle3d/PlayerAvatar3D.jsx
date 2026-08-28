import { Suspense } from 'react'
import GltfCharacter from '../character3d/GltfCharacter'
import { getCharacter3dById, getDefaultCharacter3dId } from '../../data/characters3d'
import { getPetById } from '../../data/pets'
import { getMonsterById } from '../../data/monsters'

function getCompanion(activeCompanion) {
  if (!activeCompanion) return null
  return activeCompanion.type === 'pet' ? getPetById(activeCompanion.id) : getMonsterById(activeCompanion.id)
}

export default function PlayerAvatar3D({ profile, position = [0, 0, 0] }) {
  const character = getCharacter3dById(profile.character3dId) || getCharacter3dById(getDefaultCharacter3dId(profile.gender))
  const companion = getCompanion(profile.activeCompanion)

  return (
    <Suspense fallback={null}>
      <group position={position}>
        <GltfCharacter key={character.file} src={character.file} animationName={character.animation} targetHeight={character.height} rotationY={0.5} />
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
