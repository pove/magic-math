import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { stoneTextures, woodTextures, glowTexture } from '../three/textures'

/**
 * Richer shared set pieces for the 3D rooms: the back-wall door the player
 * walks in through, a candle chandelier, a stained-glass rose window and an
 * ornate rug. All procedural.
 */

function archShape(w, h) {
  const s = new THREE.Shape()
  const r = w / 2
  s.moveTo(-r, 0)
  s.lineTo(r, 0)
  s.lineTo(r, h - r)
  s.absarc(0, h - r, r, 0, Math.PI, false)
  s.lineTo(-r, 0)
  return s
}

/** One door leaf: the half of an arch between x=0 (hinge side) and x=w
 *  (the centre line, where the two leaves meet under the arch's apex). */
function leafShape(w, h) {
  const s = new THREE.Shape()
  const r = w // the arch spans both leaves, so its radius is one leaf wide
  s.moveTo(0, 0)
  s.lineTo(w, 0)
  s.lineTo(w, h)
  // Arch from the apex back down to the spring line on the hinge side,
  // centred on the door's centre line
  const steps = 16
  for (let i = 1; i <= steps; i++) {
    const a = Math.PI / 2 + (i / steps) * (Math.PI / 2)
    s.lineTo(w + Math.cos(a) * r, h - r + Math.sin(a) * r)
  }
  s.lineTo(0, 0)
  return s
}

/**
 * Arched double door set into the back wall, with a warm glow waiting
 * behind it. `openRef.current` (0 = shut … 1 = wide open) is read every
 * frame, so the entrance choreography can swing it without re-rendering.
 */
export function Door({ position = [0, 0, -13.2], width = 2.6, height = 4.2, glow = '#ffc46b', openRef, frame = '#6a6288', frameless = false }) {
  const left = useRef()
  const right = useRef()
  const light = useRef()
  const glowPlane = useRef()
  const wood = useMemo(() => woodTextures(0.45, 0.25), [])
  const stone = useMemo(() => stoneTextures(0.35, 0.35), [])
  const frameGeo = useMemo(() => {
    const outer = archShape(width + 1.1, height + 0.55)
    outer.holes.push(archShape(width, height))
    return new THREE.ExtrudeGeometry(outer, { depth: 0.5, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 24 })
  }, [width, height])
  const leafGeo = useMemo(
    () => new THREE.ExtrudeGeometry(leafShape(width / 2, height), { depth: 0.12, bevelEnabled: false, curveSegments: 16 }),
    [width, height]
  )
  const glowGeo = useMemo(() => new THREE.ShapeGeometry(archShape(width, height), 24), [width, height])
  const glowColor = useMemo(() => new THREE.Color(glow), [glow])

  useFrame((state) => {
    const open = openRef?.current ?? 0
    const a = open * 1.7
    if (left.current) left.current.rotation.y = a
    if (right.current) right.current.rotation.y = -a
    if (light.current) light.current.intensity = open * 12
    if (glowPlane.current) {
      const flicker = 0.9 + Math.sin(state.clock.elapsedTime * 6) * 0.05
      glowPlane.current.material.color.copy(glowColor).multiplyScalar(0.25 + open * 2.2 * flicker)
    }
  })

  return (
    <group position={position}>
      {/* Warm light waiting behind the door */}
      <mesh ref={glowPlane} geometry={glowGeo} position={[0, 0, -0.05]}>
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      {!frameless && (
        <>
          <mesh geometry={frameGeo} position={[0, 0, -0.1]} castShadow receiveShadow>
            <meshStandardMaterial {...stone} color={frame} roughness={0.9} />
          </mesh>
          {/* Keystone */}
          <mesh position={[0, height + 0.3, 0.3]}>
            <boxGeometry args={[0.45, 0.6, 0.3]} />
            <meshStandardMaterial {...stone} color={frame} roughness={0.9} />
          </mesh>
        </>
      )}
      <group ref={left} position={[-width / 2, 0, 0.05]}>
        <mesh geometry={leafGeo}>
          <meshStandardMaterial {...wood} color="#8a5a34" roughness={0.8} />
        </mesh>
        {[0.8, height - 1.2].map((y) => (
          <mesh key={y} position={[width / 4, y, 0.14]}>
            <boxGeometry args={[width / 2 - 0.1, 0.1, 0.03]} />
            <meshStandardMaterial color="#26222c" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[width / 2 - 0.22, height * 0.42, 0.16]}>
          <torusGeometry args={[0.1, 0.022, 8, 16]} />
          <meshStandardMaterial color="#d4b35a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <group ref={right} position={[width / 2, 0, 0.05]} scale={[-1, 1, 1]}>
        <mesh geometry={leafGeo}>
          <meshStandardMaterial {...wood} color="#7a4e2c" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {[0.8, height - 1.2].map((y) => (
          <mesh key={y} position={[width / 4, y, 0.14]}>
            <boxGeometry args={[width / 2 - 0.1, 0.1, 0.03]} />
            <meshStandardMaterial color="#26222c" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[width / 2 - 0.22, height * 0.42, 0.16]}>
          <torusGeometry args={[0.1, 0.022, 8, 16]} />
          <meshStandardMaterial color="#d4b35a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, height * 0.45, 1.2]} color={glow} intensity={0} distance={10} />
    </group>
  )
}

/** Iron ring chandelier with candles, hanging from the ceiling on chains. */
export function Chandelier({ position = [0, 6.2, -5], radius = 1.3, candles = 8, color = '#ffc46b', light = 16 }) {
  const ref = useRef()
  const flameMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4), toneMapped: false }), [color])
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#23202a', metalness: 0.7, roughness: 0.45 }), [])
  const wax = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5ecd7', roughness: 0.6 }), [])
  const map = glowTexture()
  const lightRef = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) ref.current.rotation.z = Math.sin(t * 0.6) * 0.015
    if (lightRef.current) lightRef.current.intensity = light * (0.93 + Math.sin(t * 9) * 0.04 + Math.sin(t * 13.7) * 0.03)
  })
  return (
    <group ref={ref} position={position}>
      {/* Chains up to the ceiling */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius * 0.5, 1.1, Math.sin(a) * radius * 0.5]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]} material={iron}>
            <cylinderGeometry args={[0.02, 0.02, 2.3, 4]} />
          </mesh>
        )
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={iron}>
        <torusGeometry args={[radius, 0.06, 8, 40]} />
      </mesh>
      <mesh position={[0, -0.2, 0]} material={iron}>
        <sphereGeometry args={[0.18, 12, 10]} />
      </mesh>
      {Array.from({ length: candles }, (_, i) => {
        const a = (i / candles) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <mesh position={[0, 0.16, 0]} material={wax}>
              <cylinderGeometry args={[0.045, 0.05, 0.3, 8]} />
            </mesh>
            <mesh position={[0, 0.37, 0]} scale={[1, 1.8, 1]} material={flameMat}>
              <sphereGeometry args={[0.04, 8, 6]} />
            </mesh>
            <sprite position={[0, 0.38, 0]} scale={[0.5, 0.5, 1]}>
              <spriteMaterial map={map} color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        )
      })}
      <pointLight ref={lightRef} position={[0, 0.2, 0]} color={color} intensity={light} distance={18} decay={1.5} />
    </group>
  )
}

