import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { StoneFloor } from './kit'
import { SkyShaderDome } from '../castle3d/SkyDome'
import { glowTexture } from '../three/textures'

/**
 * 3D take on floor 9, "El Observatorio": an open-air terrace at the top of
 * the castle under the full night sky — nebula, aurora and twinkling
 * stars — with a ringed planet turning overhead, shooting stars, a brass
 * telescope trained on the planet, a clockwork orrery whose planets circle
 * a glowing sun, and a star compass inlaid in the floor.
 */

const BRASS = new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 0.9, roughness: 0.3 })

function RingedPlanet() {
  const planet = useRef()
  const ring = useRef()
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const ctx = c.getContext('2d')
    for (let y = 0; y < 128; y++) {
      const band = Math.sin(y * 0.25) * 0.5 + Math.sin(y * 0.07 + 1) * 0.5
      const l = 52 + band * 10
      ctx.fillStyle = `hsl(${32 + band * 8}, 80%, ${l}%)`
      ctx.fillRect(0, y, 256, 1)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (planet.current) planet.current.rotation.y = t * 0.15
    if (ring.current) ring.current.rotation.z = 0.35 + Math.sin(t * 0.1) * 0.02
  })
  return (
    <group position={[8, 11, -30]}>
      <mesh ref={planet}>
        <sphereGeometry args={[3, 48, 32]} />
        <meshStandardMaterial map={tex} roughness={0.7} emissive="#f59e0b" emissiveIntensity={0.25} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
        <ringGeometry args={[4, 5.4, 64]} />
        <meshBasicMaterial color={[1.4, 1.2, 0.8]} transparent opacity={0.7} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight color="#fbbf24" intensity={20} distance={30} />
    </group>
  )
}

// A streak of light that periodically shoots across the sky.
function ShootingStar({ seed = 0 }) {
  const ref = useRef()
  const startRef = useRef(Math.random() * 6)
  useFrame((state) => {
    const cycle = 6
    const t = (state.clock.elapsedTime + seed * 2.7 + startRef.current) % cycle
    const active = t < 1.2
    if (ref.current) {
      ref.current.visible = active
      const p = t / 1.2
      ref.current.position.set(-16 + p * 30, 16 - p * 7, -26 + seed * 3)
      ref.current.material.opacity = active ? 1 - p : 0
    }
  })
  return (
    <mesh ref={ref} rotation={[0, 0, -0.35]}>
      <planeGeometry args={[2.2, 0.06]} />
      <meshBasicMaterial color={[3, 3, 3]} transparent opacity={1} toneMapped={false} />
    </mesh>
  )
}

/** Brass refracting telescope on a tripod, slowly tracking the planet. */
function Telescope({ position }) {
  const tube = useRef()
  useFrame((state) => {
    if (tube.current) tube.current.rotation.z = -0.75 + Math.sin(state.clock.elapsedTime * 0.15) * 0.05
  })
  return (
    <group position={position} rotation={[0, -0.6, 0]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, 0.8, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}>
            <cylinderGeometry args={[0.04, 0.05, 1.65, 8]} />
            <meshStandardMaterial color="#5c3a1e" roughness={0.7} />
          </mesh>
        )
      })}
      <mesh position={[0, 1.6, 0]} material={BRASS}>
        <sphereGeometry args={[0.16, 12, 10]} />
      </mesh>
      <group ref={tube} position={[0, 1.65, 0]}>
        <mesh position={[0, 1, 0]} material={BRASS} castShadow>
          <cylinderGeometry args={[0.2, 0.13, 2.2, 20]} />
        </mesh>
        {[0.2, 1, 1.8].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={BRASS}>
            <torusGeometry args={[0.2 - y * 0.02, 0.03, 6, 20]} />
          </mesh>
        ))}
        <mesh position={[0, 2.12, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 20]} />
          <meshBasicMaterial color={[0.8, 1.4, 2.4]} toneMapped={false} />
        </mesh>
        <mesh position={[0.25, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={BRASS}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        </mesh>
      </group>
    </group>
  )
}

