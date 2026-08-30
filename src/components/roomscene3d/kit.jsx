import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import particleFire from 'three-particle-fire'

/**
 * Shared building blocks for the per-floor 3D room scenes. Keeping these
 * here (instead of copy-pasting per floor) means every room automatically
 * gets the same quality bar for lighting/animation, and a floor's own file
 * only has to describe what makes that room special.
 */

// install() throws if called twice (its internal callback list is consumed
// on the first call) — guard so Vite HMR re-executing this module doesn't
// crash the scene.
if (!particleFire.Geometry) particleFire.install({ THREE })

// GPU-animated fire particles (yomotsu/three-particle-fire) — used by both
// Torch and Candle instead of the old pulsing-cone flame. It builds a plain
// THREE.Points itself (not an R3F primitive), so we construct it once and
// mount it with <primitive>, re-driving its shader clock every frame.
function Flame({ position, radius = 0.13, height = 0.6, particleCount = 50, color = '#f97316', size = 0.55 }) {
  const { camera, size: viewport } = useThree()
  const points = useMemo(() => {
    const geometry = new particleFire.Geometry(radius, height, particleCount)
    const material = new particleFire.Material({ color: new THREE.Color(color) })
    material.size = size
    material.uniforms.size.value = size
    return new THREE.Points(geometry, material)
  }, [radius, height, particleCount, color, size])

  useEffect(() => () => {
    points.geometry.dispose()
    points.material.dispose()
  }, [points])

  useEffect(() => {
    points.material.setPerspective(camera.fov, viewport.height)
  }, [points, camera.fov, viewport.height])

  useFrame((state, delta) => {
    points.material.update(delta)
  })

  return <primitive object={points} position={position} />
}

// Deterministic pseudo-random, same algorithm as SceneBackground.jsx's, so
// seeded layouts (stars, dust, orbs) are stable across renders.
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Stars({ count = 220, seed = 1, spread = 70, y = [3, 29], z = [-14, -44] }) {
  const positions = useMemo(() => {
    const r = mulberry32(seed)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * spread
      arr[i * 3 + 1] = y[0] + r() * (y[1] - y[0])
      arr[i * 3 + 2] = z[0] + r() * (z[1] - z[0])
    }
    return arr
  }, [count, seed, spread, y, z])
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

// A flickering wall/floor torch with a real point light, shared by every
// interior room theme.
export function Torch({ position, scale = 1 }) {
  const light = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (light.current) light.current.intensity = 2.2 + Math.sin(t * 10) * 0.6
  })
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <Flame position={[0, 1.02, 0]} radius={0.13} height={0.6} particleCount={50} color="#f97316" size={0.55} />
      <pointLight ref={light} position={[0, 1.3, 0.4]} color="#f59e0b" intensity={3.2} distance={8} />
    </group>
  )
}

// A short table/desk candle — same flicker language as Torch but sized for
// tabletops (council hall, portrait sconces).
export function Candle({ position, scale = 1 }) {
  const light = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (light.current) light.current.intensity = 1.4 + Math.sin(t * 12) * 0.4
  })
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 10]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <Flame position={[0, 0.4, 0]} radius={0.045} height={0.18} particleCount={20} color="#fbbf24" size={0.3} />
      <pointLight ref={light} position={[0, 0.5, 0]} color="#fbbf24" intensity={1.6} distance={4} />
    </group>
  )
}

export function DistantTower({ position, height = 4.4, radius = 1, color = '#241547' }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[radius * 2, height, radius * 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, height + height * 0.18, 0]}>
        <coneGeometry args={[radius * 1.5, height * 0.4, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

export function Window({ position, glow = '#4338ca' }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.25, 1.85, 0.22]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[0.9, 1.4]} />
        <meshBasicMaterial color={glow} />
      </mesh>
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
      <mesh position={[0, -1.02, 0.15]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1.5, 0.12, 0.35]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
    </group>
  )
}

