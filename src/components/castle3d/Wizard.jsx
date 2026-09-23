import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runeBandTexture, glowTexture } from '../three/textures'

/**
 * The Director Mago — the game's emotional anchor, in 3D.
 *
 * Pure procedural geometry (no assets) but built like a proper character:
 * a velvet robe with real folds and a glowing rune hem, a cape, bell
 * sleeves, a long beard, half-moon spectacles, bushy expressive eyebrows,
 * a curved floppy hat with a wavy brim, and a gnarled staff holding a
 * glowing crystal.
 *
 * Everything is posed from a small set of joints (body, head, both
 * shoulders/elbows, the staff) that ease towards per-mood target poses each
 * frame, so switching mood blends smoothly instead of snapping:
 *
 *   mood: 'idle' | 'talk' | 'cheer' | 'sad' | 'cast' | 'wave'
 *
 * Feet at y = 0; about 2.2 units to the hat tip at scale 1 (the player's
 * characters are 1.5 — a tall wizard, hat included).
 */

const ROBE = '#5b21b6'
const ROBE_DARK = '#2e1065'
const ROBE_LIGHT = '#7c3aed'
const GOLD = '#fbbf24'
const SKIN = '#f2c9a0'
const BLUSH = '#f0a58c'
const HAIR = '#eef0f4'

// --- geometry helpers ---------------------------------------------------------

/** Robe silhouette: radius at a given height (feet → neck). */
const ROBE_PROFILE = [
  [0.44, 0.0], [0.43, 0.04], [0.4, 0.2], [0.35, 0.42], [0.3, 0.62], [0.265, 0.8],
  [0.25, 0.95], [0.245, 1.05], [0.235, 1.12], [0.19, 1.19], [0.11, 1.235], [0.06, 1.25],
]
function robeRadius(y) {
  for (let i = 0; i < ROBE_PROFILE.length - 1; i++) {
    const [r0, y0] = ROBE_PROFILE[i]
    const [r1, y1] = ROBE_PROFILE[i + 1]
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return 0.06
}

function robeGeometry() {
  const pts = []
  // Resample the profile finely so the folds deform smoothly
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * 1.25
    pts.push(new THREE.Vector2(robeRadius(y), y))
  }
  const g = new THREE.LatheGeometry(pts, 64)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const a = Math.atan2(x, z)
    const low = Math.max(0, 1 - y / 0.95) // folds fade out towards the chest
    // Vertical folds, deeper at the hem; the hem itself undulates
    const fold = 1 + (Math.sin(a * 9) * 0.045 + Math.sin(a * 4 + 1.3) * 0.03) * low
    p.setX(i, x * fold)
    p.setZ(i, z * fold)
    if (y < 0.02) p.setY(i, y + (Math.sin(a * 9) * 0.5 + 0.5) * 0.035)
  }
  g.computeVertexNormals()
  return g
}

/** Cone that bends along a curve and tapers to a point — the floppy hat. */
function bentConeGeometry({ base = 0.235, height = 0.72, lean = [0.2, -0.1], rings = 20, seg = 28 }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, height * 0.62, 0),
    new THREE.Vector3(lean[0], height, lean[1])
  )
  const positions = []
  const indices = []
  const up = new THREE.Vector3()
  const side = new THREE.Vector3()
  const fwd = new THREE.Vector3()
  for (let r = 0; r <= rings; r++) {
    const t = r / rings
    const c = curve.getPoint(t)
    const tan = curve.getTangent(t).normalize()
    // Build a stable frame around the tangent
    side.set(1, 0, 0).sub(tan.clone().multiplyScalar(tan.x)).normalize()
    fwd.crossVectors(side, tan).normalize()
    // Taper with a little crumple partway up
    const radius = base * Math.pow(1 - t, 1.15) * (1 + Math.sin(t * Math.PI * 3) * 0.05 * (1 - t)) + 0.004
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2
      up.copy(side).multiplyScalar(Math.cos(a) * radius).addScaledVector(fwd, Math.sin(a) * radius)
      positions.push(c.x + up.x, c.y + up.y, c.z + up.z)
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < seg; s++) {
      const a = r * (seg + 1) + s
      const b = a + seg + 1
      indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return { geometry: g, tip: curve.getPoint(1) }
}

