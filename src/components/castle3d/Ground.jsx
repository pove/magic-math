import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { stoneTextures, glowTexture } from '../three/textures'
import { useQuality } from '../three/quality'
import GrassField from '../three/GrassField'
import { HORIZON } from './SkyDome'

/**
 * The castle's floating island: rolling meadow on top (wind-blown grass,
 * glowing flowers, pines, rocks, a flagstone path with lanterns up to the
 * door), a craggy rock root hanging underneath, little islets drifting
 * around it and a sea of clouds far below. Everything procedural.
 */

const R = 31 // island radius
const DOOR = [0, 9.9] // where the path ends (x, z)

// --- deterministic helpers ---------------------------------------------------

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function noise2(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function fbm2(x, y) {
  return noise2(x, y) * 0.55 + noise2(x * 2.1, y * 2.1) * 0.3 + noise2(x * 4.3, y * 4.3) * 0.15
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// --- the path ------------------------------------------------------------------

// A gentle S-curve from the island's rim round to the front door.
const PATH = (() => {
  const pts = []
  const n = 40
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const ang = Math.PI / 2 + (1 - t) * 1.1 + Math.sin(t * Math.PI * 2) * 0.12
    const dist = DOOR[1] + (1 - t) * (R - 2.5 - DOOR[1])
    pts.push([Math.cos(ang) * dist, Math.sin(ang) * dist])
  }
  return pts
})()

function distToPath(x, z) {
  let best = Infinity
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i]
    const [bx, bz] = PATH[i + 1]
    const dx = bx - ax
    const dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t))
    if (d < best) best = d
  }
  return best
}

/** The wedge in front of the entrance (+Z, where the camera usually looks
 *  from) is kept clear of trees so they never hide the door. */
function inFrontOfCastle(x, z) {
  return z > 0 && Math.abs(Math.atan2(x, z)) < 1.05
}

// --- terrain height ------------------------------------------------------------

const BASE_Y = 0.65

/** Height of the meadow at (x, z): flat around the castle, rolling hills
 *  further out, flattened along the path, rounding off at the rim. */
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z)
  let h = BASE_Y
  const hills = (fbm2(x * 0.075 + 3.1, z * 0.075 - 1.7) - 0.45) * 5.5
  h += hills * smoothstep(12.5, 21, r)
  const onPath = 1 - smoothstep(1.2, 3.2, distToPath(x, z))
  h = h * (1 - onPath * 0.8) + BASE_Y * onPath * 0.8
  // Level lawn in front of the gate (where the entrance room's characters
  // stand, and where the overview camera looks at the door from)
  const front = smoothstep(0, 4, z - 9) * (1 - smoothstep(6, 10, Math.abs(x)))
  h = h * (1 - front) + BASE_Y * front
  h -= smoothstep(R - 5, R, r) ** 2 * 2.2
  return h
}

/**
 * onBeforeCompile hook: dissolve a surface (ordered dither, no transparency
 * sorting needed) as the camera gets within a few units of it. Trees and
 * rocks sit inside the camera's orbit ring, so without this a low orbit
 * would clip into them and show their hollow insides.
 */
function fadeNearCamera(shader) {
  shader.fragmentShader = shader.fragmentShader.replace(
    'void main() {',
    `void main() {
      float camDist = length(vViewPosition);
      float keep = smoothstep(4.0, 5.5, camDist);
      float dither = fract(dot(floor(gl_FragCoord.xy), vec2(0.5, 0.25)) + fract(floor(gl_FragCoord.y) * 0.5) * 0.5);
      if (keep < 1.0 && dither > keep) discard;`
  )
}

// --- pieces ---------------------------------------------------------------------