// Small glowing orbs drifting through the room, tinted with the room's own
// accent color — the 3D equivalent of the 2D scene's AmbientOrbs. Mounted
// once, globally, by RoomScene3D so every floor gets the same per-room color
// mood without redrawing it per theme.
export function AmbientOrbs({ accent, seed = 1, count = 6, xRange = [-8, 8], zRange = [-11, 1] }) {
  const orbs = useMemo(() => {
    const r = mulberry32(seed)
    return Array.from({ length: count }, (_, i) => ({
      x: xRange[0] + r() * (xRange[1] - xRange[0]),
      baseY: 1 + r() * 3.2,
      z: zRange[0] + r() * (zRange[1] - zRange[0]),
      speed: 0.35 + r() * 0.35,
      phase: r() * Math.PI * 2,
    }))
  }, [seed, count, xRange, zRange])
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

// Fine drifting magic dust, tinted per-room — a subtle GPU-cheap layer of
// atmosphere shared by every floor (mounted once by RoomScene3D).
export function MagicDust({ color = '#a78bfa', count = 90, radius = 15, height = 9, seed = 2 }) {
  const ref = useRef()
  const { arr, speeds } = useMemo(() => {
    const r = mulberry32(seed)
    const arr = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (r() - 0.5) * radius * 2
      arr[i * 3 + 1] = r() * height
      arr[i * 3 + 2] = -13 + r() * radius
      speeds[i] = 0.15 + r() * 0.35
    }
    return { arr, speeds }
  }, [count, radius, height, seed])
  useFrame((state, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta
      if (y > height) y = 0
      pos.setY(i, y)
      pos.setX(i, arr[i * 3] + Math.sin(t * 0.3 + i) * 0.6)
    }
    pos.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color={color} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// Stone floor: a solid base plane plus a scattered grid of slightly lighter
// tiles for texture, matching every 2D scene's FloorStone treatment.
export function StoneFloor({ baseColor = '#3f3147', tileColor = '#4c3d5c', width = 40, depth = 32, z = 4 }) {
  const tiles = useMemo(() => {
    const t = []
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        t.push([-14 + col * 4 + (row % 2 ? 2 : 0), -6 + row * 3.4])
      }
    }
    return t
  }, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={baseColor} roughness={1} />
      </mesh>
      {tiles.map(([x, tz], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, tz]}>
          <planeGeometry args={[3.4, 2.6]} />
          <meshStandardMaterial color={tileColor} roughness={1} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// Battlemented back wall — the same silhouette used by the castle entrance,
// reusable by any floor that wants a crenellated skyline instead of a plain
// wall (towers, crypt exterior, etc).
export function CrenellatedWall({ z = -13, color = '#544a72', emissive = '#241c3d' }) {
  const crenellations = useMemo(() => Array.from({ length: 13 }, (_, i) => -12 + i * 2), [])
  return (
    <group>
      <mesh position={[0, 3, z]}>
        <boxGeometry args={[24, 6, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.85} emissive={emissive} emissiveIntensity={0.4} />
      </mesh>
      {crenellations.map((x, i) => (
        <mesh key={i} position={[x, 6.5, z]}>
          <boxGeometry args={[1.1, 0.9, 1.3]} />
          <meshStandardMaterial color={color} roughness={0.85} emissive={emissive} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export function Column({ position, height = 4.6, radius = 0.42, color = '#2a2140', capColor = '#3d3158' }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, height + 0.12, 0]}>
        <boxGeometry args={[radius * 2.4, 0.24, radius * 2.4]} />
        <meshStandardMaterial color={capColor} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[radius * 2.4, 0.2, radius * 2.4]} />
        <meshStandardMaterial color={capColor} />
      </mesh>
    </group>
  )
}

// A hanging cloth banner that sways gently — used by classroom/council/entry
// scenes for a bit of soft, always-moving cloth.
export function Banner({ position, color = '#7c3aed', height = 2.4, width = 1.2 }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.9 + position[0]) * 0.04
  })
  return (
    <group position={position}>
      <mesh position={[0, height / 2 + 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, width + 0.3, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>
      <group ref={ref} position={[0, height / 2, 0]}>
        <mesh position={[0, -height / 2, 0.02]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        <mesh position={[0, -height * 0.18, 0.03]}>
          <planeGeometry args={[width * 0.4, width * 0.4]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  )
}

// Pedestal + glowing crystal orb — used by the crypt and as a generic
// "magic prop" for other rooms that want a floating light source with mass.
export function GlowPedestal({ position, color = '#a78bfa', pulse = 1 }) {
  const orb = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * pulse
    if (orb.current) {
      orb.current.position.y = 1.35 + Math.sin(t * 1.3) * 0.08
      orb.current.material.opacity = 0.65 + Math.sin(t * 1.6) * 0.2
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      <mesh ref={orb} position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color={color} intensity={1.6} distance={6} />
    </group>
  )
}