/** Wide, slightly drooping brim with a wavy edge. */
function brimGeometry() {
  const g = new THREE.RingGeometry(0.12, 0.42, 48, 3)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const r = Math.hypot(x, z)
    const a = Math.atan2(z, x)
    const k = (r - 0.12) / 0.3
    p.setY(i, -k * k * 0.07 + Math.sin(a * 5) * 0.018 * k)
  }
  g.computeVertexNormals()
  return g
}

/**
 * Long, soft beard: a sphere reshaped into a teardrop — a rounded top that
 * hugs the jaw and a long tapering point that curls slightly forward. Top at
 * y = 0, hanging down to y = -length.
 */
function beardGeometry({ width = 0.15, depth = 0.085, top = 0.05, length = 0.46 } = {}) {
  const g = new THREE.SphereGeometry(1, 28, 24)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i)
    let y = p.getY(i)
    let z = p.getZ(i)
    if (y < 0) {
      const taper = Math.pow(1 + y, 0.75) // 1 at the equator → 0 at the tip
      x *= taper
      z *= taper
    }
    const t = y < 0 ? -y : 0 // 0 at the jaw → 1 at the tip
    // Soft vertical strands
    const strand = 1 + Math.sin(Math.atan2(x, z) * 14) * 0.035 * t
    x *= width * strand
    // Drift forward as it hangs so it lies over the chest, curling at the tip
    z = z * depth * strand + t * 0.1 + t * t * 0.05
    y = y >= 0 ? y * top : y * length
    p.setXYZ(i, x, y, z)
  }
  g.translate(0, -top, 0)
  g.computeVertexNormals()
  return g
}

/** A gnarled wooden shaft along a wobbly curve. */
function staffGeometry() {
  const pts = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    pts.push(new THREE.Vector3(Math.sin(t * 9) * 0.015, t * 1.75, Math.cos(t * 7) * 0.012))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const g = new THREE.TubeGeometry(curve, 48, 0.024, 8, false)
  // Knots: bulge the radius in a few places
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const knot = Math.exp(-Math.pow((v.y - 0.55) * 18, 2)) + Math.exp(-Math.pow((v.y - 1.15) * 16, 2)) * 0.8
    const c = curve.getPoint(THREE.MathUtils.clamp(v.y / 1.75, 0, 1))
    v.x = c.x + (v.x - c.x) * (1 + knot * 0.5)
    v.z = c.z + (v.z - c.z) * (1 + knot * 0.5)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

function starShape(outer = 1, inner = 0.42) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  s.closePath()
  return s
}

// --- poses --------------------------------------------------------------------
//
// Arms hang along -Y from the shoulder. Shoulder rotation x < 0 swings the
// arm forward, z swings it outward (sign mirrored per side); elbow x < 0
// bends the forearm forward. `staff` is the staff's world-ish tilt
// (x = lean towards the camera, z = lean outward) and `lift` raises it.

const POSES = {
  idle: {
    body: { y: 0, lean: 0 },
    head: { x: 0.04, y: 0, z: 0 },
    staffArm: { x: -0.35, z: 0.32, elbow: -0.65 },
    freeArm: { x: -0.12, z: 0.14, elbow: -0.5 },
    staff: { x: 0.05, z: 0.08, lift: 0 },
    brows: 0,
    orb: 1,
  },
  talk: {
    body: { y: 0, lean: 0.03 },
    head: { x: 0, y: 0, z: 0.04 },
    staffArm: { x: -0.35, z: 0.32, elbow: -0.65 },
    freeArm: { x: -1.0, z: 0.35, elbow: -1.2 },
    staff: { x: 0.05, z: 0.08, lift: 0 },
    brows: 0.25,
    orb: 1.2,
  },
  cheer: {
    body: { y: 0.06, lean: -0.05 },
    head: { x: -0.25, y: 0, z: 0 },
    staffArm: { x: -2.7, z: 0.35, elbow: -0.25 },
    freeArm: { x: -2.4, z: 0.55, elbow: -0.35 },
    staff: { x: 0.1, z: 0.15, lift: 0.75 },
    brows: 0.6,
    orb: 2,
  },
  sad: {
    body: { y: -0.02, lean: 0.12 },
    head: { x: 0.1, y: 0, z: 0.1 },
    staffArm: { x: -0.4, z: 0.2, elbow: -0.8 },
    freeArm: { x: -0.75, z: -0.2, elbow: -1.25 }, // hand resting on the beard
    staff: { x: 0.12, z: 0.12, lift: -0.05 },
    brows: -0.7,
    orb: 0.45,
  },
  cast: {
    body: { y: 0, lean: -0.04 },
    head: { x: -0.05, y: 0.15, z: 0 },
    staffArm: { x: -1.5, z: 0.12, elbow: -0.15 },
    freeArm: { x: -0.7, z: 0.6, elbow: -0.6 },
    staff: { x: 1.2, z: 0.05, lift: 0.35 },
    brows: 0.4,
    orb: 2.2,
  },
  wave: {
    body: { y: 0, lean: -0.02 },
    head: { x: 0, y: -0.1, z: -0.06 },
    staffArm: { x: -0.35, z: 0.32, elbow: -0.65 },
    freeArm: { x: -0.35, z: 2.5, elbow: -0.5 },
    staff: { x: 0.05, z: 0.08, lift: 0 },
    brows: 0.45,
    orb: 1.4,
  },
}

