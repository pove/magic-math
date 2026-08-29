import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Torch, StoneFloor } from './kit'

/**
 * 3D take on floor 5, "La Galería de los Retratos Vivientes": a row of
 * portraits whose painted faces blink and glance around as you pass —
 * each on its own lazy rhythm so the wall never feels perfectly still.
 */

function Portrait({ position, robeColor, blinkSpeed = 1, blinkPhase = 0 }) {
  const leftEye = useRef()
  const rightEye = useRef()
  const head = useRef()
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
    <group position={position}>
      {/* frame */}
      <mesh>
        <boxGeometry args={[1.9, 2.3, 0.22]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[1.55, 1.95, 0.1]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <group ref={head} position={[0, 0.1, 0.16]}>
        {/* robe/shoulders */}
        <mesh position={[0, -0.55, 0]}>
          <coneGeometry args={[0.62, 0.7, 4]} />
          <meshStandardMaterial color={robeColor} />
        </mesh>
        {/* face */}
        <mesh>
          <sphereGeometry args={[0.37, 16, 16]} />
          <meshStandardMaterial color="#f4d4a0" />
        </mesh>
        <mesh ref={leftEye} position={[-0.14, 0.06, 0.32]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh ref={rightEye} position={[0.14, 0.06, 0.32]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -0.13, 0.34]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.08, 0.015, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      <mesh position={[0, -1.0, 0.15]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

export default function PortraitGalleryRoom({ accent = '#ec4899' }) {
  return (
    <group>
      <color attach="background" args={['#2e0a0a']} />
      <fog attach="fog" args={['#2e0a0a', 14, 40]} />

      <mesh position={[0, 3.4, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#3f1010" roughness={0.9} />
      </mesh>

      <Portrait position={[-5.2, 3.4, -12]} robeColor="#7c3aed" blinkSpeed={0.7} blinkPhase={0} />
      <Portrait position={[0, 3.6, -12]} robeColor="#2563eb" blinkSpeed={0.9} blinkPhase={2} />
      <Portrait position={[5.2, 3.4, -12]} robeColor="#be123c" blinkSpeed={0.8} blinkPhase={4} />

      <Torch position={[-2.4, 0, -11]} />
      <Torch position={[2.4, 0, -11]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -3]}>
        <planeGeometry args={[4.2, 10]} />
        <meshStandardMaterial color="#450a0a" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3]}>
        <ringGeometry args={[1.9, 2.05, 4]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.45} />
      </mesh>

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      <pointLight position={[0, 4, -11]} color="#fca5a5" intensity={0.6} distance={14} />

      <StoneFloor />
    </group>
  )
}
