import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Torch } from './kit'
import { WoodFloor } from './shell'

/**
 * 3D take on floor 5, "La Galería de los Retratos Vivientes": a gallery of
 * gilded portraits of old wizards whose painted faces blink and glance
 * around as you pass, each lit by its own little picture lamp; marble busts
 * on plinths and velvet museum ropes complete the hall.
 */

const GOLD = new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 0.85, roughness: 0.3 })

let canvasCache = new Map()
function canvasTexture(top, bottom) {
  const key = top + bottom
  if (canvasCache.has(key)) return canvasCache.get(key)
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 160
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 60, 10, 64, 80, 110)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 160)
  // Brush-stroke texture
  ctx.globalAlpha = 0.06
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'
    ctx.fillRect(Math.random() * 128, Math.random() * 160, 6 + Math.random() * 10, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  canvasCache.set(key, tex)
  return tex
}

function Portrait({ position, robeColor, bg = ['#6b4f2a', '#1c1208'], hat = true, blinkSpeed = 1, blinkPhase = 0, scale = 1 }) {
  const leftEye = useRef()
  const rightEye = useRef()
  const head = useRef()
  const canvas = useMemo(() => canvasTexture(bg[0], bg[1]), [bg])
  useFrame((state) => {
    const t = state.clock.elapsedTime * blinkSpeed + blinkPhase
    // Mostly open, with a quick blink pulse every cycle.
    const blink = Math.max(0, Math.sin(t * 1.3)) ** 14
    const openY = 1 - blink * 0.92
    if (leftEye.current) leftEye.current.scale.y = openY
    if (rightEye.current) rightEye.current.scale.y = openY
    if (head.current) head.current.rotation.y = Math.sin(t * 0.35) * 0.25
  })
  return (
    <group position={position} scale={scale}>
      {/* Gilded frame: outer moulding, inner lip */}
      <mesh material={GOLD} castShadow>
        <boxGeometry args={[2.1, 2.55, 0.18]} />
      </mesh>
      <mesh position={[0, 0, 0.07]} material={GOLD}>
        <boxGeometry args={[1.85, 2.3, 0.1]} />
      </mesh>
      {[[-1.05, 1.28], [1.05, 1.28], [-1.05, -1.28], [1.05, -1.28]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.1]} material={GOLD}>
          <sphereGeometry args={[0.12, 10, 8]} />
        </mesh>
      ))}
      {/* Painted canvas */}
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[1.6, 2.05]} />
        <meshStandardMaterial map={canvas} roughness={0.9} />
      </mesh>
      <group ref={head} position={[0, 0.05, 0.16]} scale={[1, 1, 0.35]}>
        {/* robe/shoulders */}
        <mesh position={[0, -0.62, 0]}>
          <sphereGeometry args={[0.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={robeColor} roughness={0.8} />
        </mesh>
        {/* face */}
        <mesh>
          <sphereGeometry args={[0.33, 20, 16]} />
          <meshStandardMaterial color="#f2c9a0" roughness={0.7} />
        </mesh>
        {/* beard */}
        <mesh position={[0, -0.28, 0.05]} scale={[0.8, 1.2, 0.6]}>
          <sphereGeometry args={[0.24, 14, 10]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.95} />
        </mesh>
        <mesh ref={leftEye} position={[-0.12, 0.07, 0.3]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh ref={rightEye} position={[0.12, 0.07, 0.3]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {hat && (
          <group position={[0, 0.3, 0]}>
            <mesh>
              <cylinderGeometry args={[0.46, 0.46, 0.04, 20]} />
              <meshStandardMaterial color={robeColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.04, 0.3, 0]} rotation={[0, 0, -0.15]}>
              <coneGeometry args={[0.28, 0.62, 16]} />
              <meshStandardMaterial color={robeColor} roughness={0.8} />
            </mesh>
          </group>
        )}
      </group>
      {/* Brass nameplate */}
      <mesh position={[0, -1.1, 0.14]} material={GOLD}>
        <boxGeometry args={[0.5, 0.14, 0.03]} />
      </mesh>
      {/* Picture lamp above */}
      <group position={[0, 1.45, 0.25]}>
        <mesh material={GOLD} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        </mesh>
        <mesh position={[0, 0.02, 0.22]} rotation={[0, 0, Math.PI / 2]} material={GOLD}>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 12]} />
        </mesh>
        <mesh position={[0, -0.05, 0.22]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.62, 8]} />
          <meshBasicMaterial color={[3, 2.5, 1.6]} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** Marble bust of a sage on a plinth. */
