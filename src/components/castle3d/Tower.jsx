import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import FloorNode, { FLOOR_HEIGHT, FLOOR_GAP } from './FloorNode'
import Wizard from './Wizard'
import PlayerAvatar3D from './PlayerAvatar3D'

export { FLOOR_HEIGHT, FLOOR_GAP }

const STEP = FLOOR_HEIGHT + FLOOR_GAP
const BASE_R = 7.8
const MIN_R = 5.2

/** Bottom radius of floor `i`. Gentle, clamped taper so the keep stays a
 *  solid-looking tower instead of pinching into a cone (or going negative). */
function floorRadius(i) {
  return Math.max(MIN_R, BASE_R - 0.2 * i)
}

/** Corner turret: cylinder shaft + battlement ring + conical roof + flag */
function Turret({ position, height, accent }) {
  const flag = useRef()
  useFrame((state) => {
    if (flag.current) flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.4
  })
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[2.3, 2.7, height, 12]} />
        <meshStandardMaterial color="#5c5480" roughness={0.75} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 2.2, height + 0.35, Math.sin(a) * 2.2]}>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshStandardMaterial color="#5c5480" roughness={0.75} />
          </mesh>
        )
      })}
      <mesh position={[0, height + 2.6, 0]}>
        <coneGeometry args={[2.1, 3.4, 8]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      <group ref={flag} position={[0, height + 5.2, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.4, 5]} />
          <meshStandardMaterial color="#8a6d3b" />
        </mesh>
        <mesh position={[0.45, 1.0, 0]}>
          <boxGeometry args={[0.9, 0.5, 0.04]} />
          <meshStandardMaterial color="#e11d48" emissive="#e11d48" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * The castle: main keep with floors, corner turrets climbing the full
 * height, battlemented base wall and a magical spire on top.
 */
export default function Tower({ levels, floorStates, currentFloor, onSelect, activeProfile }) {
  const spire = useRef()

  useFrame((state) => {
    if (spire.current) spire.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  const topY = levels.length * STEP
  const activeIndex = levels.findIndex((l) => l.floor === currentFloor)
  // Flanking turrets read as turrets only if they're clearly shorter (and
  // thicker) than the central keep — a full-height thin cylinder looks like
  // a spike, not a tower. Cap them well below the keep's own height.
  const turretHeight = Math.min(topY * 0.42, 28)
  // Radius of the topmost floor. Gentle taper, clamped so it never goes
  // non-positive (a negative cylinder radius renders inside-out in three.js).
  const topRadius = floorRadius(levels.length - 1)

  // Battlements around the base of the keep
  const merlons = useMemo(() => {
    const arr = []
    const count = 20
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      arr.push({ pos: [Math.cos(a) * 9.2, 3.4, Math.sin(a) * 9.2], rot: -a })
    }
    return arr
  }, [])

  return (
    <group>
      {/* Main keep — the stacked playable floors */}
      {levels.map((level, i) => (
        <FloorNode
          key={level.floor}
          level={level}
          index={i}
          status={floorStates[level.floor] || 'locked'}
          onSelect={onSelect}
          r={floorRadius(i)}
        />
      ))}

      {/* The Director Mago waits on the active floor */}
      {activeIndex >= 0 && (
        <Wizard position={[3.5, activeIndex * STEP + FLOOR_HEIGHT / 2 + 1.6, 6.5]} />
      )}

      {/* The player's chosen character + active companion, opposite the Mago */}
      {activeIndex >= 0 && activeProfile && (
        <PlayerAvatar3D profile={activeProfile} position={[-3.5, activeIndex * STEP + FLOOR_HEIGHT / 2 + 1.6, 6.5]} />
      )}

      {/* Foundation */}
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[11, 13, 4, 16]} />
        <meshStandardMaterial color="#332c50" roughness={0.85} />
      </mesh>

      {/* Base wall with battlements */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[9.5, 10, 3.5, 16]} />
        <meshStandardMaterial color="#4a4169" roughness={0.85} />
      </mesh>
      {merlons.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={[0, m.rot, 0]}>
          <boxGeometry args={[1.4, 1.2, 0.8]} />
          <meshStandardMaterial color="#5c5480" roughness={0.75} />
        </mesh>
      ))}

      {/* Grand entrance: arched wooden door with glowing frame on the front wall */}
      <group position={[0, 1.6, 9.55]}>
        {/* Arch frame */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[4.6, 4.4, 0.5]} />
          <meshStandardMaterial color="#332c50" roughness={0.75} />
        </mesh>
        {/* Wooden door */}
        <mesh position={[0, -0.15, 0.3]}>
          <boxGeometry args={[3.2, 3.4, 0.3]} />
          <meshStandardMaterial color="#7c4a21" roughness={0.7} />
        </mesh>
        {/* Warm glow spilling from the doorway */}
        <mesh position={[0, -0.15, 0.47]}>
          <planeGeometry args={[3.0, 3.2]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.35} />
        </mesh>
        <pointLight position={[0, 0, 2]} color="#ffb347" intensity={12} distance={10} />
        {/* Door studs */}
        {[[-1.2, 1.0], [1.2, 1.0], [-1.2, -1.2], [1.2, -1.2]].map(([sx, sy], i) => (
          <mesh key={i} position={[sx, sy - 0.15, 0.48]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#e9d8a6" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Four corner turrets climbing the full height */}
      {[[8.2, 8.2], [-8.2, 8.2], [8.2, -8.2], [-8.2, -8.2]].map(([x, z], i) => (
        <Turret key={i} position={[x, 0, z]} height={turretHeight} accent={i % 2 === 0 ? '#7c3aed' : '#be185d'} />
      ))}

      {/* Magical spire with rotating crystal on top */}
      <mesh ref={spire} position={[0, topY + 2.5, 0]}>
        <coneGeometry args={[topRadius + 0.5, 6, 16]} />
        <meshStandardMaterial color="#332c50" roughness={0.75} />
      </mesh>
      <mesh position={[0, topY + 7.5, 0]}>
        <octahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, topY + 8, 0]} color="#fbbf24" intensity={30} distance={40} />

      {/* Beacon light column for the current floor is handled by FloorNode glow */}
    </group>
  )
}