const damp = THREE.MathUtils.damp

// --- pieces -------------------------------------------------------------------

function Sleeve({ side, robeMat, liningMat, trimMat, skinMat, shoulderRef, elbowRef, handRef, children }) {
  // side: +1 = staff arm (+X), -1 = free arm (-X)
  return (
    <group ref={shoulderRef} position={[side * 0.235, 1.14, 0]}>
      <mesh material={robeMat} castShadow>
        <sphereGeometry args={[0.085, 16, 12]} />
      </mesh>
      <mesh position={[0, -0.16, 0]} material={robeMat} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.32, 14]} />
      </mesh>
      <group ref={elbowRef} position={[0, -0.32, 0]}>
        <mesh material={robeMat} castShadow>
          <sphereGeometry args={[0.08, 14, 10]} />
        </mesh>
        {/* Bell sleeve flaring toward the wrist */}
        <mesh position={[0, -0.14, 0]} material={robeMat} castShadow>
          <cylinderGeometry args={[0.085, 0.125, 0.28, 18, 1, true]} />
        </mesh>
        {/* Dark lining visible inside the cuff */}
        <mesh position={[0, -0.14, 0]} material={liningMat}>
          <cylinderGeometry args={[0.082, 0.121, 0.28, 18, 1, true]} />
        </mesh>
        <group ref={handRef} position={[0, -0.31, 0]}>
          <mesh material={skinMat} scale={[1, 1.15, 0.8]}>
            <sphereGeometry args={[0.055, 14, 10]} />
          </mesh>
          <mesh position={[side * -0.04, 0.01, 0.03]} rotation={[0, 0, side * 0.6]} material={skinMat}>
            <capsuleGeometry args={[0.016, 0.03, 4, 8]} />
          </mesh>
          {children}
        </group>
      </group>
    </group>
  )
}

function Staff({ staffRef, crystalRef, orbLightRef, haloRef, sparkRefs }) {
  const shaft = useMemo(staffGeometry, [])
  const glow = glowTexture()
  return (
    <group ref={staffRef}>
      {/* The hand grips here; the shaft runs down to the ground and up past the hat */}
      <group position={[0, -0.95, 0]}>
        <mesh geometry={shaft} castShadow>
          <meshStandardMaterial color="#6b4423" roughness={0.85} />
        </mesh>
        <group position={[0, 1.75, 0]}>
          {/* Carved claw cradling the crystal */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0.55, (i / 4) * Math.PI * 2, 0]} position={[0, 0.02, 0]}>
              <coneGeometry args={[0.018, 0.2, 6]} />
              <meshStandardMaterial color="#5a381c" roughness={0.8} />
            </mesh>
          ))}
          <mesh ref={crystalRef} position={[0, 0.14, 0]} scale={[1, 1.6, 1]}>
            <octahedronGeometry args={[0.075, 0]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={3} roughness={0.1} metalness={0.2} flatShading />
          </mesh>
          <sprite ref={haloRef} position={[0, 0.14, 0]} scale={[0.9, 0.9, 1]}>
            <spriteMaterial map={glow} color="#7dd3fc" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} ref={(el) => (sparkRefs.current[i] = el)} position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshBasicMaterial color={[3, 3.2, 3.6]} toneMapped={false} />
            </mesh>
          ))}
          <pointLight ref={orbLightRef} position={[0, 0.16, 0]} color="#7dd3fc" intensity={2} distance={4} />
        </group>
      </group>
    </group>
  )
}

