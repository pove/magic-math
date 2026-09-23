import { useMemo } from 'react'
import { LEVELS } from '../../data/levels'
import Tower from '../castle3d/Tower'
import Ground from '../castle3d/Ground'
import MagicParticles from '../castle3d/MagicParticles'
import { SkyShaderDome, MOON_DIR, HORIZON } from '../castle3d/SkyDome'

/**
 * Floor 1, "La Entrada del Castillo": the actual castle, the same one the
 * player climbs on the castle screen — standing on its front lawn on the
 * floating island, facing the great arched gate between the turrets, with
 * the lantern-lit path, the pines and the keep soaring up into the aurora.
 *
 * The whole castle is placed so its gate sits at the back of the "room"
 * and its level front lawn is where the characters stand. `doorOpenRef`
 * swings the gate open during the entrance choreography.
 */

// Castle origin in room space: puts the gate (castle z ≈ 10.4) at z ≈ -9
// and the lawn (castle y 0.65) at the room floor, y = 0.
export const CASTLE_OFFSET = [0, -0.65, -19.4]

export default function CastleEntranceRoom({ doorOpenRef }) {
  // All floors lit, as a welcome; no labels down here
  const floorStates = useMemo(() => Object.fromEntries(LEVELS.map((l) => [l.floor, 'done'])), [])
  return (
    <group>
      <color attach="background" args={['#05030f']} />
      <fogExp2 attach="fog" args={[HORIZON, 0.009]} />
      <SkyShaderDome radius={400} />

      {/* Moonlight to model the stone, like on the castle screen */}
      <directionalLight position={MOON_DIR.clone().multiplyScalar(60).toArray()} intensity={1.6} color="#b9a6ff" />
      <directionalLight position={[-30, 40, 40]} intensity={1.4} color="#d6dcff" />

      <group position={CASTLE_OFFSET}>
        <Ground />
        <Tower
          levels={LEVELS}
          floorStates={floorStates}
          currentFloor={-1}
          onSelect={() => {}}
          showLabels={false}
          entranceOpenRef={doorOpenRef}
        />
        <MagicParticles />
      </group>
    </group>
  )
}