function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(0.01, R, 160, 60)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const grassA = new THREE.Color('#1f5a3c')
    const grassB = new THREE.Color('#2f7a4d')
    const moss = new THREE.Color('#3a6b3a')
    const dirt = new THREE.Color('#5a4a52')
    const rock = new THREE.Color('#4b4566')
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, terrainHeight(x, z))
      const r = Math.hypot(x, z)
      const n = fbm2(x * 0.3, z * 0.3)
      c.copy(grassA).lerp(grassB, n)
      c.lerp(moss, smoothstep(0.6, 0.9, fbm2(x * 0.12 + 9, z * 0.12)) * 0.6)
      c.lerp(dirt, (1 - smoothstep(1.4, 2.6, distToPath(x, z))) * 0.85)
      c.lerp(dirt, (1 - smoothstep(10.5, 12.5, r)) * 0.55) // trodden ground by the walls
      c.lerp(rock, smoothstep(R - 3, R - 0.5, r))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  )
}

/** Craggy inverted-mountain root under the island, with rock strata. */
function IslandRoot() {
  const geometry = useMemo(() => {
    const profile = [
      [R + 0.4, -0.5], [R + 0.8, -1.6], [R * 0.93, -4], [R * 0.8, -8], [R * 0.64, -13],
      [R * 0.46, -19], [R * 0.3, -25], [R * 0.16, -31], [R * 0.05, -37], [0.01, -40],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    let g = new THREE.LatheGeometry(profile, 72)
    g = g.toNonIndexed()
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const dark = new THREE.Color('#231d38')
    const mid = new THREE.Color('#3b3358')
    const warm = new THREE.Color('#4a3a4f')
    const c = new THREE.Color()
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const depth = -v.y
      const len = Math.hypot(v.x, v.z)
      // Sample noise by compass direction (not angle) so the lathe's seam,
      // where the angle wraps from π to -π, doesn't tear open.
      const ux = len > 0.05 ? v.x / len : 0
      const uz = len > 0.05 ? v.z / len : 0
      // Radial crags that grow with depth + big lumpy bulges
      const crag = fbm2(ux * 4 + v.y * 0.35 + 11, uz * 4 - v.y * 0.2) - 0.5
      const lump = fbm2(ux * 1.3 + v.y * 0.06, uz * 1.3 + 4) - 0.5
      const push = crag * (1.5 + depth * 0.12) + lump * 6 * smoothstep(1, 8, depth)
      if (len > 0.05) {
        const k = Math.max(0.2, len + push) / len
        v.x *= k
        v.z *= k
      }
      v.y += (fbm2(ux * 2.5 + depth * 0.2, uz * 2.5) - 0.5) * 2 * smoothstep(2, 6, depth)
      pos.setXYZ(i, v.x, v.y, v.z)
      // Strata bands
      const band = 0.5 + 0.5 * Math.sin(depth * 1.3 + fbm2(ux * 3 + depth * 0.3, uz * 3) * 4)
      c.copy(dark).lerp(mid, band * 0.8).lerp(warm, smoothstep(0.55, 0.8, fbm2(ux * 1.5 + 5, uz * 1.5 + depth * 0.1)) * 0.5)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} flatShading />
    </mesh>
  )
}

/** Wind-blown meadow grass, avoiding the path and the castle walls. */
function Grass() {
  const q = useQuality()
  const place = (r) => {
    const a = r() * Math.PI * 2
    const rad = Math.sqrt(11.5 ** 2 + r() * ((R - 2.2) ** 2 - 11.5 ** 2))
    const x = Math.cos(a) * rad
    const z = Math.sin(a) * rad
    if (distToPath(x, z) < 1.6) return null
    // Keep the level lawn before the gate clear: it's where the entrance
    // room's characters stand and its camera sits
    if (z > 16 && Math.abs(x) < 8.5) return null
    return [x, terrainHeight(x, z), z]
  }
  return <GrassField count={Math.round(9000 * q.grass)} place={place} />
}

/** Little bioluminescent flowers dotted through the meadow (bloom candy). */
function GlowFlowers() {
  const mesh = useRef()
  const COUNT = 220
  useLayoutEffect(() => {
    const r = rng(5)
    const dummy = new THREE.Object3D()
    const palette = ['#f0abfc', '#67e8f9', '#fde68a', '#a5b4fc'].map((h) => new THREE.Color(h).multiplyScalar(3))
    for (let i = 0; i < COUNT; i++) {
      let x, z
      do {
        const a = r() * Math.PI * 2
        const rad = 12 + r() * (R - 15)
        x = Math.cos(a) * rad
        z = Math.sin(a) * rad
      } while (distToPath(x, z) < 1.8)
      dummy.position.set(x, terrainHeight(x, z) + 0.25 + r() * 0.2, z)
      const s = 0.5 + r() * 0.7
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      mesh.current.setColorAt(i, palette[Math.floor(r() * palette.length)])
    }
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <icosahedronGeometry args={[0.07, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/** Layered pines, instanced: trunk + three foliage tiers = 4 draw calls. */
function Pines() {
  const trunks = useRef()
  const tiers = [useRef(), useRef(), useRef(), useRef()]

  const spots = useMemo(() => {
    const r = rng(42)
    const out = []
    let guard = 0
    while (out.length < 42 && guard++ < 2000) {
      const a = r() * Math.PI * 2
      const rad = 14 + r() * (R - 17.5)
      const x = Math.cos(a) * rad
      const z = Math.sin(a) * rad
      if (distToPath(x, z) < 3) continue
      if (inFrontOfCastle(x, z)) continue
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 2.6)) continue
      out.push({ x, z, y: terrainHeight(x, z), s: 0.75 + r() * 0.75, rot: r() * Math.PI, hue: r() })
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const c = new THREE.Color()
    spots.forEach((t, i) => {
      dummy.position.set(t.x, t.y - 0.1, t.z)
      dummy.rotation.set(0, t.rot, 0)
      dummy.scale.setScalar(t.s)
      dummy.updateMatrix()
      trunks.current.setMatrixAt(i, dummy.matrix)
      tiers.forEach((ref) => {
        ref.current.setMatrixAt(i, dummy.matrix)
        c.setHSL(0.37 + t.hue * 0.06, 0.55, 0.17 + t.hue * 0.07)
        ref.current.setColorAt(i, c)
      })
    })
    ;[trunks, ...tiers].forEach((ref) => {
      ref.current.instanceMatrix.needsUpdate = true
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    })
  }, [spots])

  // Each tier is a cone whose skirt alternates long and short boughs in a
  // star pattern, the long ones drooping. Driven purely by each vertex's
  // angle, so the side and the base cap (which duplicate the rim vertices)
  // always move together — no cracks, no loose spikes. A vertex-colour
  // gradient darkens the underside and lightens the tip for depth.
  const tierGeo = useMemo(
    () =>
      [
        [1.75, 2.2, 1.75],
        [1.4, 2.0, 2.75],
        [1.05, 1.8, 3.65],
        [0.65, 1.5, 4.5],
      ].map(([rad, h, y]) => {
        const SEG = 14
        const g = new THREE.ConeGeometry(rad, h, SEG, 1)
        const p = g.attributes.position
        const col = new Float32Array(p.count * 3)
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i)
          const z = p.getZ(i)
          const len = Math.hypot(x, z)
          if (len > 0.01) {
            const idx = Math.round(Math.atan2(z, x) / ((Math.PI * 2) / SEG))
            const long = ((idx % 2) + 2) % 2 === 0
            const k = long ? 1 : 0.72
            p.setX(i, x * k)
            p.setZ(i, z * k)
            if (long) p.setY(i, p.getY(i) - 0.22)
          }
          const up = (p.getY(i) + h / 2) / h // 0 at the skirt, 1 at the tip
          const shade = len > 0.01 || p.getY(i) < 0 ? 0.55 + up * 0.35 : 1.15
          col.set([shade, shade, shade], i * 3)
        }
        g.setAttribute("color", new THREE.BufferAttribute(col, 3))
        g.computeVertexNormals()
        g.translate(0, y, 0)
        return g
      }),
    []
  )

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.3, 1.8, 7]} />
        <meshStandardMaterial color="#4a2f1f" roughness={0.95} onBeforeCompile={fadeNearCamera} />
      </instancedMesh>
      {tierGeo.map((g, i) => (
        <instancedMesh key={i} ref={tiers[i]} args={[g, undefined, spots.length]} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.9} envMapIntensity={0.25} flatShading onBeforeCompile={fadeNearCamera} />
        </instancedMesh>
      ))}
    </group>
  )
}

