import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Torch, StoneFloor, Column, GlowPedestal } from './kit'

/**
 * 3D take on floor 8, "La Cripta de los Sabios": a hall of stone columns
 * guarding two glowing crystal orbs, with an ancient scroll hovering and
 * slowly unrolling itself in the candlelight.
 */

function FloatingScroll() {
  const group = useRef()
  const leftRod = useRef()
  const rightRod = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.position.y = 3.4 + Math.sin(t * 0.9) * 0.18
      group.current.rotation.y = Math.sin(t * 0.4) * 0.3
    }
    // rods drift slightly apart and back, as if the scroll breathes
    const spread = 0.62 + Math.sin(t * 0.7) * 0.06
    if (leftRod.current) leftRod.current.position.x = -spread
    if (rightRod.current) rightRod.current.position.x = spread
  })
  return (
    <group ref={group} position={[0, 3.4, -8]}>
      <mesh>
        <planeGeometry args={[1.2, 0.65]} />
        <meshStandardMaterial color="#e7d8b0" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((l) => (
        <mesh key={l} position={[0, 0.18 - l * 0.16, 0.01]}>
          <boxGeometry args={[0.85, 0.03, 0.01]} />
          <meshBasicMaterial color="#92703c" />
        </mesh>
      ))}
      <mesh ref={leftRod} position={[-0.62, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.75, 10]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
      <mesh ref={rightRod} position={[0.62, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.75, 10]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
    </group>
  )
}

export default function CryptOfSagesRoom({ accent = '#8b5cf6' }) {
  return (
    <group>
      <color attach="background" args={['#0d0d14']} />
      <fog attach="fog" args={['#0d0d14', 13, 38]} />

      <Stars seed={99} count={80} spread={40} y={[5, 9]} z={[-13, -20]} />

      <mesh position={[0, 3.4, -12.8]}>
        <boxGeometry args={[26, 8, 1]} />
        <meshStandardMaterial color="#1a0533" roughness={0.9} />
      </mesh>

      <Column position={[-9, 0, -10]} height={5.4} />
      <Column position={[-3.6, 0, -10.6]} height={5.6} />
      <Column position={[3.6, 0, -10.6]} height={5.6} />
      <Column position={[9, 0, -10]} height={5.4} />

      <GlowPedestal position={[-4.6, 0, -6]} color="#a78bfa" pulse={1} />
      <GlowPedestal position={[4.6, 0, -6]} color="#c4b5fd" pulse={1.2} />

      <FloatingScroll />

      <Torch position={[0, 0, -9.2]} scale={1.2} />

      <pointLight position={[0, 5, 2]} color={accent} intensity={0.5} distance={22} />
      <pointLight position={[0, 4, -9]} color="#a78bfa" intensity={0.6} distance={14} />

      <StoneFloor />
    </group>
  )
}
