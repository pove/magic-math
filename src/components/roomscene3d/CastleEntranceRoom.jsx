import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 3D take on the floor-1 "CastleEntrance" 2D scene (SceneBackground.jsx):
 * purple night sky, moon, distant towers, a battlemented wall with a
 * glowing arched gate flanked by torches, and a stone floor. Pure
 * procedural geometry, no assets — mirrors the 2D scene's palette so the
 * room reads as "the same place" in both view modes.
 */

function Stars({ count = 220 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70
      arr[i * 3 + 1] = 3 + Math.random() * 26
      arr[i * 3 + 2] = -14 - Math.random() * 30
    }
    return arr
  }, [count])
  const mat = useRef()
  useFrame((state) => {
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.4) * 0.3
  })
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={mat} size={0.14} color="#ffffff" transparent sizeAttenuation depthWrite={false} />
    </points>
  )
}

function DistantTower({ position, height = 4.4, radius = 1 }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[radius * 2, height, radius * 2]} />
        <meshStandardMaterial color="#241547" />
      </mesh>
      <mesh position={[0, height + height * 0.18, 0]}>
        <coneGeometry args={[radius * 1.5, height * 0.4, 4]} />
        <meshStandardMaterial color="#241547" />
      </mesh>
    </group>
  )
}

function Torch({ position }) {
  const flame = useRef()
  const light = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (flame.current) flame.current.scale.set(1 + Math.sin(t * 9) * 0.15, 1 + Math.sin(t * 13 + 1) * 0.2, 1)
    if (light.current) light.current.intensity = 2.2 + Math.sin(t * 10) * 0.6
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
      </mesh>
      <mesh ref={flame} position={[0, 1.25, 0]}>
        <coneGeometry args={[0.24, 0.68, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      <mesh position={[0, 1.16, 0]} scale={0.55}>
        <coneGeometry args={[0.24, 0.68, 8]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
      <pointLight ref={light} position={[0, 1.3, 0.4]} color="#f59e0b" intensity={3.2} distance={8} />
    </group>
  )
}

function Window({ position }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.25, 1.85, 0.22]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshBasicMaterial color="#4338ca" />
      </mesh>
      {/* cross mullion */}
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[0.9, 0.06]} />
        <meshBasicMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[0.06, 1.4]} />
        <meshBasicMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[position[0] > 0 ? -0.22 : 0.22, 0.32, 0.14]}>
        <circleGeometry args={[0.13, 16]} />
        <meshBasicMaterial color="#fef9c3" />
      </mesh>
      {/* sill */}
      <mesh position={[0, -1.02, 0.15]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1.5, 0.12, 0.35]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
    </group>
  )
}

// Small glowing orbs drifting in the courtyard, tinted with the room's
// accent color — the 3D equivalent of the 2D scene's AmbientOrbs, so each
// room in the floor gets its own color mood without redrawing the geometry.
function AmbientOrbs({ accent }) {
  const orbs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: -6 + i * 2.3 + (i % 2 ? 0.6 : -0.4),
        baseY: 1.2 + (i % 3) * 0.9,
        z: -9 + (i % 4) * 2.4,
        speed: 0.4 + (i % 3) * 0.15,
        phase: i * 1.1,
      })),
    []
  )
  const refs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    orbs.forEach((o, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * 0.6
      mesh.material.opacity = 0.35 + Math.sin(t * o.speed * 1.3 + o.phase) * 0.2
    })
  })
  return (
    <group>
      {orbs.map((o, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[o.x, o.baseY, o.z]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshBasicMaterial color={accent} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Gate() {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 1.7
    const straightH = 2.2
    s.moveTo(-w, 0)
    s.lineTo(-w, straightH)
    s.absarc(0, straightH, w, Math.PI, 0, true)
    s.lineTo(w, 0)
    s.closePath()
    return s
  }, [])
  // Slightly larger twin of the doorway shape, used as a thin gold rim
  // peeking out from behind it — stands in for the 2D scene's stroked border.
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

  return (
    <group position={[0, 0, -12.3]}>
      {/* gold rim: a wider copy of the doorway sitting further back in the
          wall, so it only peeks out around the edges of the darker door
          shape sitting in front of it — a stand-in for the 2D scene's
          stroked border. */}
      <mesh position={[0, 0, -0.2]}>
        <extrudeGeometry args={[rimShape, { depth: 0.42, bevelEnabled: false }]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>
      <mesh>
        <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: false }]} />
        <meshBasicMaterial color="#1c1022" />
      </mesh>
      <pointLight position={[0, 1.6, 1.6]} color="#fbbf24" intensity={2} distance={7} />
    </group>
  )
}

export default function CastleEntranceRoom({ accent = '#fbbf24' }) {
  const moonGlow = useRef()
  useFrame((state) => {
    if (moonGlow.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04
      moonGlow.current.scale.set(s, s, s)
    }
  })

  const crenellations = useMemo(() => Array.from({ length: 13 }, (_, i) => -12 + i * 2), [])
  const floorTiles = useMemo(() => {
    const tiles = []
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        tiles.push([-14 + col * 4 + (row % 2 ? 2 : 0), -6 + row * 3.4])
      }
    }
    return tiles
  }, [])

  return (
    <group>
      <color attach="background" args={['#1a0533']} />
      <fog attach="fog" args={['#1a0533', 16, 46]} />

      <Stars />

      {/* moon */}
      <mesh position={[9, 11, -28]}>
        <sphereGeometry args={[1.7, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" />
      </mesh>
      <mesh ref={moonGlow} position={[9, 11, -28.3]}>
        <sphereGeometry args={[2.4, 24, 24]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.18} />
      </mesh>

      <DistantTower position={[-14, 0, -20]} height={5} radius={1.1} />
      <DistantTower position={[14, 0, -21]} height={4.4} radius={1} />

      {/* castle wall + battlements */}
      <mesh position={[0, 3, -13]}>
        <boxGeometry args={[24, 6, 1.2]} />
        <meshStandardMaterial color="#544a72" roughness={0.85} emissive="#241c3d" emissiveIntensity={0.4} />
      </mesh>
      {crenellations.map((x, i) => (
        <mesh key={i} position={[x, 6.5, -13]}>
          <boxGeometry args={[1.1, 0.9, 1.3]} />
          <meshStandardMaterial color="#544a72" roughness={0.85} emissive="#241c3d" emissiveIntensity={0.4} />
        </mesh>
      ))}

      <Gate />
      <Torch position={[-2, 0, -11.8]} />
      <Torch position={[2, 0, -11.8]} />

      <Window position={[-6.5, 3.6, -12.5]} />
      <Window position={[6.5, 3.6, -12.5]} />

      <AmbientOrbs accent={accent} />
      <pointLight position={[0, 5, 2]} color={accent} intensity={0.6} distance={20} />

      {/* stone floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
        <planeGeometry args={[40, 32]} />
        <meshStandardMaterial color="#3f3147" roughness={1} />
      </mesh>
      {floorTiles.map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]}>
          <planeGeometry args={[3.4, 2.6]} />
          <meshStandardMaterial color="#4c3d5c" roughness={1} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}
