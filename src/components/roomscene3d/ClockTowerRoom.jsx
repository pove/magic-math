import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { WoodFloor } from './shell'

/**
 * 3D take on floor 7, "La Torre del Reloj": inside the clockwork. The back
 * wall is the great clock face seen from behind — warm light pouring
 * through frosted glass, the Roman numerals and hands in silhouette —
 * surrounded by a wall of meshing brass gears, with a pendulum swinging
 * below and counterweights rising and falling on their chains.
 */

const BRASS = new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.9, roughness: 0.32 })
const IRON = new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: 0.8, roughness: 0.45 })

/** Toothed gear outline with a hub hole and round spoke cut-outs. */
function gearGeometry(radius, teeth, depth = 0.18) {
  const s = new THREE.Shape()
  const tooth = Math.min(0.22, radius * 0.18)
  const steps = teeth * 4
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const r = i % 4 === 1 || i % 4 === 2 ? radius + tooth : radius
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  const hub = new THREE.Path()
  hub.absarc(0, 0, radius * 0.14, 0, Math.PI * 2, true)
  s.holes.push(hub)
  const spokes = radius > 0.7 ? 5 : 4
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    const h = new THREE.Path()
    h.absarc(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55, radius * 0.22, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 12 })
  g.translate(0, 0, -depth / 2)
  return g
}

function Gear({ position, radius = 1, teeth = 12, speed = 0.3, material = BRASS }) {
  const ref = useRef()
  const geo = useMemo(() => gearGeometry(radius, teeth), [radius, teeth])
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed
  })
  return (
    <group position={position}>
      <mesh ref={ref} geometry={geo} material={material} castShadow />
      {/* Axle */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={IRON}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.12, 0.5, 12]} />
      </mesh>
    </group>
  )
}

const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

function ClockFace({ position, radius = 2.8 }) {
  const hour = useRef()
  const minute = useRef()
  const glass = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (minute.current) minute.current.rotation.z = -t * 0.35
    if (hour.current) hour.current.rotation.z = -t * 0.03
    if (glass.current) glass.current.emissiveIntensity = 1.3 + Math.sin(t * 0.5) * 0.1
  })
  return (
    <group position={position}>
      {/* Backlit frosted glass */}
      <mesh>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial ref={glass} color="#fde7b0" emissive="#fbbf5a" emissiveIntensity={1.3} roughness={0.6} />
      </mesh>
      {/* Iron rim and inner ring */}
      <mesh position={[0, 0, 0.05]} material={IRON}>
        <torusGeometry args={[radius, 0.16, 12, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.05]} material={IRON}>
        <torusGeometry args={[radius * 0.62, 0.05, 8, 48]} />
      </mesh>
      {/* Numerals in silhouette */}
      {NUMERALS.map((n, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <Text key={n} position={[Math.sin(a) * radius * 0.8, Math.cos(a) * radius * 0.8, 0.06]} fontSize={0.34} color="#1c1714" anchorX="center" anchorY="middle">
            {n}
          </Text>
        )
      })}
      {/* Hands */}
      <group ref={hour} position={[0, 0, 0.1]}>
        <mesh position={[0, radius * 0.25, 0]} material={IRON}>
          <boxGeometry args={[0.16, radius * 0.5, 0.05]} />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.14]}>
        <mesh position={[0, radius * 0.36, 0]} material={IRON}>
          <boxGeometry args={[0.1, radius * 0.72, 0.05]} />
        </mesh>
        <mesh position={[0, radius * 0.7, 0]} rotation={[0, 0, Math.PI / 4]} material={IRON}>
          <boxGeometry args={[0.2, 0.2, 0.05]} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.18]} material={BRASS}>
        <sphereGeometry args={[0.16, 14, 10]} />
      </mesh>
      <pointLight position={[0, 0, 2.2]} color="#fbbf5a" intensity={14} distance={12} decay={1.5} />
    </group>
  )
}

function Pendulum({ position }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.2) * 0.32
  })
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, -0.8, 0]} material={BRASS}>
        <cylinderGeometry args={[0.035, 0.035, 1.6, 8]} />
      </mesh>
      <mesh position={[0, -1.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={BRASS}>
        <cylinderGeometry args={[0.38, 0.38, 0.1, 28]} />
      </mesh>
    </group>
  )
}

/** Counterweights on chains, one rising while the other falls. */
function Weights() {
  const a = useRef()
  const b = useRef()
  useFrame((state) => {
    const y = Math.sin(state.clock.elapsedTime * 0.25) * 1.2
    if (a.current) a.current.position.y = 4 + y
    if (b.current) b.current.position.y = 4 - y
  })
  const chain = (x) => (
    <mesh position={[x, 6, -12.3]} material={IRON}>
      <cylinderGeometry args={[0.03, 0.03, 4.2, 4]} />
    </mesh>
  )
  return (
    <group>
      {chain(-3.9)}
      {chain(3.9)}
      <mesh ref={a} position={[-3.9, 4, -12.3]} material={IRON}>
        <cylinderGeometry args={[0.28, 0.28, 1, 12]} />
      </mesh>
      <mesh ref={b} position={[3.9, 4, -12.3]} material={IRON}>
        <cylinderGeometry args={[0.28, 0.28, 1, 12]} />
      </mesh>
    </group>
  )
}

export default function ClockTowerRoom({ accent = '#d97706' }) {
  return (
    <group>
      <color attach="background" args={['#1c1c1c']} />
      <fog attach="fog" args={['#1c1c1c', 16, 42]} />

      <ClockFace position={[0, 4.9, -13.3]} />
      <Pendulum position={[0, 2.05, -13.1]} />
      <Weights />

      {/* A wall of meshing gears around the face */}
      <Gear position={[-4.7, 6.3, -13.1]} radius={1.2} teeth={14} speed={0.35} />
      <Gear position={[-2.75, 7.3, -13]} radius={0.6} teeth={8} speed={-0.7} material={IRON} />
      <Gear position={[-4.4, 2.8, -13.1]} radius={0.95} teeth={11} speed={-0.44} />
      <Gear position={[4.9, 6.1, -13.1]} radius={1.45} teeth={16} speed={-0.28} />
      <Gear position={[4.6, 2.5, -13.1]} radius={1.05} teeth={12} speed={0.38} material={IRON} />
      <Gear position={[7.1, 4.3, -13.05]} radius={0.75} teeth={9} speed={-0.55} />
      <Gear position={[-6.6, 7.2, -13.05]} radius={0.7} teeth={9} speed={0.6} material={IRON} />
      {/* Big floor gear turning on its side */}
      <group position={[5.5, 0.12, -8.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <Gear position={[0, 0, 0]} radius={1.6} teeth={18} speed={0.2} />
      </group>

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />

      <WoodFloor color="#6b4a2e" />
    </group>
  )
}
