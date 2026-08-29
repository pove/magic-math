import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Torch, StoneFloor } from './kit'

/**
 * 3D take on floor 12, "La Torre de la Varita Encantada" — the castle's
 * final floor: an enchanted wand hovering above its pedestal, crackling
 * with a slow-spinning halo of sparks and a beam of light reaching for
 * the sky, since this is the last room in the whole game.
 */

function EnchantedWand() {
  const wand = useRef()
  const halo = useRef()
  const sparkRefs = useRef([])
  const sparkCount = 10

  const sparkSeeds = useMemo(
    () => Array.from({ length: sparkCount }, (_, i) => ({ a: (i / sparkCount) * Math.PI * 2, r: 0.5 + (i % 3) * 0.12 })),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (wand.current) {
      wand.current.rotation.z = 0.35 + Math.sin(t * 0.5) * 0.08
      wand.current.position.y = 2.2 + Math.sin(t * 0.8) * 0.1
    }
    if (halo.current) {
      halo.current.rotation.y = t * 0.6
      const s = 1 + Math.sin(t * 1.8) * 0.08
      halo.current.scale.set(s, s, s)
    }
    sparkSeeds.forEach((s, i) => {
      const m = sparkRefs.current[i]
      if (!m) return
      const cy = ((t * 0.6 + i * 0.4) % 2)
      m.position.set(Math.cos(t * 0.4 + s.a) * s.r, cy - 0.3, Math.sin(t * 0.4 + s.a) * s.r)
      m.material.opacity = 1 - cy / 2
    })
  })

  return (
    <group position={[0, 0, -9]}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.4, 1.8, 1.4]} />
        <meshStandardMaterial color="#292524" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[1.7, 0.24, 1.7]} />
        <meshStandardMaterial color="#44403c" />
      </mesh>

      <group ref={wand} position={[0, 2.2, 0]}>
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.5, 10]} />
          <meshStandardMaterial color="#a16207" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh ref={halo} position={[0, -0.05, 0]}>
          <torusGeometry args={[0.45, 0.03, 8, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.22} />
        </mesh>
        <pointLight position={[0, -0.05, 0]} color="#fbbf24" intensity={2.4} distance={9} />
      </group>

      {/* beam reaching up, quiet reminder this is the last room */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.05, 0.5, 10, 16, 1, true]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {Array.from({ length: sparkCount }, (_, i) => (
        <mesh key={i} ref={(el) => (sparkRefs.current[i] = el)}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#fde047" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function WizardTowerRoom({ accent = '#fbbf24' }) {
  return (
    <group>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 15, 42]} />

      <Stars seed={77} count={200} spread={70} y={[3, 30]} z={[-14, -40]} />

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#1c1405" roughness={0.9} />
      </mesh>

      <EnchantedWand />

      <Torch position={[-3.4, 0, -8]} scale={1.4} />
      <Torch position={[3.4, 0, -8]} scale={1.4} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />

      <StoneFloor />
    </group>
  )
}
