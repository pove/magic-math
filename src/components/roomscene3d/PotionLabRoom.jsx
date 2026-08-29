import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { StoneFloor } from './kit'

/**
 * 3D take on floor 3, "El Laboratorio de Pociones": a bubbling green
 * cauldron centerpiece surrounded by shelves of glowing potion jars, each
 * one popping a slow bubble of light.
 */

const JAR_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24']

function Jar({ position, color }) {
  const bubble = useRef()
  const seed = useMemo(() => Math.random() * Math.PI * 2, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime + seed
    if (bubble.current) {
      const cy = (Math.sin(t * 0.8) * 0.5 + 0.5)
      bubble.current.position.y = 0.42 + cy * 0.35
      bubble.current.material.opacity = 0.8 * (1 - cy)
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.32, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 10]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh ref={bubble} position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <pointLight position={[0, 0.2, 0.2]} color={color} intensity={0.5} distance={2.4} />
    </group>
  )
}

function ShelfWithJars({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[7.6, 0.14, 0.5]} />
        <meshStandardMaterial color="#3f2d1e" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <Jar key={i} position={[-3.3 + i * 0.95, 0.07, 0]} color={JAR_COLORS[i % JAR_COLORS.length]} />
      ))}
    </group>
  )
}

// The centerpiece: a big cauldron with a glowing bubbling brew, rising
// magic bubbles, and flickering fire underneath.
function Cauldron() {
  const brew = useRef()
  const bubbleRefs = useRef([])
  const fireRefs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (brew.current) brew.current.scale.y = 1 + Math.sin(t * 2) * 0.06
    ;[[-1.1, 0], [0.3, 1.1], [1.4, 0.4]].forEach(([bx], i) => {
      const m = bubbleRefs.current[i]
      if (!m) return
      const cy = (t * (0.5 + i * 0.15) + i * 2) % 1.3
      m.position.set(bx, 0.15 + cy, 0)
      m.material.opacity = 0.8 * (1 - cy / 1.3)
    })
    fireRefs.current.forEach((m, i) => {
      if (!m) return
      m.scale.y = 1 + Math.sin(t * 8 + i * 2) * 0.25
      m.material.opacity = 0.85 + Math.sin(t * 9 + i) * 0.15
    })
  })
  return (
    <group position={[0, 0, -8]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.55, 1.1, 0.28, 20]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[1.35, 0.7, 1, 20, 1, true]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.5} side={2} />
      </mesh>
      <mesh ref={brew} position={[0, 0.93, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.18, 20]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.7} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (bubbleRefs.current[i] = el)} position={[0, 1, 0]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshBasicMaterial color="#6ee7b7" transparent opacity={0.8} />
        </mesh>
      ))}
      {[-0.7, 0, 0.7].map((fx, i) => (
        <mesh key={i} ref={(el) => (fireRefs.current[i] = el)} position={[fx, 0.05, 0]}>
          <coneGeometry args={[0.22, 0.4, 8]} />
          <meshBasicMaterial color="#f97316" transparent opacity={1} />
        </mesh>
      ))}
      <pointLight position={[0, 1.4, 0.6]} color="#10b981" intensity={2.6} distance={11} />
      <pointLight position={[0, 0.1, 0.4]} color="#f97316" intensity={1.4} distance={5} />
    </group>
  )
}

export default function PotionLabRoom({ accent = '#10b981' }) {
  return (
    <group>
      <color attach="background" args={['#041f14']} />
      <fog attach="fog" args={['#041f14', 13, 38]} />

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} />
      </mesh>

      <ShelfWithJars position={[0, 3.2, -12.2]} />
      <ShelfWithJars position={[0, 5.1, -12.2]} />

      <Cauldron />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      <pointLight position={[0, 2.5, -3]} color="#34d399" intensity={0.6} distance={16} />

      <StoneFloor />
    </group>
  )
}
