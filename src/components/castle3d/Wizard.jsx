import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'

/**
 * Tiny low-poly wizard standing on the current floor, gently floating
 * and bobbing his wand. Pure procedural — no assets.
 */
export default function Wizard({ position = [0, 0, 0] }) {
  const wand = useRef()

  useFrame((state) => {
    if (wand.current) {
      wand.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.4
    }
  })

  return (
    <Float speed={2} floatIntensity={0.6} rotationIntensity={0.2}>
      <group position={position} scale={1.4}>
        {/* Robe */}
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.55, 1.4, 10]} />
          <meshStandardMaterial color="#4c1d95" roughness={0.7} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#fcd9b8" roughness={0.6} />
        </mesh>
        {/* Beard */}
        <mesh position={[0, 1.42, 0.18]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.22, 0.6, 8]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.9} />
        </mesh>
        {/* Hat */}
        <mesh position={[0, 2.15, 0]}>
          <coneGeometry args={[0.42, 0.9, 10]} />
          <meshStandardMaterial color="#5b21b6" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.08, 12]} />
          <meshStandardMaterial color="#5b21b6" roughness={0.7} />
        </mesh>
        {/* Wand arm */}
        <group ref={wand} position={[0.5, 1.2, 0.1]}>
          <mesh position={[0.25, 0.25, 0]} rotation={[0, 0, -0.8]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
            <meshStandardMaterial color="#713f12" roughness={0.8} />
          </mesh>
          <mesh position={[0.62, 0.62, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshBasicMaterial color="#fde68a" />
          </mesh>
        </group>
      </group>
    </Float>
  )
}
