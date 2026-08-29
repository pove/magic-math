import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, StoneFloor } from './kit'

/**
 * 3D take on floor 9, "El Observatorio": a deep-space dome with a slowly
 * spinning ringed planet, shooting stars streaking by, and a telescope
 * aimed at it all.
 */

function RingedPlanet() {
  const planet = useRef()
  const ring = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (planet.current) planet.current.rotation.y = t * 0.15
    if (ring.current) ring.current.rotation.z = 0.35 + Math.sin(t * 0.1) * 0.02
  })
  return (
    <group position={[7, 8, -22]}>
      <mesh ref={planet}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
        <ringGeometry args={[3, 3.9, 48]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#fbbf24" intensity={1.4} distance={20} />
    </group>
  )
}

// A streak of light that periodically shoots across the sky.
function ShootingStar({ seed = 0 }) {
  const ref = useRef()
  const startRef = useRef(Math.random() * 6)
  useFrame((state) => {
    const cycle = 6
    const t = (state.clock.elapsedTime + seed * 2.7 + startRef.current) % cycle
    const active = t < 1.2
    if (ref.current) {
      ref.current.visible = active
      const p = t / 1.2
      ref.current.position.set(-14 + p * 26, 14 - p * 6, -20 + seed * 3)
      ref.current.material.opacity = active ? 1 - p : 0
    }
  })
  return (
    <mesh ref={ref} rotation={[0, 0, -0.35]}>
      <planeGeometry args={[1.6, 0.05]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={1} />
    </mesh>
  )
}

function Telescope() {
  const tube = useRef()
  useFrame((state) => {
    if (tube.current) tube.current.rotation.z = -0.6 + Math.sin(state.clock.elapsedTime * 0.15) * 0.06
  })
  return (
    <group position={[-4, 0, -5]}>
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0]} rotation={[0, 0, i === 0 ? 0.25 : -0.25]}>
          <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <group ref={tube} position={[0, 1.5, 0]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.22, 0.16, 1.8, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.85} />
        </mesh>
        <pointLight position={[0, 1.85, 0]} color="#93c5fd" intensity={0.8} distance={4} />
      </group>
    </group>
  )
}

export default function ObservatoryRoom({ accent = '#06b6d4' }) {
  const shootingStars = useMemo(() => [0, 1, 2], [])
  return (
    <group>
      <color attach="background" args={['#000010']} />
      <fog attach="fog" args={['#000010', 18, 48]} />

      <Stars seed={55} count={280} spread={90} y={[2, 34]} z={[-14, -50]} />
      <RingedPlanet />
      {shootingStars.map((s) => (
        <ShootingStar key={s} seed={s} />
      ))}

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#0c1a4a" roughness={0.9} transparent opacity={0.55} />
      </mesh>

      <Telescope />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />

      <StoneFloor baseColor="#0a1230" tileColor="#111d45" />
    </group>
  )
}
