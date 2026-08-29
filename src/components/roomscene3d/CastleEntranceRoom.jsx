import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, Torch, DistantTower, Window, CrenellatedWall, StoneFloor, Banner } from './kit'

/**
 * 3D take on the floor-1 "CastleEntrance" 2D scene (SceneBackground.jsx):
 * purple night sky, moon, distant towers, a battlemented wall with a
 * glowing arched gate flanked by torches, and a stone floor. Pure
 * procedural geometry, no assets — mirrors the 2D scene's palette so the
 * room reads as "the same place" in both view modes.
 *
 * On mount the great gate swings open and a shaft of golden light spills
 * out onto the courtyard — timed to land right as the camera's own flight
 * settles, so arriving here feels like the castle is welcoming you in
 * rather than a static postcard.
 */

// Two door leaves that swing open on mount, revealing a warm glow behind —
// this is what makes the entrance feel alive instead of a painted backdrop.
function Gate() {
  const leftDoor = useRef()
  const rightDoor = useRef()
  const glow = useRef()
  const glowLight = useRef()
  const startRef = useRef(null)

  const leafShape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 1.72
    const straightH = 2.2
    s.moveTo(0, 0)
    s.lineTo(0, straightH)
    s.absarc(0, straightH, w, Math.PI, Math.PI / 2, true)
    s.lineTo(w, 0)
    s.closePath()
    return s
  }, [])
  const rimShape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 1.85
    const straightH = 2.2
    s.moveTo(-w, 0)
    s.lineTo(-w, straightH)
    s.absarc(0, straightH, w, Math.PI, 0, true)
    s.lineTo(w, 0)
    s.closePath()
    return s
  }, [])

  useFrame((state) => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - startRef.current
    // Ease-out swing over ~2.2s, starting a beat after the room appears.
    const t = Math.min(1, Math.max(0, (elapsed - 0.4) / 1.8))
    const eased = 1 - (1 - t) ** 3
    const angle = eased * 1.45
    if (leftDoor.current) leftDoor.current.rotation.y = angle
    if (rightDoor.current) rightDoor.current.rotation.y = -angle
    if (glow.current) glow.current.material.opacity = 0.15 + eased * 0.55 + Math.sin(state.clock.elapsedTime * 2.4) * 0.08
    if (glowLight.current) glowLight.current.intensity = eased * 3.2
  })

  return (
    <group position={[0, 0, -12.3]}>
      {/* gold rim: a wider copy of the doorway sitting further back in the
          wall, so it only peeks out around the edges of the door leaves. */}
      <mesh position={[0, 0, -0.2]}>
        <extrudeGeometry args={[rimShape, { depth: 0.42, bevelEnabled: false }]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>
      {/* warm light spilling from inside, revealed as the doors swing */}
      <mesh ref={glow} position={[0, 1.5, -0.05]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={glowLight} position={[0, 1.6, -0.6]} color="#fde68a" intensity={0} distance={9} />

      {/* two hinged door leaves */}
      <group ref={leftDoor} position={[0, 0, 0.28]}>
        <mesh>
          <extrudeGeometry args={[leafShape, { depth: 0.22, bevelEnabled: false }]} />
          <meshStandardMaterial color="#1c1022" roughness={0.75} />
        </mesh>
        <mesh position={[0.86, 1.1, 0.23]}>
          <boxGeometry args={[0.08, 1.8, 0.04]} />
          <meshStandardMaterial color="#78350f" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>
      <group ref={rightDoor} position={[0, 0, 0.28]} scale={[-1, 1, 1]}>
        <mesh>
          <extrudeGeometry args={[leafShape, { depth: 0.22, bevelEnabled: false }]} />
          <meshStandardMaterial color="#1c1022" roughness={0.75} />
        </mesh>
        <mesh position={[0.86, 1.1, 0.23]}>
          <boxGeometry args={[0.08, 1.8, 0.04]} />
          <meshStandardMaterial color="#78350f" metalness={0.3} roughness={0.6} />
        </mesh>
      </group>

      <pointLight position={[0, 1.6, 1.6]} color="#fbbf24" intensity={2} distance={7} />
    </group>
  )
}

// A pair of bats tracing a lazy figure-eight across the sky — cheap, tiny
// silhouettes that make the sky read as inhabited rather than a static dome.
function Bats() {
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((m, i) => {
      if (!m) return
      const speed = 0.35 + i * 0.08
      const a = t * speed + i * 2.4
      m.position.set(Math.sin(a) * 9 + i * 3 - 3, 9 + Math.sin(a * 2) * 1.4, -24 + Math.cos(a) * 6)
      m.rotation.y = -a
      const flap = 1 + Math.sin(t * 14 + i) * 0.4
      m.scale.set(1, flap, 1)
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <coneGeometry args={[0.35, 0.12, 3]} />
          <meshBasicMaterial color="#0b0620" />
        </mesh>
      ))}
    </group>
  )
}

export default function CastleEntranceRoom({ accent = '#fbbf24' }) {
  const moonGlow = useRef()
  const reflection = useRef()
  useFrame((state) => {
    if (moonGlow.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04
      moonGlow.current.scale.set(s, s, s)
    }
    if (reflection.current) {
      reflection.current.material.opacity = 0.06 + Math.sin(state.clock.elapsedTime * 1.1) * 0.02
    }
  })

  return (
    <group>
      <color attach="background" args={['#1a0533']} />
      <fog attach="fog" args={['#1a0533', 16, 46]} />

      <Stars seed={11} />

      {/* moon */}
      <mesh position={[9, 11, -28]}>
        <sphereGeometry args={[1.7, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" />
      </mesh>
      <mesh ref={moonGlow} position={[9, 11, -28.3]}>
        <sphereGeometry args={[2.4, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.18} />
      </mesh>

      <Bats />
      <DistantTower position={[-14, 0, -20]} height={5} radius={1.1} />
      <DistantTower position={[14, 0, -21]} height={4.4} radius={1} />

      <CrenellatedWall />

      <Gate />
      <Torch position={[-2, 0, -11.8]} />
      <Torch position={[2, 0, -11.8]} />
      <Banner position={[-3.6, 3.6, -12.1]} color="#7f1d1d" />
      <Banner position={[3.6, 3.6, -12.1]} color="#7f1d1d" />

      <Window position={[-6.5, 3.6, -12.5]} />
      <Window position={[6.5, 3.6, -12.5]} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.6} distance={20} />
      {/* soft rim light from behind, separating silhouettes from the sky */}
      <pointLight position={[0, 6, -14]} color="#c4b5fd" intensity={1.2} distance={16} />

      <StoneFloor />
      {/* faint sheen hinting the stone reflects the gate light */}
      <mesh ref={reflection} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -6]}>
        <planeGeometry args={[6, 8]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.08} />
      </mesh>
    </group>
  )
}
