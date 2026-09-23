import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { stoneTextures, woodTextures } from '../three/textures'
import { windowGlassGeometry, windowFrameGeometry } from '../castle3d/windowGeometry'

/**
 * The architecture every 3D room is built inside: side walls, pilasters,
 * moulding, arched windows with shafts of light, a beamed ceiling and a
 * proper floor — or, for the open-air rooms, battlements, hedges or a
 * balustrade under the sky. Each floor picks a theme (see ROOM_THEMES) so
 * the rooms share one quality bar but still look like different places.
 *
 * Room box: x ∈ [-W/2, W/2], z ∈ [Z_BACK, Z_FRONT], floor at y = 0. The
 * front runs past the camera so the walls never end inside the frame.
 */

export const ROOM_W = 26
export const Z_BACK = -13.5
export const Z_FRONT = 13
const DEPTH = Z_FRONT - Z_BACK
const MID_Z = (Z_BACK + Z_FRONT) / 2

// Stone is procedural and tinted; wood panelling uses the plank texture.
function useWallMaterial(kind, color, length, height) {
  return useMemo(() => {
    const tex = kind === 'wood' ? woodTextures(length / 1.6, height / 2.2) : stoneTextures(Math.round(length / 5.1), height / 3.4)
    return new THREE.MeshStandardMaterial({ ...tex, color, roughness: 0.95 })
  }, [kind, color, length, height])
}

/** Instanced boxes from a list of [x, y, z, rotY] placements. */
function Boxes({ size, placements, material, castShadow = false }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    placements.forEach(([x, y, z, ry = 0], i) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, ry, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [placements])
  return (
    <instancedMesh ref={ref} args={[undefined, material, placements.length]} castShadow={castShadow}>
      <boxGeometry args={size} />
    </instancedMesh>
  )
}

/** Vertical gradient for the window light shafts (bright at the top). */
let shaftTexture
function getShaftTexture() {
  if (shaftTexture) return shaftTexture
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 128)
  shaftTexture = new THREE.CanvasTexture(c)
  shaftTexture.colorSpace = THREE.SRGBColorSpace
  return shaftTexture
}

/** Arched windows along both side walls: glowing glass, stone frames and a
 *  slanting shaft of light falling from each one into the room. */
function SideWindows({ zs, y, glow, frameMat, shafts }) {
  const glass = useRef()
  const frames = useRef()
  const placements = useMemo(() => zs.flatMap((z) => [[-ROOM_W / 2 + 0.02, z, Math.PI / 2], [ROOM_W / 2 - 0.02, z, -Math.PI / 2]]), [zs])
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    placements.forEach(([x, z, ry], i) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, ry, 0)
      dummy.scale.set(1.7, 1.7, 1.2)
      dummy.updateMatrix()
      glass.current.setMatrixAt(i, dummy.matrix)
      frames.current.setMatrixAt(i, dummy.matrix)
    })
    glass.current.instanceMatrix.needsUpdate = true
    frames.current.instanceMatrix.needsUpdate = true
  }, [placements, y])
  const glassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 1.6, roughness: 0.3 }),
    [glow]
  )
  const shaftMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: getShaftTexture(), color: glow, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }),
    [glow]
  )
  return (
    <group>
      <instancedMesh ref={glass} args={[windowGlassGeometry(), glassMat, placements.length]} />
      <instancedMesh ref={frames} args={[windowFrameGeometry(), frameMat, placements.length]} />
      {shafts &&
        placements.map(([x, z, ry], i) => (
          // A tall quad leaning in from the window down to the floor
          <mesh key={i} position={[x + Math.sign(-x) * 2.4, y - 2.3, z]} rotation={[0, ry, Math.sign(x) * 0.62]} material={shaftMat}>
            <planeGeometry args={[1.7, 6.5]} />
          </mesh>
        ))}
    </group>
  )
}

/**
 * theme:
 *   wall        { kind: 'stone' | 'wood', color }
 *   height      wall height (interiors) / parapet height (open air)
 *   trim        colour of pilasters, moulding, frames
 *   windows     glow colour for the side windows, or null
 *   shafts      draw light shafts from the windows
 *   ceiling     { color, beams } for interiors, or null for open air
 *   battlements true to crown the walls with merlons
 *   parapet     'hedge' | 'balustrade' | null — replaces full walls outdoors
 *   backWall    false to leave the back open (a scene draws its own)
 */
