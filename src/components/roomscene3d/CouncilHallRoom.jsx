import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Candle, StoneFloor, Banner } from './kit'
import { Runner } from './shell'
import { woodTextures, stoneTextures } from '../three/textures'

/**
 * 3D take on floor 10, "La Sala del Consejo": a throne room. A grand
 * high-backed throne on a stepped dais, framed by velvet drapes under the
 * rose window, with a jewelled crown hovering and turning above it; the
 * long council table with its high-backed chairs, goblets and candelabra;
 * a red runner leading up to the throne between heraldic banners.
 */

const GOLD = new THREE.MeshStandardMaterial({ color: '#d4a64a', metalness: 0.9, roughness: 0.28 })
const VELVET = new THREE.MeshPhysicalMaterial({ color: '#8b1a2b', roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#ff8fa3'), sheenRoughness: 0.4 })

function Throne() {
  const wood = useMemo(() => woodTextures(1, 1), [])
  const stone = useMemo(() => stoneTextures(1.2, 0.3), [])
  return (
    <group position={[0, 0, -11.6]}>
      {/* Stepped dais */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.3, 0.3 - i * 0.45]} receiveShadow castShadow>
          <boxGeometry args={[5.2 - i * 1.2, 0.3, 2.6 - i * 0.9]} />
          <meshStandardMaterial {...stone} color="#c9b08a" roughness={0.85} />
        </mesh>
      ))}
      <group position={[0, 0.6, 0]}>
        {/* Tall back with pointed crest */}
        <mesh position={[0, 2.1, -0.4]} castShadow>
          <boxGeometry args={[1.9, 3.4, 0.3]} />
          <meshStandardMaterial {...wood} color="#5a2e14" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2, -0.24]} material={VELVET}>
          <boxGeometry args={[1.45, 2.8, 0.08]} />
        </mesh>
        <mesh position={[0, 4.05, -0.4]} rotation={[0, 0, Math.PI / 4]} material={GOLD}>
          <boxGeometry args={[0.7, 0.7, 0.26]} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <group key={x}>
            <mesh position={[x, 2.1, -0.4]} material={GOLD}>
              <cylinderGeometry args={[0.09, 0.09, 3.4, 10]} />
            </mesh>
            <mesh position={[x, 3.95, -0.4]} material={GOLD}>
              <sphereGeometry args={[0.16, 12, 10]} />
            </mesh>
          </group>
        ))}
        {/* Seat + cushion */}
        <mesh position={[0, 0.45, 0.2]} castShadow>
          <boxGeometry args={[1.9, 0.9, 1.2]} />
          <meshStandardMaterial {...wood} color="#5a2e14" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.98, 0.22]} material={VELVET} scale={[1, 0.35, 1]}>
          <boxGeometry args={[1.5, 0.5, 1]} />
        </mesh>
        {/* Arms */}
        {[-0.95, 0.95].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.2, 0.2]}>
              <boxGeometry args={[0.22, 0.12, 1.2]} />
              <meshStandardMaterial {...wood} color="#6b3a1a" />
            </mesh>
            <mesh position={[x, 1.25, 0.8]} material={GOLD}>
              <sphereGeometry args={[0.12, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

/** Velvet drapes hanging either side of the throne, gently swaying. */
function Drapes() {
  const refs = useRef([])
  useFrame((state) => {
    refs.current.forEach((m, i) => {
      if (m) m.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + i * 2) * 0.012
    })
  })
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.2, 6.4, 24, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 7) * 0.12)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      {[-2.6, 2.6].map((x, i) => (
        <group key={x} ref={(el) => (refs.current[i] = el)} position={[x, 7.3, -13.25]}>
          <mesh geometry={geo} position={[0, -3.2, 0]} material={VELVET} />
          <mesh position={[0, -3.8, 0.15]} rotation={[0, 0, Math.PI / 2]} material={GOLD}>
            <torusGeometry args={[0.35, 0.05, 6, 16, Math.PI]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function FloatingCrown() {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = 5.6 + Math.sin(t * 0.9) * 0.12
      ref.current.rotation.y = t * 0.6
    }
  })
  const jewels = ['#ef4444', '#3b82f6', '#22c55e', '#ef4444', '#a855f7']
  return (
    <group ref={ref} position={[0, 5.6, -11.6]}>
      <mesh material={GOLD}>
        <cylinderGeometry args={[0.42, 0.46, 0.28, 24, 1, true]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i}>
            <mesh position={[Math.sin(a) * 0.42, 0.26, Math.cos(a) * 0.42]} material={GOLD}>
              <coneGeometry args={[0.08, 0.26, 4]} />
            </mesh>
            <mesh position={[Math.sin(a) * 0.44, 0.4, Math.cos(a) * 0.44]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshBasicMaterial color={new THREE.Color(jewels[i]).multiplyScalar(3)} toneMapped={false} />
            </mesh>
            <mesh position={[Math.sin(a + 0.63) * 0.46, 0, Math.cos(a + 0.63) * 0.46]}>
              <octahedronGeometry args={[0.06, 0]} />
              <meshBasicMaterial color={new THREE.Color(jewels[(i + 2) % 5]).multiplyScalar(2.5)} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
      <pointLight color="#fbbf24" intensity={4} distance={6} />
    </group>
  )
}

function Chair({ position, rotation }) {
  const wood = useMemo(() => woodTextures(0.6, 0.6), [])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.6]} />
        <meshStandardMaterial {...wood} color="#5a2e14" />
      </mesh>
      <mesh position={[0, 0.54, 0]} material={VELVET}>
        <boxGeometry args={[0.52, 0.06, 0.52]} />
      </mesh>
      <mesh position={[0, 1.15, -0.27]}>
        <boxGeometry args={[0.6, 1.3, 0.08]} />
        <meshStandardMaterial {...wood} color="#5a2e14" />
      </mesh>
      {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]}>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color="#3f1f0c" />
        </mesh>
      ))}
    </group>
  )
}