/** Clockwork orrery: planets on brass arms circling a glowing sun. */
function Orrery({ position }) {
  const arms = useRef([])
  const planets = [
    { r: 0.55, size: 0.08, color: '#94a3b8', speed: 1.6 },
    { r: 0.85, size: 0.11, color: '#f59e0b', speed: 1.1 },
    { r: 1.15, size: 0.12, color: '#3b82f6', speed: 0.8 },
    { r: 1.5, size: 0.1, color: '#ef4444', speed: 0.55 },
  ]
  const glow = glowTexture()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    arms.current.forEach((g, i) => {
      if (g) g.rotation.y = t * planets[i].speed + i
    })
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} material={BRASS}>
        <cylinderGeometry args={[0.35, 0.5, 0.9, 16]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={BRASS}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
      </mesh>
      <group position={[0, 1.25, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 20, 16]} />
          <meshBasicMaterial color={[3, 2.2, 0.8]} toneMapped={false} />
        </mesh>
        <sprite scale={[1.6, 1.6, 1]}>
          <spriteMaterial map={glow} color="#fbbf24" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        {planets.map((p, i) => (
          <group key={i} ref={(el) => (arms.current[i] = el)}>
            <mesh position={[p.r / 2, -0.02 * i, 0]} rotation={[0, 0, Math.PI / 2]} material={BRASS}>
              <cylinderGeometry args={[0.012, 0.012, p.r, 4]} />
            </mesh>
            <mesh position={[p.r, -0.02 * i, 0]}>
              <sphereGeometry args={[p.size, 14, 10]} />
              <meshStandardMaterial color={p.color} roughness={0.5} emissive={p.color} emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={BRASS}>
          <torusGeometry args={[1.5, 0.015, 4, 48]} />
        </mesh>
      </group>
      <pointLight position={[0, 1.3, 0]} color="#fbbf24" intensity={4} distance={5} />
    </group>
  )
}

/** Compass-rose mosaic inlaid in the terrace floor, its lines glowing. */
function StarCompass({ position }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')
    ctx.translate(256, 256)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.lineWidth = 5
    ;[240, 200, 120].forEach((r) => {
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    })
    for (let i = 0; i < 8; i++) {
      const long = i % 2 === 0
      const a = (i / 8) * Math.PI * 2
      const r = long ? 235 : 150
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      ctx.lineTo(Math.cos(a + 0.18) * 40, Math.sin(a + 0.18) * 40)
      ctx.lineTo(Math.cos(a - 0.18) * 40, Math.sin(a - 0.18) * 40)
      ctx.closePath()
      ctx.globalAlpha = long ? 0.9 : 0.55
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(Math.cos(a) * 220, Math.sin(a) * 220, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const mat = useRef()
  useFrame((state) => {
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15
  })
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[7, 7]} />
      <meshBasicMaterial ref={mat} map={tex} color={[0.6, 1.1, 2]} transparent opacity={0.6} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

export default function ObservatoryRoom({ accent = '#06b6d4' }) {
  const shootingStars = useMemo(() => [0, 1, 2], [])
  return (
    <group>
      <color attach="background" args={['#05030f']} />
      <fog attach="fog" args={['#0b0a24', 30, 80]} />

      <SkyShaderDome radius={200} />
      <RingedPlanet />
      {shootingStars.map((s) => (
        <ShootingStar key={s} seed={s} />
      ))}

      <Telescope position={[4.8, 0, -7.5]} />
      <Orrery position={[-2.2, 0, -9.5]} />
      <StarCompass position={[1.5, 0.02, -4]} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.55} distance={22} />
      <pointLight position={[0, 6, -6]} color="#a5b4fc" intensity={8} distance={18} decay={1.5} />

      <StoneFloor baseColor="#1a2040" tileColor="#2a3462" />
    </group>
  )
}
