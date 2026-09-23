import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { StoneFloor, Flame } from './kit'
import GlowParticles from '../three/GlowParticles'
import { woodTextures, glowTexture } from '../three/textures'

/**
 * 3D take on floor 3, "El Laboratorio de Pociones": a big bubbling cauldron
 * over a crackling fire, breathing green magic vapour, in front of shelves
 * of glowing potion jars; an alchemist's workbench with flasks and an open
 * grimoire, and bundles of herbs drying from the ceiling beams.
 */

const JAR_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa']

// Potions glow through their glass (emissive → bloom) instead of each
// carrying its own point light, which cost 16 lights before.
function Jar({ position, color, shape = 0 }) {
  const bubble = useRef()
  const seed = useMemo(() => Math.random() * Math.PI * 2, [])
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, transparent: true, opacity: 0.85, roughness: 0.15 }), [color])
  useFrame((state) => {
    const t = state.clock.elapsedTime + seed
    if (bubble.current) {
      const cy = Math.sin(t * 0.8) * 0.5 + 0.5
      bubble.current.position.y = 0.42 + cy * 0.35
      bubble.current.material.opacity = 0.8 * (1 - cy)
    }
    glass.emissiveIntensity = 1.2 + Math.sin(t * 1.3) * 0.3
  })
  return (
    <group position={position}>
      {shape === 0 ? (
        <mesh position={[0, 0.16, 0]} material={glass}>
          <cylinderGeometry args={[0.16, 0.18, 0.32, 12]} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.15, 0]} material={glass}>
            <sphereGeometry args={[0.17, 14, 12]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={glass}>
            <cylinderGeometry args={[0.05, 0.06, 0.14, 8]} />
          </mesh>
        </>
      )}
      <mesh position={[0, shape === 0 ? 0.35 : 0.43, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.07, 8]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      <mesh ref={bubble} position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function ShelfWithJars({ position, count = 8, width = 7.6, seed = 0 }) {
  const wood = useMemo(() => woodTextures(3, 0.2), [])
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.14, 0.55]} />
        <meshStandardMaterial {...wood} color="#6b4a2e" roughness={0.8} />
      </mesh>
      {[-width / 2 + 0.2, width / 2 - 0.2].map((x) => (
        <mesh key={x} position={[x, -0.3, -0.1]}>
          <boxGeometry args={[0.12, 0.5, 0.35]} />
          <meshStandardMaterial color="#3f2d1e" />
        </mesh>
      ))}
      {Array.from({ length: count }, (_, i) => (
        <Jar
          key={i}
          position={[-width / 2 + 0.5 + i * ((width - 1) / (count - 1)), 0.07, 0]}
          color={JAR_COLORS[(i + seed) % JAR_COLORS.length]}
          shape={(i + seed) % 3 === 0 ? 1 : 0}
        />
      ))}
    </group>
  )
}

// The centerpiece: a big iron cauldron on legs over a real particle fire,
// its brew glowing and heaving, bubbles popping and vapour rising.
function Cauldron() {
  const brew = useRef()
  const bubbleRefs = useRef([])
  const fireLight = useRef()
  const brewLight = useRef()
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2f38', metalness: 0.75, roughness: 0.4 }), [])
  const pot = useMemo(() => {
    // Round-bellied pot: lathe of a bulging profile, open at the top
    const pts = [[0.2, 0], [0.9, 0.12], [1.35, 0.5], [1.45, 0.95], [1.3, 1.35], [1.38, 1.45]].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  const map = glowTexture()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (brew.current) {
      brew.current.position.y = 1.52 + Math.sin(t * 2) * 0.03
      brew.current.material.emissiveIntensity = 1.8 + Math.sin(t * 3.1) * 0.35
    }
    ;[-0.6, 0.3, 0.8, -0.1].forEach((bx, i) => {
      const m = bubbleRefs.current[i]
      if (!m) return
      const cy = (t * (0.45 + i * 0.12) + i * 0.7) % 1
      m.position.set(bx, 1.56 + cy * 0.3, (i % 2 ? 0.4 : -0.3))
      m.scale.setScalar(0.6 + cy)
      m.material.opacity = 0.9 * (1 - cy)
    })
    if (fireLight.current) fireLight.current.intensity = 5 + Math.sin(t * 11) * 1 + Math.sin(t * 17) * 0.6
    if (brewLight.current) brewLight.current.intensity = 9 + Math.sin(t * 2.3) * 1.5
  })
  return (
    <group position={[0, 0, -7.5]}>
      {/* Legs */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5
        return (
          <mesh key={i} position={[Math.cos(a) * 0.95, 0.35, Math.sin(a) * 0.95]} rotation={[Math.sin(a) * -0.25, 0, Math.cos(a) * 0.25]} material={iron}>
            <cylinderGeometry args={[0.07, 0.1, 0.8, 8]} />
          </mesh>
        )
      })}
      <mesh geometry={pot} position={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial attach="material" color="#2b2f38" metalness={0.75} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Rim + handles */}
      <mesh position={[0, 1.65, 0]} rotation={[Math.PI / 2, 0, 0]} material={iron}>
        <torusGeometry args={[1.36, 0.08, 10, 40]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.5, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} material={iron}>
          <torusGeometry args={[0.2, 0.04, 8, 16]} />
        </mesh>
      ))}
      <mesh ref={brew} position={[0, 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={2} roughness={0.2} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => (bubbleRefs.current[i] = el)}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color={[0.5, 2.4, 1.4]} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
      <sprite position={[0, 1.6, 0]} scale={[4.2, 2.4, 1]}>
        <spriteMaterial map={map} color="#34d399" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* Magic vapour rising from the brew */}
      <GlowParticles count={70} radius={[0, 1.1]} height={[1.4, 5.5]} colors={['#6ee7b7', '#a7f3d0', '#34d399']} size={0.22} rise={0.55} wander={0.35} brightness={2.2} seed={3} />
      {/* Fire under the pot: logs + particle flames */}
      {[-0.3, 0.3].map((z, i) => (
        <mesh key={i} position={[0, 0.1, z]} rotation={[0, i ? 0.6 : -0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.12, 1.3, 8]} />
          <meshStandardMaterial color="#3b2412" roughness={0.9} />
        </mesh>
      ))}
      <Flame position={[-0.3, 0.12, 0.1]} radius={0.25} height={0.55} particleCount={45} color="#f97316" size={0.7} />
      <Flame position={[0.3, 0.12, -0.1]} radius={0.25} height={0.5} particleCount={45} color="#fb923c" size={0.7} />
      <pointLight ref={brewLight} position={[0, 2.2, 0.4]} color="#34d399" intensity={9} distance={12} />
      <pointLight ref={fireLight} position={[0, 0.3, 1]} color="#f97316" intensity={5} distance={6} />
    </group>
  )
}