/** Mossy boulders. */
function Rocks() {
  const mesh = useRef()
  const COUNT = 18
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.9, 1)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      v.multiplyScalar(0.8 + noise2(v.x * 2 + 5, v.z * 2 + v.y) * 0.45)
      v.y *= 0.7
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
  useLayoutEffect(() => {
    const r = rng(17)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < COUNT; i++) {
      let x, z
      do {
        const a = r() * Math.PI * 2
        const rad = 12 + r() * (R - 14)
        x = Math.cos(a) * rad
        z = Math.sin(a) * rad
      } while (distToPath(x, z) < 2.2 || inFrontOfCastle(x, z))
      dummy.position.set(x, terrainHeight(x, z) + 0.1, z)
      dummy.rotation.set(r(), r() * 6, r())
      dummy.scale.setScalar(0.5 + r() * 1.1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} castShadow receiveShadow>
      <meshStandardMaterial color="#6a6488" roughness={0.95} flatShading onBeforeCompile={fadeNearCamera} />
    </instancedMesh>
  )
}

/** Flagstones along the path, following the terrain. */
function PathStones() {
  const mesh = useRef()
  const tex = useMemo(() => stoneTextures(0.4, 0.4), [])
  const stones = useMemo(() => {
    const r = rng(8)
    const out = []
    for (let i = 0; i < PATH.length - 1; i++) {
      const [ax, az] = PATH[i]
      const [bx, bz] = PATH[i + 1]
      const heading = Math.atan2(bx - ax, bz - az)
      for (let k = 0; k < 2; k++) {
        const t = k / 2
        const side = (r() - 0.5) * 1.1
        const x = ax + (bx - ax) * t + Math.cos(heading) * side
        const z = az + (bz - az) * t - Math.sin(heading) * side
        out.push({ x, z, rot: heading + (r() - 0.5) * 0.6, s: 0.8 + r() * 0.5 })
      }
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    stones.forEach((s, i) => {
      dummy.position.set(s.x, terrainHeight(s.x, s.z) + 0.05, s.z)
      dummy.rotation.set(0, s.rot, 0)
      dummy.scale.set(s.s, 1, s.s * 0.8)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [stones])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, stones.length]} receiveShadow>
      <cylinderGeometry args={[0.55, 0.6, 0.16, 7]} />
      <meshStandardMaterial {...tex} color="#b3abc9" roughness={0.9} />
    </instancedMesh>
  )
}

/** Iron lamp posts with glowing lanterns lining the path. */
function Lanterns() {
  const spots = useMemo(() => {
    const out = []
    for (let i = 4; i < PATH.length - 3; i += 7) {
      const [ax, az] = PATH[i]
      const [bx, bz] = PATH[i + 1]
      const heading = Math.atan2(bx - ax, bz - az)
      const side = (i / 7) % 2 ? 1.9 : -1.9
      const x = ax + Math.cos(heading) * side
      const z = az - Math.sin(heading) * side
      out.push([x, terrainHeight(x, z), z])
    }
    return out
  }, [])
  const glow = glowTexture()
  return (
    <group>
      {spots.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 2.2, 6]} />
            <meshStandardMaterial color="#1f1b2e" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <boxGeometry args={[0.34, 0.42, 0.34]} />
            <meshStandardMaterial color="#1f1b2e" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <boxGeometry args={[0.26, 0.34, 0.36]} />
            <meshBasicMaterial color={[4, 2.4, 0.9]} toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.35, 0]}>
            <boxGeometry args={[0.36, 0.34, 0.26]} />
            <meshBasicMaterial color={[4, 2.4, 0.9]} toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.65, 0]}>
            <coneGeometry args={[0.28, 0.25, 4]} />
            <meshStandardMaterial color="#1f1b2e" metalness={0.6} roughness={0.5} />
          </mesh>
          <sprite position={[0, 2.35, 0]} scale={[2.2, 2.2, 1]}>
            <spriteMaterial map={glow} color="#ffb347" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
      {/* Two real lights keep the cost down; the rest is emissive + bloom */}
      {spots.slice(0, 2).map((p, i) => (
        <pointLight key={i} position={[p[0], p[1] + 2.4, p[2]]} color="#ffb347" intensity={6} distance={9} decay={2} />
      ))}
    </group>
  )
}

