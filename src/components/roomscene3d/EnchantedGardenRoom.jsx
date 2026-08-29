import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, StoneFloor, mulberry32 } from './kit'

/**
 * 3D take on floor 4, "El Jardín Encantado": a moonlit hedge garden with
 * glowing flowers that pulse like little lanterns and fireflies weaving
 * between them.
 */

function Hedge({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[1.3, 12, 10]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
      <mesh position={[0.9, 0.6, 0.3]}>
        <sphereGeometry args={[0.9, 12, 10]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>
      <mesh position={[-0.85, 0.55, -0.2]}>
        <sphereGeometry args={[0.8, 12, 10]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
    </group>
  )
}

function GlowFlower({ position, color, phase = 0 }) {
  const bloom = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * 1.3 + phase
    if (bloom.current) {
      const s = 1 + Math.sin(t) * 0.18
      bloom.current.scale.set(s, s, s)
      bloom.current.material.opacity = 0.75 + Math.sin(t) * 0.2
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      <mesh ref={bloom} position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 0.65, 0]} color={color} intensity={0.5} distance={2.2} />
    </group>
  )
}

// Fireflies wandering on loose Lissajous-ish paths through the garden.
function Fireflies({ count = 10, seed = 3 }) {
  const flies = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: count }, () => ({
      cx: -9 + r() * 18,
      cz: -10 + r() * 12,
      radius: 0.6 + r() * 1.4,
      speed: 0.3 + r() * 0.4,
      phase: r() * Math.PI * 2,
      baseY: 0.6 + r() * 2,
    }))
  }, [count, seed])
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    flies.forEach((f, i) => {
      const m = refs.current[i]
      if (!m) return
      m.position.set(
        f.cx + Math.sin(t * f.speed + f.phase) * f.radius,
        f.baseY + Math.sin(t * f.speed * 1.7 + f.phase) * 0.4,
        f.cz + Math.cos(t * f.speed + f.phase) * f.radius
      )
      m.material.opacity = 0.5 + Math.sin(t * 3 + f.phase) * 0.5
    })
  })
  return (
    <group>
      {flies.map((f, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color="#fde047" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function EnchantedGardenRoom({ accent = '#60a5fa' }) {
  const moonGlow = useRef()
  useFrame((state) => {
    if (moonGlow.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04
      moonGlow.current.scale.set(s, s, s)
    }
  })

  const flowers = useMemo(() => {
    const r = mulberry32(41)
    const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399']
    return Array.from({ length: 10 }, (_, i) => ({
      position: [-9 + i * 2, 0, -6 + (r() - 0.5) * 3],
      color: colors[i % colors.length],
      phase: r() * Math.PI * 2,
    }))
  }, [])

  return (
    <group>
      <color attach="background" args={['#0c1445']} />
      <fog attach="fog" args={['#0c1445', 16, 44]} />

      <Stars seed={7} count={160} />

      <mesh position={[8, 12, -30]}>
        <sphereGeometry args={[1.6, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" />
      </mesh>
      <mesh ref={moonGlow} position={[8, 12, -30.3]}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.16} />
      </mesh>

      {/* back hedge wall */}
      <mesh position={[0, 2, -13]}>
        <boxGeometry args={[26, 4, 1]} />
        <meshStandardMaterial color="#0f2818" roughness={1} />
      </mesh>

      <Hedge position={[-10, 0, -8]} scale={1.3} />
      <Hedge position={[-4, 0, -9]} scale={1.05} />
      <Hedge position={[5, 0, -9]} scale={1.15} />
      <Hedge position={[10.5, 0, -8]} scale={1.25} />

      {flowers.map((f, i) => (
        <GlowFlower key={i} {...f} />
      ))}

      <Fireflies />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 6, -12]} color="#93c5fd" intensity={0.7} distance={16} />

      <StoneFloor baseColor="#12241a" tileColor="#1c3524" />
    </group>
  )
}
