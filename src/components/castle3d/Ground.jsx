import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Low-poly terrain: rocky island base, grassy hill, stone path,
 * pine trees and rocks around the tower. Pure procedural geometry.
 */
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 1.2, 6]} />
        <meshStandardMaterial color="#5b3a1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[1.3, 2.6, 7]} />
        <meshStandardMaterial color="#1e5c3a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.4, 0]}>
        <coneGeometry args={[0.9, 1.8, 7]} />
        <meshStandardMaterial color="#27754a" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale = 1 }) {
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.8, 0), [])
  return (
    <mesh geometry={geo} position={position} scale={scale} rotation={[Math.random(), Math.random(), Math.random()]}>
      <meshStandardMaterial color="#4a4560" roughness={1} />
    </mesh>
  )
}

export default function Ground() {
  // Stone path slabs spiraling toward the tower entrance
  const pathStones = useMemo(() => {
    const stones = []
    for (let i = 0; i < 10; i++) {
      const t = i / 9
      const angle = Math.PI * 0.75 - t * Math.PI * 0.55
      const dist = 22 - t * 8
      stones.push({ pos: [Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist], rot: t * 1.2 })
    }
    return stones
  }, [])

  return (
    <group>
      {/* Grassy hill */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[26, 30, 3, 24]} />
        <meshStandardMaterial color="#173a2a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[25.5, 26, 0.7, 24]} />
        <meshStandardMaterial color="#1d4d33" roughness={1} />
      </mesh>

      {/* Stone path */}
      {pathStones.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.rot, 0]}>
          <boxGeometry args={[1.6, 0.25, 1.2]} />
          <meshStandardMaterial color="#565170" roughness={0.95} />
        </mesh>
      ))}

      {/* Pine forest ring */}
      {[
        [-18, 0, 8], [-20, 0, -4], [-14, 0, -14], [16, 0, -12], [19, 0, 2],
        [13, 0, 13], [-6, 0, 18], [7, 0, 17], [-21, 0, 14], [22, 0, -8],
      ].map((p, i) => (
        <Tree key={i} position={p} scale={0.9 + (i % 3) * 0.25} />
      ))}

      {/* Scattered rocks */}
      {[[-11, 0, 10], [12, 0, 8], [-16, 0, -8], [9, 0, -16], [17, 0, 12]].map((p, i) => (
        <Rock key={i} position={p} scale={0.6 + (i % 2) * 0.4} />
      ))}
    </group>
  )
}