/** Small rocky islets bobbing around the main island. */
function Islets() {
  const group = useRef()
  const islets = useMemo(() => {
    const r = rng(3)
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + r() * 0.5
      const dist = R + 9 + r() * 16
      return { a, dist, y: -6 + r() * 16, s: 0.8 + r() * 1.8, phase: r() * 6, speed: 0.01 + r() * 0.015 }
    })
  }, [])
  // Rock: closed on top (profile starts at the axis) and jittered by
  // compass direction so the rim the grass sits on stays predictable.
  const rockGeo = useMemo(() => {
    const profile = [[0.01, 0.12], [2.25, 0.12], [2.4, -0.4], [1.8, -1.6], [1, -3.2], [0.3, -4.5], [0.01, -5]].map(([x, y]) => new THREE.Vector2(x, y))
    let g = new THREE.LatheGeometry(profile, 12).toNonIndexed()
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i)
      const len = Math.hypot(x, z)
      if (len < 0.05 || p.getY(i) > 0) continue // keep the top flat under the turf
      const k = 1 + (noise2((x / len) * 1.5 + 2, p.getY(i) * 0.9 + (z / len) * 1.5) - 0.5) * 0.6
      p.setX(i, x * k)
      p.setZ(i, z * k)
    }
    g.computeVertexNormals()
    return g
  }, [])
  // Turf: a low, lumpy dome that hugs the rim instead of a raised disc
  const turfGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 16, 5, 0, Math.PI * 2, 0, Math.PI / 2)
    g.scale(2.4, 0.42, 2.4)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i)
      if (y > 0.02) p.setY(i, y * (0.7 + noise2(p.getX(i) * 1.7, p.getZ(i) * 1.7) * 0.7))
    }
    g.computeVertexNormals()
    return g
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    group.current?.children.forEach((c, i) => {
      const it = islets[i]
      const a = it.a + t * it.speed
      c.position.set(Math.cos(a) * it.dist, it.y + Math.sin(t * 0.5 + it.phase) * 0.8, Math.sin(a) * it.dist)
      c.rotation.y = t * it.speed * 2
    })
  })

  return (
    <group ref={group}>
      {islets.map((it, i) => (
        <group key={i} scale={it.s}>
          <mesh geometry={rockGeo}>
            <meshStandardMaterial color="#3b3358" roughness={1} flatShading />
          </mesh>
          <mesh geometry={turfGeo} position={[0, 0.08, 0]}>
            <meshStandardMaterial color="#2a7048" roughness={0.95} flatShading />
          </mesh>
          {/* A little pine on the bigger islets */}
          {it.s > 1.3 && (
            <group position={[0.5, 0.3, -0.3]} scale={0.55}>
              <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.15, 0.22, 1.2, 6]} />
                <meshStandardMaterial color="#4a2f1f" roughness={0.95} />
              </mesh>
              <mesh position={[0, 1.9, 0]}>
                <coneGeometry args={[1.2, 2.2, 8]} />
                <meshStandardMaterial color="#1f5c3f" roughness={0.85} flatShading />
              </mesh>
              <mesh position={[0, 3.0, 0]}>
                <coneGeometry args={[0.8, 1.7, 8]} />
                <meshStandardMaterial color="#25704a" roughness={0.85} flatShading />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

const cloudVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const cloudFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uShade;
  uniform float uOpacity;
  uniform float uScale;
  varying vec2 vUv;
  varying vec3 vWorld;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += noise(p) * a; p = p * 2.02 + 7.3; a *= 0.5; } return s; }
  void main() {
    vec2 p = vWorld.xz * uScale;
    float n = fbm(p + vec2(uTime * 0.012, uTime * 0.006));
    float n2 = fbm(p * 1.7 - vec2(uTime * 0.008, 0.0));
    float d = smoothstep(0.38, 0.75, n * 0.7 + n2 * 0.4);
    float dist = length(vWorld.xz);
    float fade = smoothstep(420.0, 120.0, dist);
    vec3 col = mix(uShade, uColor, smoothstep(0.4, 0.9, n2));
    gl_FragColor = vec4(col, d * fade * uOpacity);
  }
`

/** Sea of clouds far below — two layers for parallax as the camera orbits. */
function CloudSea() {
  const mats = useMemo(
    () =>
      [
        { color: '#5b4a9e', shade: '#221a4a', opacity: 0.95, scale: 0.018 },
        { color: '#8b7bd8', shade: '#3a2f7a', opacity: 0.55, scale: 0.03 },
      ].map(
        (o) =>
          new THREE.ShaderMaterial({
            vertexShader: cloudVertex,
            fragmentShader: cloudFragment,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(o.color) },
              uShade: { value: new THREE.Color(o.shade) },
              uOpacity: { value: o.opacity },
              uScale: { value: o.scale },
            },
          })
      ),
    []
  )
  useFrame((state) => mats.forEach((m) => (m.uniforms.uTime.value = state.clock.elapsedTime)))
  return (
    <group>
      <mesh material={mats[0]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -46, 0]}>
        <planeGeometry args={[900, 900]} />
      </mesh>
      <mesh material={mats[1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -36, 0]}>
        <planeGeometry args={[900, 900]} />
      </mesh>
    </group>
  )
}

/** Soft cloud wisps drifting around the tower at different heights. */
function Wisps() {
  const group = useRef()
  const puff = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const r = rng(12)
    for (let i = 0; i < 14; i++) {
      const x = 60 + r() * 136
      const y = 90 + r() * 70
      const rad = 30 + r() * 50
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(255,255,255,0.35)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 256, 256)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  const wisps = useMemo(() => {
    const r = rng(77)
    return Array.from({ length: 16 }, () => ({
      a: r() * Math.PI * 2,
      // Beyond the camera's max orbit distance, so a wisp never drifts
      // between the camera and the castle and fogs it over.
      dist: 95 + r() * 60,
      y: -4 + r() * 70,
      s: 30 + r() * 30,
      speed: (0.006 + r() * 0.01) * (r() < 0.5 ? 1 : -1),
      o: 0.18 + r() * 0.2,
    }))
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    group.current?.children.forEach((c, i) => {
      const w = wisps[i]
      const a = w.a + t * w.speed
      c.position.set(Math.cos(a) * w.dist, w.y, Math.sin(a) * w.dist)
    })
  })
  return (
    <group ref={group}>
      {wisps.map((w, i) => (
        <sprite key={i} scale={[w.s, w.s * 0.5, 1]}>
          <spriteMaterial map={puff} color="#b9a8ff" transparent opacity={w.o} depthWrite={false} fog />
        </sprite>
      ))}
    </group>
  )
}

export default function Ground() {
  return (
    <group>
      <Terrain />
      <IslandRoot />
      <Grass />
      <GlowFlowers />
      <Pines />
      <Rocks />
      <PathStones />
      <Lanterns />
      <Islets />
      <CloudSea />
      <Wisps />
      {/* Mist hugging the rim, tinted like the horizon */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R - 2, R + 14, 64]} />
        <meshBasicMaterial color={HORIZON} transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  )
}

