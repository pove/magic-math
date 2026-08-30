import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The Director Mago, standing on the active floor of the tower next to the
 * player's (realistic, GLTF) character. Previously a handful of bare cones
 * and spheres — a literal traffic-cone body — which read as a placeholder
 * next to a properly modeled character. This is still pure procedural
 * geometry (no assets, keeps the tower light), but built with actual
 * humanoid proportions (a tapered robe instead of a cone, real shoulders/
 * arms, a rounder layered beard, a proper bent wizard-hat silhouette) and
 * the same purple/gold/star palette as the 2D DirectorMago, so both
 * versions read as "the same character".
 */

// A 5-point star outline, used for the small gold appliqués on the robe and
// hat — the 3D equivalent of DirectorMago's ✦ glyphs.
function starShape(outer = 1, inner = 0.42) {
  const s = new THREE.Shape()
  const points = 5
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

const ROBE_PURPLE = '#5b21b6'
const ROBE_PURPLE_DARK = '#3f1d78'
const GOLD = '#fbbf24'
const SKIN = '#f4d4a0'
const BEARD = '#e8eaed'

function StarAppliques({ scale = 1 }) {
  const shape = useMemo(() => starShape(), [])
  return (
    <group scale={scale}>
      {[
        [0, 0, 0.02],
        [-0.13, -0.16, 0.03],
        [0.14, -0.22, 0],
      ].map(([x, y, rz], i) => (
        <mesh key={i} position={[x, y, 0.001]} rotation={[0, 0, rz]} scale={0.055 - i * 0.008}>
          <extrudeGeometry args={[shape, { depth: 0.05, bevelEnabled: false }]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// A gently drooping wizard-hat tip: a small cone hinged a fixed ~30° off the
// main hat's axis, the classic "floppy" silhouette instead of a dead-straight
// spike.
function HatTip() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
  })
  return (
    <group ref={ref} position={[0, 0.34, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <coneGeometry args={[0.13, 0.34, 10]} />
        <meshStandardMaterial color={ROBE_PURPLE_DARK} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
    </group>
  )
}

function Hat() {
  return (
    <group position={[0, 1.62, 0]}>
      {/* brim */}
      <mesh>
        <cylinderGeometry args={[0.4, 0.44, 0.05, 20]} />
        <meshStandardMaterial color={ROBE_PURPLE_DARK} roughness={0.55} />
      </mesh>
      {/* cone body, tapering — the tip hinges off the top instead of
          continuing the same straight cone all the way up */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.1, 0.32, 0.42, 16]} />
        <meshStandardMaterial color={ROBE_PURPLE} roughness={0.55} />
      </mesh>
      {/* gold band */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.335, 0.35, 0.06, 20]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.35} />
      </mesh>
      <group position={[0, 0.11, 0.31]} scale={1.4}>
        <StarAppliques scale={0.8} />
      </group>
      <HatTip />
    </group>
  )
}

// A fuller, rounder beard built from a few overlapping spheres (tapering
// down and forward) instead of a single sharp cone — reads as soft facial
// hair rather than a shark fin.
function Beard() {
  // Hangs below the chin (head bottom is at y≈1.255) rather than covering
  // the whole face — the earlier version ballooned up over the eyes.
  const lumps = [
    { p: [0, 1.25, 0.15], r: 0.085 },
    { p: [-0.065, 1.275, 0.13], r: 0.055 },
    { p: [0.065, 1.275, 0.13], r: 0.055 },
    { p: [0, 1.16, 0.105], r: 0.065 },
    { p: [0, 1.08, 0.075], r: 0.045 },
  ]
  return (
    <group>
      {lumps.map((l, i) => (
        <mesh key={i} position={l.p}>
          <sphereGeometry args={[l.r, 10, 10]} />
          <meshStandardMaterial color={BEARD} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function Head() {
  return (
    <group>
      <mesh position={[0, 1.44, 0]}>
        <sphereGeometry args={[0.185, 20, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 1.41, 0.185]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      {/* friendly closed-smile eyes */}
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 1.465, 0.165]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.022, 0.008, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#3f2a1a" />
        </mesh>
      ))}
      {/* eyebrows */}
      {[-0.075, 0.075].map((x, i) => (
        <mesh key={i} position={[x, 1.505, 0.16]} rotation={[0, 0, i === 0 ? 0.25 : -0.25]}>
          <boxGeometry args={[0.07, 0.014, 0.014]} />
          <meshStandardMaterial color={BEARD} />
        </mesh>
      ))}
      <Beard />
    </group>
  )
}

// The staff: a shaft topped with a warm glowing orb, echoing the 2D
// DirectorMago's amber `dm-orb` gradient with a layered glow + a real
// point light, and a couple of sparkles drifting around the tip.
function Staff({ position, rotation }) {
  const orb = useRef()
  const glow = useRef()
  const sparkRefs = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (orb.current) orb.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08)
    if (glow.current) glow.current.material.opacity = 0.28 + Math.sin(t * 2.4) * 0.1
    sparkRefs.current.forEach((m, i) => {
      if (!m) return
      const a = t * 1.4 + (i * Math.PI * 2) / 3
      m.position.set(Math.cos(a) * 0.14, -0.7 + Math.sin(t * 2 + i) * 0.05, Math.sin(a) * 0.14)
    })
  })
  // Shaft/orb extend along -Y from the hand, same convention as the arm
  // segments (which is why an earlier +Y version pointed the staff the
  // wrong way once the arm was raised — its own rotation composed with the
  // arm/elbow angles assuming a shared "down is the resting direction").
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.68, 8]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.7} />
      </mesh>
      <mesh ref={glow} position={[0, -0.7, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.3} />
      </mesh>
      <mesh ref={orb} position={[0, -0.7, 0]}>
        <sphereGeometry args={[0.05, 14, 14]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (sparkRefs.current[i] = el)} position={[0, -0.7, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshBasicMaterial color="#fef9c3" />
        </mesh>
      ))}
      <pointLight position={[0, -0.7, 0]} color={GOLD} intensity={1.6} distance={4} />
    </group>
  )
}

