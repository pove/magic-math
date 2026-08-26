import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const FLOOR_HEIGHT = 6
// Crenellations top out at FLOOR_HEIGHT/2 + 1.35 (=3.85) above a floor's
// center; keep the gap under that so the next floor's wall meets them with
// no visible dark seam, while still leaving the merlons themselves exposed.
const FLOOR_GAP = 0.7

/** Group that rotates to always face the camera and slides outward so
 *  labels float just outside the tower wall instead of inside it. */
function Billboard({ position, radius = 0, children }) {
  const ref = useRef()
  const { camera } = useThree()
  useFrame(() => {
    if (!ref.current) return
    const v = new THREE.Vector3()
    camera.getWorldPosition(v)
    const p = ref.current.getWorldPosition(new THREE.Vector3())
    ref.current.lookAt(v.x, p.y, v.z)
    if (radius > 0) {
      // Offset outward along the horizontal direction towards the camera
      const dir = new THREE.Vector3(v.x - p.x, 0, v.z - p.z)
      if (dir.lengthSq() > 0.0001) {
        dir.normalize().multiplyScalar(radius)
        ref.current.position.set(dir.x, position[1], dir.z)
      }
    }
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

/**
 * A single floor of the tower.
 * status: 'locked' | 'done' | 'active'
 * r: bottom radius of this floor (the keep tapers as it goes up)
 */
export default function FloorNode({ level, index, status, onSelect, r = 7.8 }) {
  const group = useRef()
  const ring = useRef()
  const [hovered, setHovered] = useState(false)
  const y = index * (FLOOR_HEIGHT + FLOOR_GAP)
  const rTop = r - 0.9
  // Radius of the wall at the height of the windows (y = 0.4 above center)
  const rWin = rTop + 0.45

  const bodyColor = status === 'locked' ? '#3a3355' : '#5c5480'
  const accent = status === 'active' ? '#fbbf24' : status === 'done' ? '#34d399' : '#3b3554'
  const glow = hovered && status !== 'locked' ? 0.55 : status === 'active' ? 0.35 : status === 'done' ? 0.15 : 0

  // Pulse the active floor; shake locked floors on hover
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    if (status === 'active') {
      const s = 1 + Math.sin(t * 2.2) * 0.02
      group.current.scale.set(s, s, s)
    }
    if (status === 'locked' && hovered) {
      group.current.rotation.z = Math.sin(t * 30) * 0.015
    } else {
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.15)
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.8
      ring.current.material.opacity = 0.35 + Math.sin(t * 3) * 0.15
    }
  })

  return (
    <group ref={group} position={[0, y, 0]}>
      {/* Stone body */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = status !== 'locked' ? 'pointer' : 'not-allowed' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        onClick={(e) => { e.stopPropagation(); if (status !== 'locked') onSelect(level.floor) }}
      >
        <cylinderGeometry args={[rTop, r, FLOOR_HEIGHT, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Accent band under the roof — spans up to the roof cap's own
          underside (y=3.3) so there's no gap between them */}
      <mesh position={[0, FLOOR_HEIGHT / 2 - 0.1, 0]}>
        <cylinderGeometry args={[rTop + 0.05, rTop + 0.05, 0.8, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={glow + 0.08} roughness={0.5} />
      </mesh>

      {/* Roof cap with small battlements — gives a castle silhouette per floor */}
      <mesh position={[0, FLOOR_HEIGHT / 2 + 0.55, 0]}>
        <cylinderGeometry args={[rTop + 0.9, rTop + 0.9, 0.5, 16]} />
        <meshStandardMaterial color="#332c50" roughness={0.75} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * (rTop + 0.75), FLOOR_HEIGHT / 2 + 1.05, Math.sin(a) * (rTop + 0.75)]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.5]} />
            <meshStandardMaterial color="#3a3355" roughness={0.75} />
          </mesh>
        )
      })}

      {/* Windows with frames — warm when active, cool otherwise; hidden when locked */}
      {status !== 'locked' &&
        [0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return (
            <group key={i} position={[Math.cos(a) * rWin, 0.4, Math.sin(a) * rWin]} rotation={[0, -a + Math.PI / 2, 0]}>
              <mesh>
                <planeGeometry args={[1.2, 1.8]} />
                <meshBasicMaterial color={status === 'active' ? '#ffe9a3' : '#9be8dd'} transparent opacity={hovered ? 1 : 0.8} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.14, 1.8]} />
                <meshBasicMaterial color={bodyColor} />
              </mesh>
              <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[1.2, 0.14]} />
                <meshBasicMaterial color={bodyColor} />
              </mesh>
            </group>
          )
        })}

      {/* Rotating magic halo above the active floor */}
      {status === 'active' && (
        <>
          <mesh ref={ring} position={[0, FLOOR_HEIGHT / 2 + 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[5.2, 0.18, 8, 40]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
          </mesh>
          <pointLight position={[0, FLOOR_HEIGHT / 2, 0]} color="#fbbf24" intensity={18} distance={16} />
        </>
      )}

      {/* Number + status badge — anchored low on this floor's own body (well
          under its roofline) so it always reads as belonging to THIS floor,
          never floats into the gap toward the floor above. The badge glyph
          sits pinned beside the number so the status is never ambiguous:
          ✓ done, 🔒 locked, ★ the floor you're currently on. */}
      <Billboard position={[0, 2, 0]} radius={rTop + 1.2}>
        <Text
          position={[-0.55, 0, 0]}
          fontSize={1.5}
          color={status === 'locked' ? '#6b6485' : '#fef3c7'}
          anchorX="center"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {String(level.floor)}
        </Text>
        <Text
          position={[0.95, 0.6, 0.01]}
          fontSize={0.9}
          color={status === 'done' ? '#34d399' : status === 'locked' ? '#6b6485' : '#fbbf24'}
          anchorX="center"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          {status === 'done' ? '✓' : status === 'locked' ? '🔒' : '★'}
        </Text>
      </Billboard>

      {/* Room name below the number, dimmer — billboard too */}
      <Billboard position={[0, 0.95, 0]} radius={rTop + 1.2}>
        <Text
          fontSize={0.72}
          color={status === 'locked' ? '#565073' : '#e9e4ff'}
          anchorX="center"
          outlineWidth={0.04}
          outlineColor="#000000"
          maxWidth={13}
        >
          {level.name}
        </Text>
      </Billboard>
    </group>
  )
}

export { FLOOR_HEIGHT, FLOOR_GAP }