export default function RoomShell({ theme }) {
  const {
    wall = { kind: 'stone', color: '#8e86ad' },
    height = 8,
    trim = '#5b5375',
    windows = null,
    shafts = false,
    sconces = '#ffb45c',
    ceiling = null,
    battlements = false,
    parapet = null,
    backWall = true,
  } = theme

  const sideMat = useWallMaterial(wall.kind, wall.color, DEPTH, height)
  const backMat = useWallMaterial(wall.kind, wall.color, ROOM_W, height)
  const trimMat = useMemo(() => {
    const tex = stoneTextures(0.6, 0.6)
    return new THREE.MeshStandardMaterial({ ...tex, color: trim, roughness: 0.9 })
  }, [trim])

  // Pilasters every ~5 units down both sides, windows between them
  const pilasterZ = useMemo(() => [-11, -5.5, 0, 5.5, 11], [])
  const windowZ = useMemo(() => [-8.25, -2.75, 2.75], [])
  const pilasters = useMemo(
    () => pilasterZ.flatMap((z) => [[-ROOM_W / 2 + 0.3, height / 2, z], [ROOM_W / 2 - 0.3, height / 2, z]]),
    [pilasterZ, height]
  )
  const merlons = useMemo(() => {
    if (!battlements) return []
    const out = []
    for (let z = Z_BACK + 0.8; z < Z_FRONT; z += 1.6) out.push([-ROOM_W / 2, height + 0.4, z], [ROOM_W / 2, height + 0.4, z])
    for (let x = -ROOM_W / 2 + 0.8; x < ROOM_W / 2; x += 1.6) if (backWall) out.push([x, height + 0.4, Z_BACK, Math.PI / 2])
    return out
  }, [battlements, height, backWall])

  if (parapet === 'hedge') return <HedgeParapet height={height} />
  if (parapet === 'balustrade') return <Balustrade trimMat={trimMat} />

  return (
    <group>
      {/* Side walls, facing into the room */}
      <mesh position={[-ROOM_W / 2, height / 2, MID_Z]} rotation={[0, Math.PI / 2, 0]} material={sideMat} receiveShadow>
        <planeGeometry args={[DEPTH, height]} />
      </mesh>
      <mesh position={[ROOM_W / 2, height / 2, MID_Z]} rotation={[0, -Math.PI / 2, 0]} material={sideMat} receiveShadow>
        <planeGeometry args={[DEPTH, height]} />
      </mesh>
      {backWall && (
        <mesh position={[0, height / 2, Z_BACK]} material={backMat} receiveShadow>
          <planeGeometry args={[ROOM_W, height]} />
        </mesh>
      )}

      {/* Pilasters, skirting and cornice */}
      <Boxes size={[0.8, height, 0.6]} placements={pilasters.map(([x, y, z]) => [x, y, z, Math.PI / 2])} material={trimMat} />
      <Boxes
        size={[DEPTH, 0.35, 0.18]}
        placements={[[-ROOM_W / 2 + 0.09, 0.175, MID_Z, Math.PI / 2], [ROOM_W / 2 - 0.09, 0.175, MID_Z, Math.PI / 2], ...(backWall ? [[0, 0.175, Z_BACK + 0.09, 0]] : [])]}
        material={trimMat}
      />
      <Boxes
        size={[DEPTH, 0.4, 0.35]}
        placements={[[-ROOM_W / 2 + 0.17, height - 0.2, MID_Z, Math.PI / 2], [ROOM_W / 2 - 0.17, height - 0.2, MID_Z, Math.PI / 2]]}
        material={trimMat}
      />

      {windows && <SideWindows zs={windowZ} y={Math.min(4.4, height * 0.55)} glow={windows} frameMat={trimMat} shafts={shafts && !!ceiling} />}

      {sconces && <Sconces zs={pilasterZ.slice(0, 4)} color={sconces} height={height} />}

      {battlements && merlons.length > 0 && <Boxes size={[0.8, 0.8, 0.9]} placements={merlons.map(([x, y, z, r = 0]) => [x, y, z, r])} material={trimMat} />}

      {ceiling && <Ceiling height={height} color={ceiling.color} beams={ceiling.beams} />}
    </group>
  )
}