function Face({ eyesRef, browLRef, browRRef, mouthRef, skinMat }) {
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), [])
  const iris = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b6fb6', roughness: 0.3 }), [])
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.25 }), [])
  const hair = useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.95 }), [])
  const blush = useMemo(() => new THREE.MeshStandardMaterial({ color: BLUSH, roughness: 0.8, transparent: true, opacity: 0.55 }), [])
  return (
    <group>
      {/* Head */}
      <mesh material={skinMat} scale={[1, 1.08, 1]} castShadow>
        <sphereGeometry args={[0.16, 28, 22]} />
      </mesh>
      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.155, 0.0, 0]} scale={[0.5, 1, 0.8]} material={skinMat}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
      ))}
      {/* Big friendly nose */}
      <mesh position={[0, -0.02, 0.158]} scale={[0.9, 1.05, 1.15]} material={skinMat}>
        <sphereGeometry args={[0.042, 16, 12]} />
      </mesh>
      {/* Rosy cheeks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.085, -0.03, 0.125]} scale={[1, 0.7, 0.4]} material={blush}>
          <sphereGeometry args={[0.035, 12, 8]} />
        </mesh>
      ))}
      {/* Eyes — the group scales on Y to blink */}
      <group ref={eyesRef} position={[0, 0.035, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.056, 0, 0.128]}>
            <mesh material={white}>
              <sphereGeometry args={[0.03, 16, 12]} />
            </mesh>
            <mesh position={[0, 0, 0.022]} material={iris}>
              <sphereGeometry args={[0.014, 12, 8]} />
            </mesh>
            <mesh position={[0, 0, 0.032]}>
              <sphereGeometry args={[0.006, 8, 6]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          </group>
        ))}
      </group>
      {/* Half-moon spectacles */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.056, 0.02, 0.17]} material={gold}>
          <torusGeometry args={[0.036, 0.0045, 6, 20, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[0, 0.028, 0.176]} rotation={[0, 0, Math.PI / 2]} material={gold}>
        <cylinderGeometry args={[0.004, 0.004, 0.04, 6]} />
      </mesh>
      {/* Bushy eyebrows — tilt with the mood */}
      <group ref={browLRef} position={[-0.058, 0.085, 0.14]}>
        <mesh material={hair} scale={[1, 0.5, 0.6]}>
          <capsuleGeometry args={[0.02, 0.05, 4, 8]} />
        </mesh>
      </group>
      <group ref={browRRef} position={[0.058, 0.085, 0.14]}>
        <mesh material={hair} scale={[1, 0.5, 0.6]}>
          <capsuleGeometry args={[0.02, 0.05, 4, 8]} />
        </mesh>
      </group>
      {/* Mouth (opens when talking) */}
      <mesh ref={mouthRef} position={[0, -0.085, 0.14]} scale={[1, 0.25, 0.5]}>
        <sphereGeometry args={[0.03, 14, 10]} />
        <meshStandardMaterial color="#5b1a1a" roughness={0.9} />
      </mesh>
      {/* Curly moustache */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.045, -0.058, 0.15]} rotation={[0, s * 0.35, s * -1.15]} material={hair}>
          <capsuleGeometry args={[0.022, 0.06, 4, 10]} />
        </mesh>
      ))}
      {/* Side and back hair under the hat */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.13, -0.02, -0.04]} scale={[0.7, 1.3, 1]} material={hair}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -0.02, -0.1]} scale={[1.3, 1.2, 0.8]} material={hair}>
        <sphereGeometry args={[0.1, 14, 10]} />
      </mesh>
    </group>
  )
}