/** Alchemist's workbench: flasks, a coiled alembic, an open grimoire. */
function Workbench({ position }) {
  const wood = useMemo(() => woodTextures(2, 0.4), [])
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#bae6fd', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.45 }), [])
  return (
    <group position={position} rotation={[0, -0.35, 0]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 1.3]} />
        <meshStandardMaterial {...wood} color="#7a5230" roughness={0.8} />
      </mesh>
      {[[-1.45, -0.5], [1.45, -0.5], [-1.45, 0.5], [1.45, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.47, z]}>
          <boxGeometry args={[0.14, 0.95, 0.14]} />
          <meshStandardMaterial color="#4a2f1a" />
        </mesh>
      ))}
      {/* Flasks */}
      {[
        [-1.1, '#f472b6', 0.22],
        [-0.7, '#fbbf24', 0.16],
        [0.9, '#60a5fa', 0.2],
      ].map(([x, c, r], i) => (
        <group key={i} position={[x, 1.07, -0.2 + i * 0.15]}>
          <mesh position={[0, r, 0]}>
            <sphereGeometry args={[r, 16, 12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.5} transparent opacity={0.85} roughness={0.1} />
          </mesh>
          <mesh position={[0, r * 2 + 0.12, 0]} material={glassMat}>
            <cylinderGeometry args={[0.04, 0.05, 0.28, 8]} />
          </mesh>
        </group>
      ))}
      {/* Open grimoire */}
      <group position={[0.1, 1.1, 0.2]} rotation={[-0.1, 0.2, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.26, 0.02, 0]} rotation={[0, 0, s * -0.12]}>
            <boxGeometry args={[0.5, 0.04, 0.66]} />
            <meshStandardMaterial color="#f5ecd7" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[1.08, 0.03, 0.72]} />
          <meshStandardMaterial color="#5b2130" roughness={0.7} />
        </mesh>
      </group>
      {/* Mortar & pestle */}
      <mesh position={[1.35, 1.17, 0.3]}>
        <cylinderGeometry args={[0.16, 0.11, 0.2, 12]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Bundles of herbs hanging from the beams, swaying gently. */
function Herbs() {
  const refs = useRef([])
  const spots = useMemo(() => [[-4.5, -9.5], [-2.2, -10.5], [2.4, -10.5], [4.8, -9.5], [-6, -4.5], [6, -4.5]], [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.rotation.z = Math.sin(t * 0.8 + i) * 0.05
    })
  })
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[x, 7.2, z]}>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
            <meshStandardMaterial color="#6b5a3a" />
          </mesh>
          <mesh position={[0, -1.25, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.28, 0.7, 7]} />
            <meshStandardMaterial color={i % 2 ? '#4d7c0f' : '#65a30d'} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function PotionLabRoom({ accent = '#10b981' }) {
  return (
    <group>
      <color attach="background" args={['#041f14']} />
      <fog attach="fog" args={['#041f14', 16, 42]} />

      <ShelfWithJars position={[0, 3.1, -13.1]} />
      <ShelfWithJars position={[0, 4.6, -13.1]} seed={2} />
      <ShelfWithJars position={[0, 6.1, -13.1]} count={7} seed={4} />

      <Cauldron />
      <Workbench position={[6, 0, -6.5]} />
      <Herbs />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />

      <StoneFloor baseColor="#1d2a24" tileColor="#34463c" />
    </group>
  )
}
