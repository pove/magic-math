import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Candle, StoneFloor, Banner } from './kit'

/**
 * 3D take on floor 10, "La Sala del Consejo": a throne room with a long
 * candle-lit table and a golden crown that hovers and slowly spins above
 * the royal seat.
 */

function Throne() {
  return (
    <group position={[0, 0, -11]}>
      <mesh position={[0, 1.6, -0.35]}>
        <boxGeometry args={[2.1, 3.2, 0.3]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, 0.15]}>
        <boxGeometry args={[1.8, 0.3, 1]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.95, 1, 0.15]}>
        <boxGeometry args={[0.22, 0.7, 0.9]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.95, 1, 0.15]}>
        <boxGeometry args={[0.22, 0.7, 0.9]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {[-0.85, 0, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 3.3, -0.35]}>
          <coneGeometry args={[0.18, 0.4, 4]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function FloatingCrown() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = 3.9 + Math.sin(t * 0.9) * 0.12
      ref.current.rotation.y = t * 0.6
    }
  })
  return (
    <group ref={ref} position={[0, 3.9, -11]}>
      <mesh>
        <cylinderGeometry args={[0.32, 0.36, 0.22, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.32, 0.2, Math.cos(a) * 0.32]}>
            <coneGeometry args={[0.06, 0.16, 4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
          </mesh>
        )
      })}
      <pointLight color="#fbbf24" intensity={1} distance={5} />
    </group>
  )
}

function CouncilTable() {
  const candleXs = [-2.4, 0, 2.4]
  return (
    <group position={[0, 0, -4.5]}>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[6.4, 0.14, 2.2]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.7} />
      </mesh>
      {[[-2.9, -0.9], [2.9, -0.9], [-2.9, 0.9], [2.9, 0.9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.16, 0.72, 0.16]} />
          <meshStandardMaterial color="#3f2d1e" />
        </mesh>
      ))}
      {candleXs.map((x, i) => (
        <Candle key={i} position={[x, 0.79, 0]} />
      ))}
    </group>
  )
}

export default function CouncilHallRoom({ accent = '#f59e0b' }) {
  return (
    <group>
      <color attach="background" args={['#1c0a00']} />
      <fog attach="fog" args={['#1c0a00', 14, 40]} />

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>

      <Throne />
      <FloatingCrown />
      <CouncilTable />

      <Banner position={[-9, 3.6, -12]} color="#7f1d1d" />
      <Banner position={[9, 3.6, -12]} color="#7f1d1d" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5]}>
        <planeGeometry args={[4.4, 13]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -5]}>
        <ringGeometry args={[2, 2.15, 4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
      </mesh>

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 4, -11]} color="#fca5a5" intensity={0.6} distance={14} />

      <StoneFloor />
    </group>
  )
}