// Every joint below rotates only around Z (in the character's front-facing
// plane), so the angles compose by plain addition — easy to reason about
// ("bigger angle = more raised/rotated") instead of fighting compound
// X+Z Euler rotations, which is what made the first pass's arms swing the
// wrong way and disappear behind the body depending on viewing angle.
function Arm({ shoulder, armAngle, elbowAngle, staffAngle, holdsStaff }) {
  return (
    <group position={shoulder} rotation={[0, 0, armAngle]}>
      {/* small round shoulder pad so the sleeve has a clean attachment point
          instead of starting mid-air outside the robe */}
      <mesh>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshStandardMaterial color={ROBE_PURPLE} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.058, 0.05, 0.32, 10]} />
        <meshStandardMaterial color={ROBE_PURPLE} roughness={0.6} />
      </mesh>
      <group position={[0, -0.32, 0]} rotation={[0, 0, elbowAngle]}>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.044, 0.04, 0.28, 10]} />
          <meshStandardMaterial color={ROBE_PURPLE} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {holdsStaff && <Staff position={[0, -0.28, 0]} rotation={[0, 0, staffAngle]} />}
      </group>
    </group>
  )
}

// Natural height (feet to hat tip) at scale 1 is ~2.3 units — noticeably
// taller than the player's 1.5 (fitting for a tall pointy hat, and the 2D
// DirectorMago is drawn larger than the player sprite too), but the old
// version additionally applied a 1.4x multiplier on top of that, making it
// almost double the player's height. This default brings it back down to a
// believably "tall wizard" proportion instead.
const DEFAULT_SCALE = 0.78

export default function Wizard({ position = [0, 0, 0], scale = DEFAULT_SCALE }) {
  const group = useRef()
  const startRef = useRef(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (startRef.current === null) startRef.current = t + Math.random() * 10
    const local = t - startRef.current
    if (group.current) {
      // A calm standing idle: a soft breathing bob and the faintest weight
      // shift, instead of drei's Float (which reads as floating/flying, not
      // standing) — grounded next to the player character.
      group.current.position.y = position[1] + Math.sin(local * 1.1) * 0.025
      group.current.rotation.y = Math.sin(local * 0.4) * 0.06
    }
  })

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Robe: a tapered frustum (wide hem, narrow shoulders) instead of a
          full cone, which read as a literal traffic cone. */}
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.27, 0.5, 1.06, 16]} />
        <meshStandardMaterial color={ROBE_PURPLE} roughness={0.65} />
      </mesh>
      {/* darker rear panel, for a bit of cloth-like depth */}
      <mesh position={[0, 0.5, -0.02]} rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.48, 1.0, 16, 1, true, Math.PI * 0.7, Math.PI * 0.6]} />
        <meshStandardMaterial color={ROBE_PURPLE_DARK} roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.75, 0.28]}>
        <StarAppliques />
      </group>
      {/* gold collar trim */}
      <mesh position={[0, 1.03, 0]}>
        <cylinderGeometry args={[0.28, 0.29, 0.05, 16]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.15, 14, 14]} />
        <meshStandardMaterial color={ROBE_PURPLE} roughness={0.65} />
      </mesh>
      {/* neck + head */}
      <mesh position={[0, 1.17, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      <Head />
      <Hat />
      {/* Shoulder pivots sit just outside the robe's own radius at that
          height (~0.29) so the sleeves clear the robe silhouette instead of
          hiding inside it. Angles measured from straight down (0°): the
          relaxed arm barely swings out, the staff arm raises up and out to
          ~155° so the glowing orb clears the hat brim and reads from most
          angles instead of tucking behind the body. */}
      <Arm shoulder={[-0.32, 1.0, 0]} armAngle={-0.3} elbowAngle={-0.15} />
      <Arm shoulder={[0.32, 1.0, 0]} armAngle={1.75} elbowAngle={0.35} staffAngle={0.6} holdsStaff />
    </group>
  )
}