function Bust({ position, rotation = 0 }) {
  const marble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.35, metalness: 0.05 }), [])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} material={marble} castShadow>
        <boxGeometry args={[0.7, 1.2, 0.7]} />
      </mesh>
      <mesh position={[0, 1.25, 0]} material={marble}>
        <boxGeometry args={[0.85, 0.1, 0.85]} />
      </mesh>
      <mesh position={[0, 1.55, 0]} material={marble} scale={[1, 0.6, 0.7]}>
        <sphereGeometry args={[0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 1.95, 0]} material={marble} castShadow>
        <sphereGeometry args={[0.24, 18, 14]} />
      </mesh>
      <mesh position={[0, 1.75, 0.1]} material={marble} scale={[0.9, 1.3, 0.7]}>
        <sphereGeometry args={[0.16, 12, 10]} />
      </mesh>
    </group>
  )
}

/** Brass posts with a sagging red velvet rope between them. */
function VelvetRope({ from, to }) {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(from[0], 0.95, from[1])
    const b = new THREE.Vector3(to[0], 0.95, to[1])
    const mid = a.clone().lerp(b, 0.5)
    mid.y -= 0.25
    return new THREE.QuadraticBezierCurve3(a, mid, b)
  }, [from, to])
  return (
    <group>
      {[from, to].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} material={GOLD}>
            <cylinderGeometry args={[0.04, 0.05, 1, 10]} />
          </mesh>
          <mesh position={[0, 1.02, 0]} material={GOLD}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} material={GOLD}>
            <cylinderGeometry args={[0.18, 0.2, 0.04, 16]} />
          </mesh>
        </group>
      ))}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.035, 8, false]} />
        <meshStandardMaterial color="#9f1239" roughness={0.6} />
      </mesh>
    </group>
  )
}

export default function PortraitGalleryRoom({ accent = '#ec4899' }) {
  return (
    <group>
      <color attach="background" args={['#2e0a0a']} />
      <fog attach="fog" args={['#2e0a0a', 16, 42]} />

      <Portrait position={[-4.6, 3.6, -13.3]} robeColor="#7c3aed" bg={['#5b4a7a', '#140c20']} blinkSpeed={0.7} blinkPhase={0} />
      <Portrait position={[0, 3.9, -13.3]} robeColor="#1d4ed8" bg={['#7a5a2a', '#1c1208']} blinkSpeed={0.9} blinkPhase={2} scale={1.25} />
      <Portrait position={[4.6, 3.6, -13.3]} robeColor="#be123c" bg={['#2f5a4a', '#08140f']} blinkSpeed={0.8} blinkPhase={4} hat={false} />
      <Portrait position={[9, 3.5, -13.3]} robeColor="#0f766e" bg={['#6a3a3a', '#180808']} blinkSpeed={0.6} blinkPhase={1} />

      <Bust position={[-2.3, 0, -12.2]} rotation={0.3} />
      <Bust position={[2.3, 0, -12.2]} rotation={-0.3} />

      <VelvetRope from={[-6.2, -10.8]} to={[-3.2, -10.8]} />
      <VelvetRope from={[3.2, -10.8]} to={[6.2, -10.8]} />

      <Torch position={[-7, 0, -12.6]} />
      <Torch position={[6.8, 0, -12.6]} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      {/* One warm wash over the portrait wall (the picture lamps glow on their own) */}
      <pointLight position={[1, 5.2, -10.5]} color="#ffe2b0" intensity={16} distance={14} decay={1.5} />

      <WoodFloor color="#6b3a24" />
    </group>
  )
}