function CouncilTable() {
  const wood = useMemo(() => woodTextures(3, 1), [])
  return (
    <group position={[0, 0, -6]}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.14, 1.9]} />
        <meshStandardMaterial {...wood} color="#6b3a1a" roughness={0.55} />
      </mesh>
      {[[-3.2, -0.75], [3.2, -0.75], [-3.2, 0.75], [3.2, 0.75]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <cylinderGeometry args={[0.1, 0.08, 0.72, 10]} />
          <meshStandardMaterial color="#3f1f0c" />
        </mesh>
      ))}
      {/* Chairs along the back side, facing the room */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <Chair key={x} position={[x, 0, -1.3]} rotation={0} />
      ))}
      {/* Goblets */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <group key={x} position={[x, 0.85, -0.4]}>
          <mesh position={[0, 0.02, 0]} material={GOLD}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 10]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={GOLD}>
            <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          </mesh>
          <mesh position={[0, 0.22, 0]} material={GOLD}>
            <cylinderGeometry args={[0.08, 0.04, 0.14, 12, 1, true]} />
          </mesh>
        </group>
      ))}
      {/* Candelabra: one real light, the rest glow */}
      {[-1.6, 1.6].map((x, i) => (
        <group key={x} position={[x, 0.85, 0.2]}>
          <mesh position={[0, 0.25, 0]} material={GOLD}>
            <cylinderGeometry args={[0.03, 0.08, 0.5, 8]} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={GOLD}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
          </mesh>
          {[-0.28, 0, 0.28].map((cx) => (
            <Candle key={cx} position={[cx, 0.5, 0]} scale={0.8} light={i === 0 && cx === 0} />
          ))}
        </group>
      ))}
    </group>
  )
}

export default function CouncilHallRoom({ accent = '#f59e0b' }) {
  return (
    <group>
      <color attach="background" args={['#1c0a00']} />
      <fog attach="fog" args={['#1c0a00', 16, 42]} />

      <Drapes />
      <Throne />
      <FloatingCrown />
      <CouncilTable />

      <Banner position={[-10, 4.4, -13.2]} color="#7f1d1d" height={3.2} width={1.6} />
      <Banner position={[10, 4.4, -13.2]} color="#7f1d1d" height={3.2} width={1.6} />

      <Runner color="#7f1d1d" border="#fbbf24" width={3.2} length={9} z={-5.5} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 5.5, -10]} color="#ffd9a0" intensity={12} distance={14} decay={1.5} />

      <StoneFloor baseColor="#3a2a1c" tileColor="#5a4430" />
    </group>
  )
}
