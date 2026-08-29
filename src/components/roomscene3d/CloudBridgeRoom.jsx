import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from './kit'

/**
 * 3D take on floor 11, "El Puente de las Nubes": the one daytime scene in
 * the castle — a bright sky, a rainbow arc, and a bridge made of drifting
 * puffy clouds instead of stone.
 *
 * Every flat color here is marked toneMapped={false}: the shared Canvas
 * uses filmic tone mapping tuned for the other 11 (mostly night) floors,
 * which rolls a pastel daytime blue down into a muddy navy. Opting these
 * materials out keeps this one bright scene true to its own palette
 * without touching the shared renderer settings the night floors rely on.
 */

function SkyDome() {
  return (
    <mesh scale={-1}>
      <sphereGeometry args={[120, 24, 16]} />
      <meshBasicMaterial color="#bfe3ff" toneMapped={false} fog={false} side={THREE.BackSide} />
    </mesh>
  )
}

function Cloud({ position, scale = 1, speed = 1 }) {
  const ref = useRef()
  const baseX = position[0]
  useFrame((state) => {
    if (ref.current) ref.current.position.x = baseX + Math.sin(state.clock.elapsedTime * 0.12 * speed) * 1.4
  })
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.9, 12, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.75, -0.1, 0.1]}>
        <sphereGeometry args={[0.62, 12, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[-0.75, -0.15, -0.1]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Rainbow() {
  const colors = ['#f87171', '#fbbf24', '#4ade80', '#60a5fa']
  return (
    <group position={[0, 2, -16]} rotation={[0, 0, 0]}>
      {colors.map((c, i) => (
        <mesh key={c} rotation={[0, 0, 0]}>
          <torusGeometry args={[9 - i * 0.5, 0.22, 8, 48, Math.PI]} />
          <meshBasicMaterial color={c} transparent opacity={0.75} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function Sun() {
  const glow = useRef()
  useFrame((state) => {
    if (glow.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.06
      glow.current.scale.set(s, s, s)
    }
  })
  return (
    <group position={[-9, 13, -26]}>
      <mesh>
        <sphereGeometry args={[2, 24, 24]} />
        <meshBasicMaterial color="#fef08a" toneMapped={false} />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[2.8, 24, 24]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <pointLight color="#fef3c7" intensity={1.4} distance={40} />
    </group>
  )
}

// Cloud-tile walkway instead of stone flooring — matching the 2D scene's
// oval cloud-puff bridge.
function CloudFloor() {
  const tiles = useMemo(() => {
    const r = mulberry32(21)
    return Array.from({ length: 9 }, (_, i) => ({
      x: -12 + i * 3,
      z: -4 + (i % 2 ? 1.4 : -0.6) + (r() - 0.5),
      s: 0.9 + r() * 0.3,
    }))
  }, [])
  return (
    <group>
      {tiles.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh>
            <sphereGeometry args={[1.4, 14, 10]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[1.1, -0.15, 0.3]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshBasicMaterial color="#f8fafc" toneMapped={false} />
          </mesh>
          <mesh position={[-1.1, -0.18, -0.3]}>
            <sphereGeometry args={[0.9, 14, 10]} />
            <meshBasicMaterial color="#f1f5f9" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* a soft floor plane underneath so gaps between puffs never show void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial color="#e0e7ff" transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function CloudBridgeRoom({ accent = '#a78bfa' }) {
  return (
    <group>
      <color attach="background" args={['#bfe3ff']} />
      <fog attach="fog" args={['#dbeeff', 30, 70]} />

      <SkyDome />
      <Sun />
      <Rainbow />

      <Cloud position={[-8, 7, -18]} scale={1.6} speed={0.8} />
      <Cloud position={[6, 9, -20]} scale={1.9} speed={1.1} />
      <Cloud position={[10, 5, -14]} scale={1.2} speed={0.6} />
      <Cloud position={[-4, 4.5, -12]} scale={1} speed={1.3} />

      <CloudFloor />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.3} distance={22} />
      <hemisphereLight args={['#ffffff', '#bfe3ff', 0.6]} />
    </group>
  )
}
