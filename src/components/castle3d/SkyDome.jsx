import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Night sky: gradient dome + twinkling stars + a glowing moon.
 * Pure procedural — zero assets.
 */
export default function SkyDome() {
  const starsRef = useRef()

  const stars = useMemo(() => {
    const positions = new Float32Array(600 * 3)
    for (let i = 0; i < 600; i++) {
      // Random points on a large sphere shell
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 90 + Math.random() * 20
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) // upper hemisphere only
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return positions
  }, [])

  // Twinkle via opacity oscillation
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.opacity = 0.65 + Math.sin(state.clock.elapsedTime * 1.5) * 0.25
    }
  })

  return (
    <group>
      {/* Gradient background */}
      <color attach="background" args={['#161033']} />
      <fog attach="fog" args={['#161033', 75, 190]} />

      {/* Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={stars.length / 3} array={stars} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial ref={starsRef} size={0.5} color="#ffffff" sizeAttenuation transparent depthWrite={false} />
      </points>

      {/* Moon with craters */}
      <mesh position={[-30, 55, -60]}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#fdf6d8" />
      </mesh>
      {[[-2, 2, 6.05], [1.5, -1, 6.05], [2.5, 2.5, 6.02]].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]}>
          <sphereGeometry args={[0.9 - i * 0.15, 12, 12]} />
          <meshBasicMaterial color="#e8dfc0" />
        </mesh>
      ))}
      {/* Moon halo */}
      <mesh position={[-30, 55, -60.5]}>
        <sphereGeometry args={[8.5, 32, 32]} />
        <meshBasicMaterial color="#fdf6d8" transparent opacity={0.12} />
      </mesh>
    </group>
  )
}