/**
 * Iron wall sconces with a glowing flame on the pilasters (emissive only)
 * plus one real light per side, so the side walls aren't lost in the dark.
 */
function Sconces({ zs, color, height }) {
  const y = Math.min(3.4, height * 0.5)
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f1b24', metalness: 0.7, roughness: 0.45 }), [])
  const flame = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4), toneMapped: false }), [color])
  const spots = useMemo(() => zs.flatMap((z) => [[-ROOM_W / 2 + 0.75, z], [ROOM_W / 2 - 0.75, z]]), [zs])
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={iron} position={[Math.sign(-x) * -0.05, -0.1, 0]}>
            <cylinderGeometry args={[0.12, 0.07, 0.22, 8]} />
          </mesh>
          <mesh material={flame} position={[0, 0.12, 0]} scale={[1, 1.6, 1]}>
            <sphereGeometry args={[0.08, 10, 8]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((sd) => (
        <pointLight key={sd} position={[sd * (ROOM_W / 2 - 1.5), y + 0.5, -2]} color={color} intensity={14} distance={16} decay={1.6} />
      ))}
    </group>
  )
}

function Ceiling({ height, color = '#2a1d14', beams = '#3b2616' }) {
  const beamMat = useMemo(() => {
    const tex = woodTextures(4, 0.3)
    return new THREE.MeshStandardMaterial({ ...tex, color: beams, roughness: 0.85 })
  }, [beams])
  const beamZ = useMemo(() => {
    const out = []
    for (let z = Z_BACK + 1.5; z < Z_FRONT; z += 3) out.push([0, height - 0.3, z])
    return out
  }, [height])
  return (
    <group>
      <mesh position={[0, height, MID_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, DEPTH]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <Boxes size={[ROOM_W, 0.45, 0.4]} placements={beamZ} material={beamMat} />
    </group>
  )
}

/** Clipped hedges lining an open-air garden. */
function HedgeParapet({ height = 2.6 }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f5c38', roughness: 1, flatShading: true }), [])
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1, 6, 4, 6)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (Math.sin(p.getX(i) * 13.1 + p.getY(i) * 7.3) * Math.cos(p.getZ(i) * 11.7)) * 0.06
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const segments = useMemo(() => {
    const out = []
    for (let z = Z_BACK + 1.2; z < Z_FRONT; z += 2.3) out.push([-ROOM_W / 2 + 0.8, z], [ROOM_W / 2 - 0.8, z])
    return out
  }, [])
  const ref = useRef()
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    segments.forEach(([x, z], i) => {
      dummy.position.set(x, height / 2, z)
      dummy.scale.set(1.6, height, 2.4)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [segments, height])
  return <instancedMesh ref={ref} args={[geo, mat, segments.length]} />
}

/** Stone balustrade for the open-air terraces (observatory). */
function Balustrade({ trimMat }) {
  const posts = useMemo(() => {
    const out = []
    for (let z = Z_BACK + 0.5; z < Z_FRONT; z += 0.7) out.push([-ROOM_W / 2 + 0.5, 0.55, z], [ROOM_W / 2 - 0.5, 0.55, z])
    return out
  }, [])
  return (
    <group>
      <Boxes size={[0.22, 1.1, 0.22]} placements={posts} material={trimMat} />
      <Boxes
        size={[DEPTH, 0.2, 0.45]}
        placements={[[-ROOM_W / 2 + 0.5, 1.2, MID_Z, Math.PI / 2], [ROOM_W / 2 - 0.5, 1.2, MID_Z, Math.PI / 2]]}
        material={trimMat}
      />
    </group>
  )
}

/** Plank floor (for libraries, classrooms...). */
export function WoodFloor({ color = '#8a5a34', width = ROOM_W, depth = DEPTH, z = MID_Z }) {
  const tex = useMemo(() => {
    const t = woodTextures(width / 1.3, depth / 3.5)
    Object.values(t).forEach((x) => (x.rotation = 0))
    return t
  }, [width, depth])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial {...tex} color={color} roughness={0.6} envMapIntensity={0.8} />
    </mesh>
  )
}

