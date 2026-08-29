import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { StoneFloor } from './kit'

/**
 * 3D take on floor 7, "La Torre del Reloj": a giant clock face with hands
 * that actually sweep, and two brass gears grinding away below it in
 * opposite directions.
 */

function ClockFace() {
  const hour = useRef()
  const minute = useRef()
  const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (minute.current) minute.current.rotation.z = -t * 0.35
    if (hour.current) hour.current.rotation.z = -t * 0.05
  })
  return (
    <group position={[0, 4.6, -12.2]}>
      <mesh>
        <cylinderGeometry args={[2.4, 2.4, 0.35, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#78350f" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <cylinderGeometry args={[2.05, 2.05, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 1.75, Math.cos(a) * 1.75, 0.27]}>
          <boxGeometry args={[0.08, 0.24, 0.05]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      <mesh ref={hour} position={[0, 0, 0.3]}>
        <boxGeometry args={[0.12, 1.1, 0.06]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh ref={minute} position={[0, 0, 0.32]}>
        <boxGeometry args={[0.09, 1.55, 0.05]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[0, 0, 0.34]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <pointLight position={[0, 0, 1.5]} color="#fde68a" intensity={0.8} distance={8} />
    </group>
  )
}

function Gear({ position, radius = 1.1, teeth = 8, dir = 1, speed = 0.35 }) {
  const ref = useRef()
  const toothAngles = useMemo(() => Array.from({ length: teeth }, (_, i) => (i / teeth) * Math.PI * 2), [teeth])
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed * dir
  })
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[radius, radius, 0.32, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#8a8a92" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.36, radius * 0.36, 0.34, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.6} roughness={0.4} />
      </mesh>
      {toothAngles.map((a, i) => (
        <mesh
          key={i}
          position={[Math.sin(a) * radius, Math.cos(a) * radius, 0]}
          rotation={[0, 0, -a]}
        >
          <boxGeometry args={[0.22, 0.28, 0.3]} />
          <meshStandardMaterial color="#8a8a92" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export default function ClockTowerRoom({ accent = '#d97706' }) {
  return (
    <group>
      <color attach="background" args={['#1c1c1c']} />
      <fog attach="fog" args={['#1c1c1c', 14, 40]} />

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>

      <ClockFace />
      <Gear position={[-3.2, 1.6, -8.6]} radius={1.05} teeth={9} dir={1} speed={0.4} />
      <Gear position={[3.2, 1.6, -8.6]} radius={0.85} teeth={7} dir={-1} speed={0.5} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      <pointLight position={[0, 3, -9]} color="#fbbf24" intensity={0.7} distance={12} />

      <StoneFloor />
    </group>
  )
}
