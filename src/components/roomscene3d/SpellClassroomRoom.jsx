import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { Banner } from './kit'
import { WoodFloor } from './shell'
import { woodTextures } from '../three/textures'

/**
 * 3D take on floor 6, "El Aula de Hechizos": a big slate blackboard covered
 * in chalk sums that light up one after another as if an invisible wand
 * were going over them, the teacher's desk with an hourglass and a wand,
 * two rows of pupils' desks with glowing spellbooks, quills and ink, and a
 * globe spinning in the corner.
 */

function starShape(outer = 1, inner = 0.42) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return s
}

const SUMS = ['3 × 4 = 12', '7 + 5 = 12', '20 ÷ 4 = 5', '9 − 6 = 3', '6 × 6 = 36']

function Blackboard() {
  const lines = useRef([])
  const star = useMemo(() => starShape(), [])
  const starRef = useRef()
  const wood = useMemo(() => woodTextures(2, 0.3), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    // One sum at a time glows as if being traced by a wand
    const active = Math.floor(t / 1.6) % SUMS.length
    lines.current.forEach((m, i) => {
      if (!m) return
      const target = i === active ? 2.2 : 0.9
      m.color.lerp(new THREE.Color(target, target, target * 0.95), 0.08)
    })
    if (starRef.current) starRef.current.rotation.z = t * 0.6
  })
  return (
    <group position={[0, 4.3, -13.2]}>
      <mesh castShadow>
        <boxGeometry args={[8.4, 4.4, 0.25]} />
        <meshStandardMaterial {...wood} color="#6b4226" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[7.9, 3.9]} />
        <meshStandardMaterial color="#1f3a2c" roughness={0.95} />
      </mesh>
      {/* Chalk ledge with a few sticks of chalk */}
      <mesh position={[0, -2.15, 0.3]}>
        <boxGeometry args={[8.2, 0.1, 0.35]} />
        <meshStandardMaterial {...wood} color="#6b4226" />
      </mesh>
      {[-2.5, -2.2, 1.8].map((x, i) => (
        <mesh key={i} position={[x, -2.07, 0.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.25, 6]} />
          <meshStandardMaterial color={['#ffffff', '#fde68a', '#f9a8d4'][i]} />
        </mesh>
      ))}
      {SUMS.map((s, i) => (
        <Text
          key={s}
          position={[i % 2 ? 1.9 : -1.7, 1.35 - i * 0.62, 0.16]}
          fontSize={0.42}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
        >
          {s}
          <meshBasicMaterial ref={(el) => (lines.current[i] = el?.color ? el : lines.current[i])} color="#e8efe9" toneMapped={false} />
        </Text>
      ))}
      <mesh ref={starRef} position={[3.2, 1.2, 0.17]} scale={0.3}>
        <extrudeGeometry args={[star, { depth: 0.05, bevelEnabled: false }]} />
        <meshBasicMaterial color={[2.4, 2.2, 1.2]} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Desk({ position, bookColor = '#7c3aed', rotation = 0 }) {
  const wood = useMemo(() => woodTextures(1, 0.3), [])
  const pages = useRef()
  useFrame((state) => {
    if (pages.current) pages.current.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3
  })
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.78, 0]} rotation={[0.12, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.85]} />
        <meshStandardMaterial {...wood} color="#8a5a34" roughness={0.7} />
      </mesh>
      {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]}>
          <boxGeometry args={[0.08, 0.76, 0.08]} />
          <meshStandardMaterial color="#4a2f1a" />
        </mesh>
      ))}
      {/* Bench */}
      <mesh position={[0, 0.45, 0.85]}>
        <boxGeometry args={[1.5, 0.08, 0.4]} />
        <meshStandardMaterial {...wood} color="#7a4e2c" />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 0.22, 0.85]}>
          <boxGeometry args={[0.08, 0.44, 0.34]} />
          <meshStandardMaterial color="#4a2f1a" />
        </mesh>
      ))}
      {/* Open spellbook with glowing pages */}
      <group position={[-0.15, 0.86, 0]} rotation={[0.12, 0, 0]}>
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[0.72, 0.03, 0.46]} />
          <meshStandardMaterial color={bookColor} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.17, 0.02, 0]} rotation={[0, 0, s * -0.1]}>
            <boxGeometry args={[0.32, 0.03, 0.42]} />
            <meshStandardMaterial ref={s === 1 ? pages : undefined} color="#fdf6e3" emissive="#fde68a" emissiveIntensity={0.6} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* Inkwell + quill */}
      <mesh position={[0.5, 0.88, -0.15]}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 10]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.3} roughness={0.2} />
      </mesh>
      <mesh position={[0.52, 1.02, -0.13]} rotation={[0.3, 0, -0.35]}>
        <coneGeometry args={[0.05, 0.4, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
    </group>
  )
}

