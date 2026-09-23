import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { stoneTextures, runeBandTexture } from '../three/textures'
import { windowGlassGeometry, windowFrameGeometry } from './windowGeometry'

const FLOOR_HEIGHT = 6
// Crenellations top out at FLOOR_HEIGHT/2 + 1.35 (=3.85) above a floor's
// center; keep the gap under that so the next floor's wall meets them with
// no visible dark seam, while still leaving the merlons themselves exposed.
const FLOOR_GAP = 0.7

const SEGMENTS = 48
const WINDOWS = 8
const MERLONS = 14
const WINDOW_Y = 0.2

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

// Label colours are lifted slightly above 1.0 so they still read at full
// brightness after the post-processing tone map (ACES darkens mid-tones).
const labelCache = new Map()
function label(hex) {
  if (!labelCache.has(hex)) labelCache.set(hex, new THREE.Color(hex).multiplyScalar(1.3))
  return labelCache.get(hex)
}

// What each floor state looks like: stone tint, rune/glass glow colours.
const LOOK = {
  active: { stone: '#ffffff', rune: '#ffb020', runeI: 3.2, glass: '#ffc46b', glassI: 2.6 },
  done: { stone: '#e9e5f5', rune: '#2dd4bf', runeI: 1.6, glass: '#7dd3fc', glassI: 1.25 },
  locked: { stone: '#8a84a3', rune: '#4c4570', runeI: 0.25, glass: '#140f26', glassI: 0 },
}

/**
 * A single floor of the tower.
 * status: 'locked' | 'done' | 'active'
 * r: bottom radius of this floor (the keep tapers as it goes up)
 */
