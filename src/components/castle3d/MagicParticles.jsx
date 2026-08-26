import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Floating magic dust particles drifting upward around the tower.
 */
export default function MagicParticles({ color = '#a78bfa', count = 150, radius = 18, height = 90 }) {
  const ref = useRef()

  const { arr, speeds } = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = radius * (0.4 + Math.random() * 0.6)
      arr[i * 3] = Math.cos(angle) * dist
      arr[i * 3 + 1] = Math.random() * height
      arr[i * 3 + 2] = Math.sin(angle) * dist
      speeds[i] = 0.5 + Math.random() * 1.2
    }
    return { arr, speeds }
  }, [count, radius, height])

  useFrame((state, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * delta
      if (y > height) y = 0
      pos.setY(i, y)
      // gentle horizontal sway
      pos.setX(i, arr[i * 3] + Math.sin(t * 0.8 + i) * 1.2)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.35} color={color} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}