/** A long carpet runner down the middle of the room. */
export function Runner({ color = '#7f1d1d', border = '#fbbf24', width = 4, length = 20, z = -2 }) {
  return (
    <group position={[0, 0.02, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * (width / 2 - 0.2), 0.005, 0]}>
          <planeGeometry args={[0.14, length]} />
          <meshStandardMaterial color={border} roughness={0.6} metalness={0.3} emissive={border} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Per-floor architecture and set dressing. Colours follow each floor's 2D
 * palette. `door` is the back-wall door the player walks in through
 * (floor 1 uses its own great gate, floor 11 arrives over the clouds).
 */
export const ROOM_THEMES = {
  // Floor 1 is the real castle's front lawn (see CastleEntranceRoom): no walls
  1: null,
  2: {
    wall: { kind: 'wood', color: '#8a5a34' }, height: 8, trim: '#5c3a1e', windows: '#ffcf87', ceiling: { color: '#24160c', beams: '#4a2c14' },
    door: { x: 0, z: -12.45, glow: '#ffcf87', frame: '#6b4a2a' },
    chandeliers: [[0, 6.2, -6.5]],
    rose: { position: [0, 6.25, -12.45], radius: 1.1, colors: ['#f59e0b', '#dc2626', '#fbbf24', '#b45309'] },
  },
  3: {
    wall: { kind: 'stone', color: '#6f8a7a' }, height: 7.5, trim: '#3d5446', windows: '#6ee7b7', ceiling: { color: '#0e1a14', beams: '#2c2216' },
    door: { x: -7.5, z: -12.9, glow: '#86efac', frame: '#3d5446' },
    chandeliers: [[0, 5.8, -5.5]],
  },
  4: { parapet: 'hedge', height: 2.6, door: { x: 0.4, z: -12.2, glow: '#d9f99d', frame: '#6b6f5a' } },
  5: {
    wall: { kind: 'stone', color: '#b07a7a' }, height: 8, trim: '#6b2d2d', windows: '#ffd9a0', ceiling: { color: '#220909', beams: '#3a1a10' },
    door: { x: -8.6, z: -12.9, glow: '#ffd9a0', frame: '#6b2d2d' },
    chandeliers: [[0, 6.3, -5.5]],
    rug: { position: [0, 0.02, -4], size: [5.5, 9], color: '#4a0f14', border: '#d4a64a' },
  },
  6: {
    wall: { kind: 'stone', color: '#8c94c4' }, height: 8, trim: '#454d80', windows: '#a5b4fc', ceiling: { color: '#10142e', beams: '#3b2a1a' },
    door: { x: -7, z: -12.9, glow: '#c7d2fe', frame: '#454d80' },
    chandeliers: [[-3.2, 6.3, -5], [3.2, 6.3, -5]],
  },
  7: {
    wall: { kind: 'stone', color: '#9a9a9a' }, height: 8, trim: '#555555', windows: '#fde68a', ceiling: { color: '#161616', beams: '#3a2a1c' },
    door: { x: -8, z: -12.9, glow: '#fde68a', frame: '#555555' },
  },
  8: {
    wall: { kind: 'stone', color: '#6f7088' }, height: 7, trim: '#3a3b4d', windows: null, ceiling: { color: '#08080e', beams: '#23232e' },
    sconces: '#a78bfa',
    door: { x: -6.3, z: -12.9, glow: '#c4b5fd', frame: '#3a3b4d' },
  },
  9: { parapet: 'balustrade', trim: '#5a6aa8', door: { x: -7, z: -12, glow: '#93c5fd', frame: '#5a6aa8' } },
  10: {
    wall: { kind: 'stone', color: '#b89468' }, height: 8.5, trim: '#6b4a24', windows: '#fbbf24', ceiling: { color: '#1c0f04', beams: '#4a2c10' },
    door: { x: -6, z: -12.9, glow: '#fcd34d', frame: '#6b4a24' },
    chandeliers: [[-4, 6.8, -5], [4, 6.8, -5]],
    rose: { position: [0, 6.9, -13.2], radius: 1.3, colors: ['#dc2626', '#fbbf24', '#2563eb', '#16a34a'] },
  },
  11: null,
  12: { wall: { kind: 'stone', color: '#8f84b8' }, height: 1.6, trim: '#4c4470', battlements: true, sconces: null, door: { x: -6, z: -13.1, glow: '#c4b5fd', frame: '#4c4470' } },
}