export default function FloorNode({ level, index, status, onSelect, r = 7.8 }) {
  const group = useRef()
  const ring = useRef()
  const merlons = useRef()
  const glass = useRef()
  const frames = useRef()
  const [hovered, setHovered] = useState(false)
  const y = index * (FLOOR_HEIGHT + FLOOR_GAP)
  const rTop = r - 0.9
  const look = LOOK[status] || LOOK.locked

  // The wall leans inward as it rises; windows tilt to sit flush on it.
  const slope = Math.atan((r - rTop) / FLOOR_HEIGHT)
  const wallRadiusAt = (yy) => r + (rTop - r) * ((yy + FLOOR_HEIGHT / 2) / FLOOR_HEIGHT)

  const circumference = Math.PI * (r + rTop)
  const mats = useMemo(() => {
    // Integer horizontal repeats so the brick pattern closes seamlessly
    const wall = stoneTextures(Math.max(1, Math.round(circumference / 5.1)), FLOOR_HEIGHT / 3.4)
    const trim = stoneTextures(0.5, 0.25)
    const runes = runeBandTexture(Math.max(1, Math.round(circumference / 12.8)))
    return {
      wall: new THREE.MeshStandardMaterial({ ...wall, roughness: 1 }),
      trim: new THREE.MeshStandardMaterial({ ...trim, roughness: 1 }),
      band: new THREE.MeshStandardMaterial({ color: '#2a2140', metalness: 0.7, roughness: 0.35, emissiveMap: runes }),
      glass: new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.2 }),
    }
  }, [circumference])

  // Status/hover drive colours without rebuilding materials
  mats.wall.color.set(look.stone)
  mats.trim.color.set(look.stone).multiplyScalar(0.72)
  mats.band.emissive.set(look.rune)
  mats.glass.color.set(status === 'locked' ? '#1a1530' : look.glass)
  mats.glass.emissive.set(look.glass)
  mats.wall.emissive.set('#8b5cf6')
  mats.wall.emissiveIntensity = hovered && status !== 'locked' ? 0.06 : 0

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let i = 0; i < MERLONS; i++) {
      const a = (i / MERLONS) * Math.PI * 2
      dummy.position.set(Math.cos(a) * (rTop + 0.75), FLOOR_HEIGHT / 2 + 1.05, Math.sin(a) * (rTop + 0.75))
      dummy.rotation.set(0, -a, 0)
      dummy.updateMatrix()
      merlons.current.setMatrixAt(i, dummy.matrix)
    }
    merlons.current.instanceMatrix.needsUpdate = true

    const rw = wallRadiusAt(WINDOW_Y)
    for (let i = 0; i < WINDOWS; i++) {
      const a = (i / WINDOWS) * Math.PI * 2 + Math.PI / WINDOWS
      dummy.rotation.set(-slope, -a + Math.PI / 2, 0, 'YXZ')
      dummy.position.set(Math.cos(a) * (rw + 0.01), WINDOW_Y, Math.sin(a) * (rw + 0.01))
      dummy.updateMatrix()
      glass.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(Math.cos(a) * (rw - 0.06), WINDOW_Y, Math.sin(a) * (rw - 0.06))
      dummy.updateMatrix()
      frames.current.setMatrixAt(i, dummy.matrix)
    }
    glass.current.instanceMatrix.needsUpdate = true
    frames.current.instanceMatrix.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, rTop, slope])

  // Pulse the active floor; shake locked floors on hover; breathe the glow
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    if (status === 'active') {
      const s = 1 + Math.sin(t * 2.2) * 0.012
      group.current.scale.set(s, s, s)
    }
    if (status === 'locked' && hovered) {
      group.current.rotation.z = Math.sin(t * 30) * 0.015
    } else {
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.15)
    }
    const boost = hovered && status !== 'locked' ? 1.5 : 1
    const breathe = status === 'active' ? 0.8 + Math.sin(t * 2.2) * 0.25 : 1
    mats.band.emissiveIntensity = look.runeI * boost * breathe
    // Candle-like flicker in lit windows
    const flicker = status === 'active' ? 0.9 + Math.sin(t * 7.3 + index) * 0.06 + Math.sin(t * 13.1) * 0.04 : 1
    mats.glass.emissiveIntensity = look.glassI * boost * flicker
    if (ring.current) {
      ring.current.rotation.z = t * 0.8
      ring.current.material.opacity = 0.55 + Math.sin(t * 3) * 0.2
    }
  })

  return (
    <group ref={group} position={[0, y, 0]}>
      {/* Stone body */}
      <mesh
        material={mats.wall}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = status !== 'locked' ? 'pointer' : 'not-allowed' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        onClick={(e) => { e.stopPropagation(); if (status !== 'locked') onSelect(level.floor) }}
      >
        <cylinderGeometry args={[rTop, r, FLOOR_HEIGHT, SEGMENTS, 1, true]} />
      </mesh>

      {/* Rune band under the roof — the floor's status glows through the
          engraved math symbols */}
      <mesh position={[0, FLOOR_HEIGHT / 2 - 0.1, 0]} material={mats.band}>
        <cylinderGeometry args={[rTop + 0.06, rTop + 0.06, 0.8, SEGMENTS, 1, true]} />
      </mesh>

      {/* Corbelled roof ledge with battlements — a castle silhouette per floor */}
      <mesh position={[0, FLOOR_HEIGHT / 2 + 0.55, 0]} material={mats.trim} castShadow receiveShadow>
        <cylinderGeometry args={[rTop + 0.9, rTop + 0.35, 0.5, SEGMENTS]} />
      </mesh>
      <instancedMesh ref={merlons} args={[undefined, mats.trim, MERLONS]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.6, 0.5]} />
      </instancedMesh>

      {/* Arched windows: glowing glass set into protruding stone frames */}
      <instancedMesh ref={frames} args={[windowFrameGeometry(), mats.trim, WINDOWS]} castShadow receiveShadow />
      <instancedMesh ref={glass} args={[windowGlassGeometry(), mats.glass, WINDOWS]} />

      {/* Rotating magic halo above the active floor */}
      {status === 'active' && (
        <>
          <mesh ref={ring} position={[0, FLOOR_HEIGHT / 2 + 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[rTop + 1.6, 0.07, 8, 96]} />
            <meshBasicMaterial color={[3, 2, 0.5]} transparent opacity={0.6} toneMapped={false} />
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
          color={label(status === 'locked' ? '#6b6485' : '#fef3c7')}
          anchorX="center"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {String(level.floor)}
        </Text>
        <Text
          position={[0.95, 0.6, 0.01]}
          fontSize={0.9}
          color={label(status === 'done' ? '#34d399' : status === 'locked' ? '#6b6485' : '#fbbf24')}
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
          color={label(status === 'locked' ? '#565073' : '#e9e4ff')}
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