function Hat({ tipRef }) {
  const { geometry: cone, tip } = useMemo(() => bentConeGeometry({}), [])
  const brim = useMemo(brimGeometry, [])
  const star = useMemo(() => starShape(), [])
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: ROBE, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color('#c4b5fd'), sheenRoughness: 0.45, side: THREE.DoubleSide }),
    []
  )
  return (
    <group>
      <mesh geometry={brim} material={mat} castShadow />
      <group ref={tipRef}>
        <mesh geometry={cone} material={mat} castShadow />
        {/* Glowing star dangling from the tip */}
        <mesh position={[tip.x + 0.02, tip.y - 0.03, tip.z]} rotation={[0, 0, 0.3]} scale={0.035}>
          <extrudeGeometry args={[star, { depth: 0.4, bevelEnabled: false }]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2.2} />
        </mesh>
        {/* Embroidered stars on the cone */}
        {[
          [0.02, 0.2, 0.19, 0.05],
          [-0.12, 0.33, 0.12, 0.035],
          [0.09, 0.44, 0.08, 0.03],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[-0.25, Math.atan2(x, z), i]} scale={s}>
            <extrudeGeometry args={[star, { depth: 0.15, bevelEnabled: false }]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.9} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* Gold band with a star buckle */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.232, 0.24, 0.05, 32, 1, true]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} emissive={GOLD} emissiveIntensity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.035, 0.24]} scale={0.045}>
        <extrudeGeometry args={[star, { depth: 0.4, bevelEnabled: false }]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

// --- the wizard ---------------------------------------------------------------

export default function Wizard({ position = [0, 0, 0], rotation = 0, scale = 1, mood = 'idle', talking = false }) {
  const root = useRef()
  const body = useRef()
  const head = useRef()
  const hatTip = useRef()
  const beard = useRef()
  const cape = useRef()
  const eyes = useRef()
  const browL = useRef()
  const browR = useRef()
  const mouth = useRef()
  const staffShoulder = useRef()
  const staffElbow = useRef()
  const staffHand = useRef()
  const freeShoulder = useRef()
  const freeElbow = useRef()
  const freeHand = useRef()
  const staff = useRef()
  const crystal = useRef()
  const orbLight = useRef()
  const halo = useRef()
  const sparks = useRef([])

  // Live, eased copy of the current pose
  const cur = useRef(null)
  const blink = useRef({ next: 2 + Math.random() * 3, t: 0 })
  const seed = useMemo(() => Math.random() * 100, [])
  const tmp = useMemo(
    () => ({ q: new THREE.Quaternion(), target: new THREE.Quaternion(), e: new THREE.Euler(), rootQ: new THREE.Quaternion(), v: new THREE.Vector3() }),
    []
  )

  const mats = useMemo(() => {
    const runes = runeBandTexture(3)
    return {
      robe: new THREE.MeshPhysicalMaterial({ color: ROBE, roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#c4b5fd'), sheenRoughness: 0.5 }),
      robeInner: new THREE.MeshStandardMaterial({ color: ROBE_DARK, roughness: 0.9, side: THREE.BackSide }),
      cape: new THREE.MeshPhysicalMaterial({ color: ROBE_LIGHT, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color('#ddd6fe'), sheenRoughness: 0.4, side: THREE.DoubleSide }),
      trim: new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.3, emissive: GOLD, emissiveIntensity: 0.3 }),
      hem: new THREE.MeshStandardMaterial({ color: '#3b2a0a', metalness: 0.6, roughness: 0.4, emissive: GOLD, emissiveMap: runes, emissiveIntensity: 2.2, side: THREE.DoubleSide }),
      skin: new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.6 }),
      beard: new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.95 }),
      leather: new THREE.MeshStandardMaterial({ color: '#4a2c17', roughness: 0.7 }),
    }
  }, [])
  const robe = useMemo(robeGeometry, [])
  const beardGeo = useMemo(beardGeometry, [])
  const star = useMemo(() => starShape(), [])

  // Embroidered stars scattered over the robe, sitting on its surface
  const robeStars = useMemo(() => {
    const spots = [
      [0.25, 0.3], [-0.45, 0.18], [0.7, 0.5], [-0.15, 0.55], [1.2, 0.25], [-1.0, 0.4], [0.05, 0.12], [-0.6, 0.62],
    ]
    return spots.map(([a, y], i) => {
      const r = robeRadius(y) + 0.008
      return { pos: [Math.sin(a) * r, y, Math.cos(a) * r], rotY: a, s: 0.028 + (i % 3) * 0.008 }
    })
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime + seed
    const target = POSES[mood] || POSES.idle
    if (!cur.current) cur.current = JSON.parse(JSON.stringify(target))
    const c = cur.current
    const k = 6 // pose blend speed
    // Ease every number in the current pose towards the target pose
    for (const part of Object.keys(target)) {
      if (typeof target[part] === 'number') c[part] = damp(c[part], target[part], k, dt)
      else for (const key of Object.keys(target[part])) c[part][key] = damp(c[part][key], target[part][key], k, dt)
    }

    // Body: breathing, mood bounce, lean
    const cheering = mood === 'cheer'
    const bounce = cheering ? Math.abs(Math.sin(t * 7)) * 0.08 : 0
    body.current.position.y = c.body.y + bounce + Math.sin(t * 1.6) * 0.006
    body.current.rotation.x = c.body.lean
    body.current.rotation.z = Math.sin(t * 0.7) * 0.015
    body.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.008, 1)

    // Head: mood pose + idle glances + nods when talking, head shake when sad
    const talkNod = talking || mood === 'talk' ? Math.sin(t * 5.5) * 0.05 : 0
    const sadShake = mood === 'sad' ? Math.sin(t * 2.2) * 0.22 : 0
    const glance = mood === 'idle' ? Math.sin(t * 0.45) * 0.25 * Math.max(0, Math.sin(t * 0.21)) : 0
    head.current.rotation.set(c.head.x + talkNod, c.head.y + glance + sadShake, c.head.z)

    // Arms (staff arm on +X, free arm mirrored on -X)
    staffShoulder.current.rotation.set(c.staffArm.x, 0, c.staffArm.z)
    staffElbow.current.rotation.set(c.staffArm.elbow, 0, 0)
    const gesture = mood === 'talk' || talking ? Math.sin(t * 3.2) * 0.3 : 0
    const waveArc = mood === 'wave' ? Math.sin(t * 9) * 0.35 : 0
    const clap = cheering ? Math.sin(t * 7) * 0.2 : 0
    freeShoulder.current.rotation.set(c.freeArm.x + gesture + clap, 0, -(c.freeArm.z + waveArc))
    freeElbow.current.rotation.set(c.freeArm.elbow - Math.abs(gesture) * 0.5, 0, 0)

    // Staff: parented to the hand, but counter-rotated every frame so it
    // keeps its own mood orientation (upright when resting, raised when
    // cheering, thrust forward when casting) whatever the arm is doing.
    staffHand.current.getWorldQuaternion(tmp.q)
    root.current.getWorldQuaternion(tmp.rootQ)
    tmp.target.setFromEuler(tmp.e.set(c.staff.x, 0, -c.staff.z)).premultiply(tmp.rootQ)
    staff.current.quaternion.copy(tmp.q.invert().multiply(tmp.target))
    staff.current.position.set(0, c.staff.lift * 0.4, 0)

    // Crystal: spin, pulse, flare with the mood
    const pulse = 1 + Math.sin(t * 2.6) * 0.12
    crystal.current.rotation.y = t * 1.2
    crystal.current.material.emissiveIntensity = 2.2 * c.orb * pulse
    orbLight.current.intensity = 1.6 * c.orb * pulse
    halo.current.material.opacity = Math.min(0.6, 0.3 * c.orb * pulse)
    const haloS = 0.7 + c.orb * 0.12
    halo.current.scale.set(haloS, haloS, 1)
    sparks.current.forEach((m, i) => {
      if (!m) return
      const a = t * (1.6 + c.orb * 0.4) + (i * Math.PI) / 2
      const rad = 0.1 + c.orb * 0.03
      m.position.set(Math.cos(a) * rad, 0.14 + Math.sin(t * 2.3 + i) * 0.06, Math.sin(a) * rad)
    })

    // Face: blink every few seconds, brows follow the mood, mouth talks
    const b = blink.current
    b.t += dt
    if (b.t > b.next) {
      b.t = 0
      b.next = 2.2 + Math.random() * 3.5
    }
    const closing = b.t < 0.14 ? Math.sin((b.t / 0.14) * Math.PI) : 0
    eyes.current.scale.y = cheering ? 0.35 : 1 - closing * 0.92 // squints happily when cheering
    browL.current.rotation.z = c.brows * -0.45
    browR.current.rotation.z = c.brows * 0.45
    browL.current.position.y = 0.085 + Math.abs(c.brows) * 0.012
    browR.current.position.y = 0.085 + Math.abs(c.brows) * 0.012
    const speaking = talking || mood === 'talk'
    const open = speaking ? 0.25 + Math.abs(Math.sin(t * 11) * Math.sin(t * 3.7)) * 0.9 : cheering ? 0.8 : 0.25
    mouth.current.scale.y = damp(mouth.current.scale.y, open, 18, dt)

    // Secondary motion: hat tip, beard and cape trail the body
    hatTip.current.rotation.z = Math.sin(t * 1.3) * 0.04 - bounce * 0.8
    hatTip.current.rotation.x = Math.sin(t * 0.9) * 0.03
    // The beard hangs from the chin, so undo the head nod to keep it
    // falling with gravity over the chest instead of swinging into it
    beard.current.rotation.x = -head.current.rotation.x * 0.9 + Math.sin(t * 1.1) * 0.04 + (cheering ? bounce * 1.2 : 0)
    beard.current.rotation.z = Math.sin(t * 0.8) * 0.03
    cape.current.rotation.x = 0.06 + Math.sin(t * 1.2) * 0.03 + bounce * 0.5
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group ref={body}>
        {/* Robe */}
        <mesh geometry={robe} material={mats.robe} castShadow receiveShadow />
        {/* Glowing rune hem */}
        <mesh position={[0, 0.055, 0]} material={mats.hem}>
          <cylinderGeometry args={[0.425, 0.445, 0.08, 64, 1, true]} />
        </mesh>
        {/* Robe stars */}
        {robeStars.map((s, i) => (
          <mesh key={i} position={s.pos} rotation={[0, s.rotY, i]} scale={s.s}>
            <extrudeGeometry args={[star, { depth: 0.2, bevelEnabled: false }]} />
            <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.8} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        {/* Belt with a star buckle */}
        <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.leather}>
          <torusGeometry args={[robeRadius(0.8) + 0.005, 0.022, 8, 40]} />
        </mesh>
        <mesh position={[0, 0.8, robeRadius(0.8) + 0.02]} scale={0.05}>
          <extrudeGeometry args={[star, { depth: 0.4, bevelEnabled: false }]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.6} />
        </mesh>
        {/* Gold front trim running down the skirt, below the beard */}
        <mesh position={[0, 0.39, robeRadius(0.39) - 0.012]} rotation={[-0.2, 0, 0]} material={mats.trim}>
          <boxGeometry args={[0.035, 0.74, 0.012]} />
        </mesh>

        {/* Cape hanging from the shoulders */}
        <group ref={cape} position={[0, 1.2, -0.02]}>
          <mesh position={[0, -0.58, 0]} material={mats.cape} castShadow>
            <cylinderGeometry args={[0.24, 0.5, 1.16, 32, 1, true, Math.PI * 0.6, Math.PI * 0.8]} />
          </mesh>
        </group>
        {/* Stand-up collar */}
        <mesh position={[0, 1.24, -0.02]} material={mats.cape}>
          <cylinderGeometry args={[0.2, 0.13, 0.16, 24, 1, true, Math.PI * 0.5, Math.PI]} />
        </mesh>
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.trim}>
          <torusGeometry args={[0.2, 0.018, 8, 32]} />
        </mesh>

        {/* Arms */}
        <Sleeve side={1} robeMat={mats.robe} liningMat={mats.robeInner} trimMat={mats.trim} skinMat={mats.skin} shoulderRef={staffShoulder} elbowRef={staffElbow} handRef={staffHand}>
          {/* The staff rides in this hand, counter-rotated every frame */}
          <Staff staffRef={staff} crystalRef={crystal} orbLightRef={orbLight} haloRef={halo} sparkRefs={sparks} />
        </Sleeve>
        <Sleeve side={-1} robeMat={mats.robe} liningMat={mats.robeInner} trimMat={mats.trim} skinMat={mats.skin} shoulderRef={freeShoulder} elbowRef={freeElbow} handRef={freeHand} />

        {/* Neck + head */}
        <mesh position={[0, 1.27, 0]} material={mats.skin}>
          <cylinderGeometry args={[0.055, 0.065, 0.1, 12]} />
        </mesh>
        <group ref={head} position={[0, 1.42, 0]}>
          <Face eyesRef={eyes} browLRef={browL} browRRef={browR} mouthRef={mouth} skinMat={mats.skin} />
          {/* Long beard, pivoting at the chin */}
          <group ref={beard} position={[0, -0.095, 0.15]}>
            <mesh geometry={beardGeo} material={mats.beard} castShadow />
          </group>
          <group position={[0, 0.12, -0.01]} rotation={[-0.08, 0, 0.05]}>
            <Hat tipRef={hatTip} />
          </group>
        </group>
      </group>
    </group>
  )
}

