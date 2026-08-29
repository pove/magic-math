import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { StoneFloor, Banner } from './kit'

/**
 * 3D take on floor 6, "El Aula de Hechizos": a chalkboard scrawled with a
 * glowing "star + star = sparkle" equation, hovering slightly and sparkling
 * as if a wand had just finished writing it, above a row of desks with
 * open spellbooks.
 */

function starShape(outer = 1, inner = 0.42) {
  const s = new THREE.Shape()
  const points = 5
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

function SpinningStar({ position, scale = 1, color = '#fefce8' }) {
  const shape = useMemo(() => starShape(), [])
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.6
      const s = scale * (1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.06)
      ref.current.scale.set(s, s, s)
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <extrudeGeometry args={[shape, { depth: 0.08, bevelEnabled: false }]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Blackboard() {
  const group = useRef()
  useFrame((state) => {
    if (group.current) group.current.position.y = 4.9 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08
  })
  return (
    <group ref={group} position={[0, 4.9, -11.6]}>
      <mesh>
        <boxGeometry args={[6, 3.4, 0.28]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[5.6, 3, 0.06]} />
        <meshStandardMaterial color="#14532d" roughness={0.9} />
      </mesh>
      <SpinningStar position={[-1.6, 0, 0.22]} scale={0.55} />
      <mesh position={[-0.6, -0.03, 0.22]}>
        <boxGeometry args={[0.5, 0.09, 0.03]} />
        <meshBasicMaterial color="#fefce8" />
      </mesh>
      <mesh position={[-0.6, -0.03, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.5, 0.09, 0.03]} />
        <meshBasicMaterial color="#fefce8" />
      </mesh>
      <SpinningStar position={[0.3, 0, 0.22]} scale={0.55} />
      <mesh position={[1.2, -0.03, 0.22]}>
        <boxGeometry args={[0.5, 0.09, 0.03]} />
        <meshBasicMaterial color="#fefce8" />
      </mesh>
      <SpinningStar position={[2, 0.05, 0.22]} scale={0.4} color="#a7f3d0" />
    </group>
  )
}

function Desk({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[-0.48, 0.29, -0.28]}>
        <boxGeometry args={[0.1, 0.58, 0.1]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      <mesh position={[0.48, 0.29, -0.28]}>
        <boxGeometry args={[0.1, 0.58, 0.1]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      <mesh position={[-0.48, 0.29, 0.28]}>
        <boxGeometry args={[0.1, 0.58, 0.1]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      <mesh position={[0.48, 0.29, 0.28]}>
        <boxGeometry args={[0.1, 0.58, 0.1]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.44, 0.09, 0.32]} />
        <meshStandardMaterial color="#7c3aed" />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.44, 0.02, 0.32]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  )
}

function RisingSparkles() {
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < 6; i++) {
      const m = refs.current[i]
      if (!m) continue
      const cy = ((t * 0.4 + i * 0.35) % 1.6)
      m.position.set(Math.cos(i * 1.4) * 1.6, 2.5 + cy, -9 + Math.sin(i * 1.7) * 0.6)
      m.material.opacity = 0.9 * (1 - cy / 1.6)
    }
  })
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export default function SpellClassroomRoom({ accent = '#3b82f6' }) {
  return (
    <group>
      <color attach="background" args={['#0c1445']} />
      <fog attach="fog" args={['#0c1445', 14, 40]} />

      <mesh position={[0, 3.6, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.9} />
      </mesh>

      <Blackboard />
      <RisingSparkles />

      <Desk position={[-3.2, 0, -6.5]} />
      <Desk position={[0, 0, -6]} />
      <Desk position={[3.2, 0, -6.5]} />

      <Banner position={[-9, 3.6, -12]} color="#1e3a8a" />
      <Banner position={[9, 3.6, -12]} color="#1e3a8a" />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 5, -10]} color="#93c5fd" intensity={0.9} distance={14} />

      <StoneFloor />
    </group>
  )
}