/** Circular stained-glass window: coloured petals of glowing glass in a
 *  stone tracery ring. */
export function RoseWindow({ position = [0, 5.8, -13.3], radius = 1.6, colors = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399'], frame = '#6a6288', intensity = 1.6 }) {
  const petals = 12
  const stone = useMemo(() => stoneTextures(0.3, 0.3), [])
  return (
    <group position={position}>
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2
        const c = colors[i % colors.length]
        return (
          <mesh key={i} rotation={[0, 0, a]}>
            <circleGeometry args={[radius * 0.92, 8, 0, (Math.PI * 2) / petals]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={intensity} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
      {/* Tracery: spokes, inner and outer rings */}
      {Array.from({ length: petals }, (_, i) => (
        <mesh key={i} rotation={[0, 0, (i / petals) * Math.PI * 2]} position={[0, 0, 0.04]}>
          <boxGeometry args={[radius * 1.85, 0.07, 0.08]} />
          <meshStandardMaterial {...stone} color={frame} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[radius * 0.35, 0.08, 8, 32]} />
        <meshStandardMaterial {...stone} color={frame} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[radius * 0.3, 24]} />
        <meshStandardMaterial color={colors[2 % colors.length]} emissive={colors[2 % colors.length]} emissiveIntensity={intensity * 1.3} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[radius, 0.18, 10, 48]} />
        <meshStandardMaterial {...stone} color={frame} roughness={0.9} />
      </mesh>
    </group>
  )
}

let rugCache = new Map()
function rugTexture(color, border) {
  const key = color + border
  if (rugCache.has(key)) return rugCache.get(key)
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 768
  const ctx = c.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 512, 768)
  // Borders
  ctx.strokeStyle = border
  ctx.lineWidth = 18
  ctx.strokeRect(24, 24, 464, 720)
  ctx.lineWidth = 5
  ctx.strokeRect(56, 56, 400, 656)
  // Central medallion + corner motifs
  ctx.fillStyle = border
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.ellipse(256, 384, 120, 170, 0, 0, Math.PI * 2)
  ctx.lineWidth = 8
  ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(256 + Math.cos(a) * 70, 384 + Math.sin(a) * 100, 22, 36, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(256, 384, 34, 0, Math.PI * 2)
  ctx.fill()
  ;[[100, 110], [412, 110], [100, 658], [412, 658]].forEach(([x, y]) => {
    ctx.beginPath()
    ctx.moveTo(x, y - 30)
    ctx.lineTo(x + 24, y)
    ctx.lineTo(x, y + 30)
    ctx.lineTo(x - 24, y)
    ctx.closePath()
    ctx.fill()
  })
  // Fringe noise for woven texture
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'
    ctx.fillRect(Math.random() * 512, Math.random() * 768, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  rugCache.set(key, tex)
  return tex
}

/** Ornate woven rug with a medallion and border. */
export function Rug({ position = [0, 0.02, -3], size = [5, 7.5], color = '#6b1d2a', border = '#e0b050', rotation = 0 }) {
  const map = useMemo(() => rugTexture(color, border), [color, border])
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}

/** Sets dressing described by a floor's theme (see shell.jsx ROOM_THEMES). */
export function RoomDecor({ theme, doorOpenRef }) {
  if (!theme) return null
  return (
    <group>
      {theme.door && (
        <Door position={[theme.door.x, 0, theme.door.z]} glow={theme.door.glow} frame={theme.door.frame} openRef={doorOpenRef} />
      )}
      {theme.chandeliers?.map((p, i) => <Chandelier key={i} position={p} />)}
      {theme.rose && <RoseWindow {...theme.rose} frame={theme.trim} />}
      {theme.rug && <Rug {...theme.rug} />}
    </group>
  )
}