function TeacherDesk({ position }) {
  const wood = useMemo(() => woodTextures(2, 0.5), [])
  const sand = useRef()
  useFrame((state) => {
    if (sand.current) sand.current.rotation.z = state.clock.elapsedTime % 12 < 0.6 ? Math.PI * ((state.clock.elapsedTime % 12) / 0.6) : 0
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.1, 1]} />
        <meshStandardMaterial {...wood} color="#5c3a1e" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[2.8, 0.08, 1.15]} />
        <meshStandardMaterial {...wood} color="#7a4e2c" roughness={0.6} />
      </mesh>
      {/* Hourglass */}
      <group ref={sand} position={[-0.8, 1.45, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * 0.14, 0]} rotation={[s > 0 ? Math.PI : 0, 0, 0]}>
            <coneGeometry args={[0.13, 0.26, 12]} />
            <meshStandardMaterial color="#fde68a" transparent opacity={0.55} roughness={0.1} emissive="#fbbf24" emissiveIntensity={0.3} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * 0.3, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 12]} />
            <meshStandardMaterial color="#6b4226" />
          </mesh>
        ))}
      </group>
      {/* Stack of books + a wand */}
      {['#b91c1c', '#1d4ed8', '#15803d'].map((c, i) => (
        <mesh key={c} position={[0.6, 1.23 + i * 0.12, 0]} rotation={[0, i * 0.2, 0]}>
          <boxGeometry args={[0.7, 0.11, 0.5]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.1, 1.2, 0.3]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.025, 0.7, 6]} />
        <meshStandardMaterial color="#3b2412" />
      </mesh>
      <mesh position={[-0.2, 1.2, 0.47]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshBasicMaterial color={[3, 2.6, 1]} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Globe({ position }) {
  const ref = useRef()
  useFrame((state, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.4
  })
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 0.85, roughness: 0.3 }), [])
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} material={brass}>
        <cylinderGeometry args={[0.05, 0.25, 1, 10]} />
      </mesh>
      <group position={[0, 1.35, 0]} rotation={[0, 0, 0.4]}>
        <mesh ref={ref}>
          <sphereGeometry args={[0.45, 24, 16]} />
          <meshStandardMaterial color="#1e6091" roughness={0.5} emissive="#0b3d5c" emissiveIntensity={0.3} />
        </mesh>
        <mesh material={brass}>
          <torusGeometry args={[0.52, 0.02, 6, 32]} />
        </mesh>
      </group>
    </group>
  )
}

function RisingSparkles() {
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < 8; i++) {
      const m = refs.current[i]
      if (!m) continue
      const cy = (t * 0.4 + i * 0.35) % 1.6
      m.position.set(Math.cos(i * 1.4) * 2.6, 2.4 + cy * 1.5, -11.5 + Math.sin(i * 1.7) * 0.4)
      m.material.opacity = 0.9 * (1 - cy / 1.6)
    }
  })
  return (
    <group>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={[3, 2.8, 1]} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function SpellClassroomRoom({ accent = '#3b82f6' }) {
  return (
    <group>
      <color attach="background" args={['#0c1445']} />
      <fog attach="fog" args={['#0c1445', 16, 42]} />

      <Blackboard />
      <RisingSparkles />
      <TeacherDesk position={[2.2, 0, -10.6]} />

      <Desk position={[-3.4, 0, -7]} bookColor="#7c3aed" />
      <Desk position={[0, 0, -7]} bookColor="#be123c" />
      <Desk position={[3.4, 0, -7]} bookColor="#0f766e" />
      <Desk position={[-3.4, 0, -4.4]} bookColor="#1d4ed8" />
      <Desk position={[0, 0, -4.4]} bookColor="#ca8a04" />
      <Desk position={[3.4, 0, -4.4]} bookColor="#7c3aed" />

      <Globe position={[7.5, 0, -10]} />

      <Banner position={[-10.8, 4.2, -13.2]} color="#1e3a8a" />
      <Banner position={[10.8, 4.2, -13.2]} color="#1e3a8a" />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 5.5, -9]} color="#dbeafe" intensity={10} distance={14} decay={1.5} />

      <WoodFloor color="#7a5230" />
    </group>
  )
}
