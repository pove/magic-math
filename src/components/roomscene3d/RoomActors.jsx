import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import GltfCharacter from '../character3d/GltfCharacter'
import Wizard from '../castle3d/Wizard'
import { getCharacter3dById, getDefaultCharacter3dId } from '../../data/characters3d'
import { getPetById } from '../../data/pets'
import { getMonsterById } from '../../data/monsters'
import { glowTexture, runeBandTexture } from '../three/textures'

/**
 * The player's character (+ companion) and the Director Mago, standing
 * *inside* a 3D room: they walk in, stand on its floor under its lights,
 * react to every answer and walk out again.
 *
 * Props (all driven by the room screen):
 *   stage       [x, y, z] spot the camera framing put them on
 *   profile     active player profile (character + companion)
 *   phase       'waiting' | 'entering' | 'playing' | 'leaving'
 *   enterMs     how long the walk-in takes
 *   leaveMs     how long the walk-out takes
 *   action      'idle' | 'correctAnswer' | 'wrongAnswer' — the player's reaction
 *   questionKey changes whenever a new question appears (the Mago reads it out)
 *   wizard      show the Director Mago
 *   wizardTalking  keep the Mago talking (boss intro)
 */

const ANIM = {
  walk: 'CharacterArmature|Walk',
  run: 'CharacterArmature|Run',
  wave: 'CharacterArmature|Wave',
  hit: 'CharacterArmature|HitRecieve',
}

// Where each actor stands relative to the stage spot
const PLAYER_OFFSET = [-0.6, 0, 0.15]
// The companion stands between the player and the Mago, a little in front
// (it's small), so the trio reads as one tight group inside the slot.
const COMPANION_OFFSET = [0.15, 0, 0.6]
const WIZARD_OFFSET = [0.95, 0, -0.55]
const WIZARD_SCALE = 0.88
// Fallback entrance path (relative to the player's spot) when the room has
// no door to come in through
const ENTER_FROM = [-3.2, 0, -2.4]
// The exit portal the Mago opens, relative to the stage spot
// Behind the group, pulled toward the middle of the room so it's always in view
const portalSpot = (stage) => [stage[0] * 0.45 + 1.1, 0, stage[2] - 3.6]

function getCompanion(activeCompanion) {
  if (!activeCompanion) return null
  return activeCompanion.type === 'pet' ? getPetById(activeCompanion.id) : getMonsterById(activeCompanion.id)
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Soft dark blob under an actor — grounds it without a shadow pass. */
function BlobShadow({ size = 0.9, opacity = 0.45 }) {
  const map = glowTexture()
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} renderOrder={1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} color="#000000" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/**
 * Soft key light on the actors from the front-left, like a stage light, so
 * they read clearly against however dark the room is.
 */
function StageLight({ stage }) {
  const target = useMemo(() => new THREE.Object3D(), [])
  target.position.set(stage[0], 1, stage[2])
  return (
    <>
      <primitive object={target} />
      <directionalLight position={[stage[0] - 3, 5, stage[2] + 6]} target={target} intensity={1.8} color="#fff1dc" />
      <pointLight position={[stage[0] + 0.4, 1.8, stage[2] + 2.2]} intensity={4} distance={6} color="#e9d5ff" userData={{ essential: true }} />
    </>
  )
}

/** Burst of sparkles fired at a point whenever `burstKey` changes. */
function SparkleBurst({ position, burstKey, color = '#fde68a', count = 26 }) {
  const group = useRef()
  const start = useRef(-1)
  const dirs = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.1, Math.random() - 0.5).normalize()
        return { v, speed: 1.2 + Math.random() * 1.6, size: 0.12 + Math.random() * 0.14 }
      }),
    [count]
  )
  const map = glowTexture()
  useEffect(() => {
    if (burstKey) start.current = -2 // armed: set on the next frame
  }, [burstKey])
  useFrame((state) => {
    if (!group.current) return
    if (start.current === -2) start.current = state.clock.elapsedTime
    const t = start.current < 0 ? 99 : state.clock.elapsedTime - start.current
    const alive = t < 1.1
    group.current.visible = alive
    if (!alive) return
    group.current.children.forEach((s, i) => {
      const d = dirs[i]
      const k = d.speed * t
      s.position.set(d.v.x * k, d.v.y * k - 1.4 * t * t, d.v.z * k)
      const fade = 1 - t / 1.1
      s.material.opacity = fade
      s.scale.setScalar(d.size * (0.6 + fade))
    })
  })
  return (
    <group ref={group} position={position} visible={false}>
      {dirs.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={map} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

/** A glowing bolt that flies in an arc from the Mago's staff to the player. */
function SpellBolt({ from, to, boltKey, onHit }) {
  const ref = useRef()
  const trail = useRef([])
  const start = useRef(-1)
  const map = glowTexture()
  const a = useMemo(() => new THREE.Vector3(...from), [from])
  const b = useMemo(() => new THREE.Vector3(...to), [to])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const DURATION = 0.45

  useEffect(() => {
    if (boltKey) start.current = -2
  }, [boltKey])

  useFrame((state) => {
    if (!ref.current) return
    if (start.current === -2) start.current = state.clock.elapsedTime
    const t = start.current < 0 ? 99 : (state.clock.elapsedTime - start.current) / DURATION
    ref.current.visible = t <= 1
    if (t > 1) {
      if (start.current >= 0) {
        start.current = -1
        onHit?.()
      }
      return
    }
    const place = (obj, tt) => {
      tmp.lerpVectors(a, b, tt)
      tmp.y += Math.sin(tt * Math.PI) * 0.9 // arc over
      obj.position.copy(tmp)
    }
    place(ref.current.children[0], t)
    trail.current.forEach((s, i) => {
      if (!s) return
      const tt = Math.max(0, t - (i + 1) * 0.06)
      place(s, tt)
      s.material.opacity = 0.6 * (1 - i / trail.current.length)
    })
  })

  return (
    <group ref={ref} visible={false}>
      <sprite scale={[0.55, 0.55, 1]}>
        <spriteMaterial map={map} color={[2.5, 2.2, 1.2]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <sprite key={i} ref={(el) => (trail.current[i] = el)} scale={[0.35 - i * 0.04, 0.35 - i * 0.04, 1]}>
          <spriteMaterial map={map} color="#fde68a" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
// A vortex with depth: spiral arms flowing inwards (log-spiral), a dark
// tunnel at the centre with stars falling into it, and a bright rim.
const portalFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float r = length(c);
    float a = atan(c.y, c.x);
    float lr = log(max(r, 0.002));
    float spiral = sin(a * 3.0 - lr * 5.5 + uTime * 5.0);
    float arms = smoothstep(0.05, 1.0, spiral);
    float tunnel = smoothstep(0.05, 0.75, r);
    vec3 deep = vec3(0.03, 0.0, 0.1);
    vec3 armCol = mix(vec3(1.1, 0.35, 2.2), vec3(0.25, 1.5, 2.0), smoothstep(0.25, 0.95, r));
    vec3 col = mix(deep, armCol, arms * tunnel * 0.85);
    // Stars streaming down the tunnel
    vec2 sc = vec2(a * 5.0, lr * 4.0 + uTime * 3.0);
    vec2 cell = floor(sc);
    vec2 fc = fract(sc) - 0.5;
    float star = step(0.82, hash(cell)) * smoothstep(0.14, 0.0, length(fc));
    col += vec3(2.2, 2.0, 2.6) * star * (1.0 - tunnel * 0.5);
    col += vec3(1.8, 1.3, 3.0) * exp(-pow((r - 0.95) * 13.0, 2.0)) * 1.4; // rim
    float alpha = smoothstep(1.02, 0.9, r);
    gl_FragColor = vec4(col, alpha * min(1.0, uOpen * 1.5));
  }
`

// Sparks spiralling in from around the portal and vanishing at its centre
const suckVertex = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  attribute vec2 aSeed;
  varying float vAlpha;
  void main() {
    float ph = fract(uTime * (0.35 + aSeed.x * 0.4) + aSeed.y);
    float r = mix(2.3, 0.1, ph * ph);
    float a = aSeed.y * 6.2832 + ph * 5.0;
    vec3 p = vec3(cos(a) * r * 0.78, sin(a) * r, 0.08);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.0 - ph * 0.7) * 160.0 / -mv.z;
    vAlpha = uOpen * smoothstep(0.0, 0.15, ph) * (1.0 - smoothstep(0.85, 1.0, ph));
  }
`
const suckFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float g = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vec3(1.6, 1.4, 2.6) * g, g * vAlpha);
  }
`

/**
 * The exit portal the Mago opens to send the player on to the next room.
 * It tears open as a vertical slit of light, widens into an oval vortex —
 * spiral arms pouring into a starry tunnel, a ring of math runes turning
 * round the rim, sparks being drawn in — then collapses to a point.
 * Driven by `openRef.current` (0 closed … 1 open).
 */
function Portal({ position, openRef }) {
  const group = useRef()
  const ring = useRef()
  const light = useRef()
  const floorGlow = useRef()
  const vortex = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: portalVertex, fragmentShader: portalFragment, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } } }),
    []
  )
  const suck = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: suckVertex, fragmentShader: suckFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } } }),
    []
  )
  const sparks = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = 70
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    const seeds = new Float32Array(n * 2)
    for (let i = 0; i < n * 2; i++) seeds[i] = Math.random()
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 2))
    return g
  }, [])
  // Ring with polar UVs so the rune strip wraps round the rim (RingGeometry
  // lays out 97 vertices per ring here, the seam vertex duplicated)
  const runeRing = useMemo(() => {
    const g = new THREE.RingGeometry(1.02, 1.2, 96, 1)
    const p = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) uv.setXY(i, (i % 97) / 96, (Math.hypot(p.getX(i), p.getY(i)) - 1.02) / 0.18)
    return g
  }, [])
  const runes = useMemo(() => runeBandTexture(3), [])
  const glow = glowTexture()

  useFrame((state) => {
    const o = openRef.current
    const t = state.clock.elapsedTime
    vortex.uniforms.uTime.value = t
    vortex.uniforms.uOpen.value = o
    suck.uniforms.uTime.value = t
    suck.uniforms.uOpen.value = o
    if (group.current) {
      group.current.visible = o > 0.005
      // Tear open as a tall slit first, then widen into the oval
      const h = THREE.MathUtils.smoothstep(o, 0, 0.35)
      const w = Math.max(0.03, THREE.MathUtils.smoothstep(o, 0.2, 1))
      group.current.scale.set(w * 1.05, h * 1.35, 1)
    }
    if (ring.current) ring.current.rotation.z = -t * 0.8
    if (light.current) light.current.intensity = o * 12
    if (floorGlow.current) floorGlow.current.material.opacity = o * 0.5
  })

  return (
    <group position={position}>
      <group ref={group} position={[0, 1.45, 0]} visible={false}>
        <mesh material={vortex}>
          <circleGeometry args={[1, 64]} />
        </mesh>
        <mesh ref={ring} geometry={runeRing} position={[0, 0, 0.02]}>
          <meshBasicMaterial map={runes} color={[2.2, 1.6, 3]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <points geometry={sparks} material={suck} frustumCulled={false} />
      </group>
      {/* Its light pooling on the floor */}
      <mesh ref={floorGlow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.2]} scale={[3.2, 2.2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} color="#a78bfa" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight ref={light} position={[0, 1.4, 0.6]} color="#a78bfa" intensity={0} distance={8} />
    </group>
  )
}

/** A crackling beam from the Mago's staff to the portal while he opens it. */
function CastBeam({ from, to, visibleRef }) {
  const mesh = useRef()
  const { mid, len, quat } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const d = b.clone().sub(a)
    return {
      mid: a.clone().add(b).multiplyScalar(0.5),
      len: d.length(),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
    }
  }, [from, to])
  useFrame((state) => {
    if (!mesh.current) return
    const v = visibleRef.current
    mesh.current.visible = v > 0.01
    mesh.current.material.opacity = v * (0.7 + Math.sin(state.clock.elapsedTime * 40) * 0.3)
    mesh.current.scale.set(0.6 + Math.sin(state.clock.elapsedTime * 31) * 0.4, 1, 1)
  })
  return (
    <mesh ref={mesh} position={mid} quaternion={quat} visible={false}>
      <cylinderGeometry args={[0.04, 0.04, len, 6, 1, true]} />
      <meshBasicMaterial color={[2, 1.6, 3.2]} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

export default function RoomActors({
  stage = [0, 0, 2.5],
  profile,
  phase = 'playing',
  enterMs = 1200,
  leaveMs = 1300,
  action = 'idle',
  questionKey,
  wizard = true,
  wizardTalking = false,
  entryFrom = null,
}) {
  const character = getCharacter3dById(profile?.character3dId) || getCharacter3dById(getDefaultCharacter3dId(profile?.gender))
  const companion = getCompanion(profile?.activeCompanion)

  const player = useRef()
  const phaseStart = useRef(null)
  const lastPhase = useRef(phase)

  // Without a companion to fill the space between them, the player stands
  // closer to the Mago
  const playerX = companion ? PLAYER_OFFSET[0] : -0.2
  const standAt = useMemo(() => [stage[0] + playerX, stage[1], stage[2] + PLAYER_OFFSET[2]], [stage, playerX])
  const wizardAt = useMemo(() => [stage[0] + WIZARD_OFFSET[0], stage[1], stage[2] + WIZARD_OFFSET[2]], [stage])

  // --- reactions: spell bolt + sparkle burst on every correct answer -------
  const [boltKey, setBoltKey] = useState(0)
  const [burstKey, setBurstKey] = useState(0)
  const [wizardMood, setWizardMood] = useState('idle')
  const moodTimer = useRef()

  const setMoodFor = (mood, ms, then = 'idle') => {
    clearTimeout(moodTimer.current)
    setWizardMood(mood)
    if (ms) moodTimer.current = setTimeout(() => setWizardMood(then), ms)
  }
  useEffect(() => () => clearTimeout(moodTimer.current), [])

  useEffect(() => {
    if (action === 'correctAnswer') {
      if (!wizard) {
        setBurstKey((k) => k + 1)
        return
      }
      // Point the staff, fire, then celebrate once it lands
      setMoodFor('cast', 0)
      setBoltKey((k) => k + 1)
      moodTimer.current = setTimeout(() => setMoodFor('cheer', 1100), 450)
    } else if (action === 'wrongAnswer') {
      setMoodFor('sad', 1300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action])

  useEffect(() => {
    if (phase === 'entering') setMoodFor('wave', enterMs + 700)
    else if (phase === 'leaving') setMoodFor('cast', 0) // conjures the exit portal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The Mago reads out every new question
  useEffect(() => {
    if (questionKey === undefined || phase !== 'playing') return
    setMoodFor('talk', 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey])

  const portalAt = useMemo(() => portalSpot(stage), [stage])
  const beamOn = useRef(0)
  const [collapseKey, setCollapseKey] = useState(0)
  const collapsed = useRef(false)
  const from = useMemo(
    () => entryFrom || [standAt[0] + ENTER_FROM[0], 0, standAt[2] + ENTER_FROM[2]],
    [entryFrom, standAt]
  )
  const portalOpen = useRef(0)
  const wizardGroup = useRef()
  const [poofKey, setPoofKey] = useState(0)
  useEffect(() => {
    // The Mago pops in with a burst of sparkles as the player arrives
    if (phase === 'entering') setPoofKey((k) => k + 1)
  }, [phase])

  // --- movement: run in from the door, run out into the portal -------------
  useFrame((state, dt) => {
    const g = player.current
    if (!g) return
    if (lastPhase.current !== phase || phaseStart.current === null) {
      lastPhase.current = phase
      phaseStart.current = state.clock.elapsedTime
    }
    const elapsed = (state.clock.elapsedTime - phaseStart.current) * 1000

    // Wizard: hidden until the entrance, then springs in
    if (wizardGroup.current) {
      const w = wizardGroup.current
      if (phase === 'waiting') w.scale.setScalar(0.0001)
      else if (phase === 'entering') {
        const t = Math.min(1, elapsed / 600)
        const spring = 1 - Math.cos(t * Math.PI * 2.5) * Math.exp(-t * 5) // overshoot, settle
        w.scale.setScalar(Math.max(0.0001, t < 1 ? spring : 1))
      } else w.scale.setScalar(1)
    }

    // Exit, as a timeline over leaveMs:
    //   0.00–0.25  the Mago turns and casts; his beam tears the portal open
    //   0.22–0.66  the player runs to it
    //   0.66–0.84  …and is drawn in, shrinking and spinning
    //   0.84–1.00  the portal collapses to a point in a burst of sparks
    const f = phase === 'leaving' ? elapsed / leaveMs : 0
    const sm = THREE.MathUtils.smoothstep
    portalOpen.current = phase !== 'leaving' ? 0 : f < 0.84 ? sm(f, 0.04, 0.26) : 1 - sm(f, 0.84, 0.97)
    beamOn.current = phase === 'leaving' ? sm(f, 0.02, 0.08) * (1 - sm(f, 0.24, 0.32)) : 0
    if (phase === 'leaving' && f > 0.86 && !collapsed.current) {
      collapsed.current = true
      setCollapseKey((k) => k + 1)
    }
    if (phase !== 'leaving') collapsed.current = false
    // The Mago turns to face the portal while he opens it
    if (wizardGroup.current) {
      const target = phase === 'leaving' ? Math.atan2(portalAt[0] - wizardAt[0], portalAt[2] - wizardAt[2]) + 0.5 : 0
      wizardGroup.current.rotation.y = THREE.MathUtils.damp(wizardGroup.current.rotation.y, target, 6, dt)
    }

    let x = standAt[0]
    let z = standAt[2]
    let scale = 1
    let lift = 0
    let face = 0.35 // resting: a 3/4 turn, towards the camera and the Mago
    if (phase === 'waiting') {
      g.visible = false
      return
    }
    g.visible = true
    if (phase === 'entering') {
      const t = Math.min(1, elapsed / enterMs)
      const e = 1 - (1 - t) ** 2 // bursts out of the door, eases into place
      // Curve out to the left so the run swings round the Mago, not through him
      const cx = Math.min(from[0], standAt[0]) - 1.6
      const cz = standAt[2] - 4
      const u = 1 - e
      x = u * u * from[0] + 2 * u * e * cx + e * e * standAt[0]
      z = u * u * from[2] + 2 * u * e * cz + e * e * standAt[2]
      // Face along the curve (its tangent)
      const dx = 2 * u * (cx - from[0]) + 2 * e * (standAt[0] - cx)
      const dz = 2 * u * (cz - from[2]) + 2 * e * (standAt[2] - cz)
      face = t < 0.9 ? Math.atan2(dx, dz) : 0.35
    } else if (phase === 'leaving') {
      // Run to just in front of the portal…
      const front = [portalAt[0], 0, portalAt[2] + 0.5]
      const run = THREE.MathUtils.smoothstep(f, 0.22, 0.66)
      x = standAt[0] + (front[0] - standAt[0]) * run
      z = standAt[2] + (front[2] - standAt[2]) * run
      if (f > 0.2) face = Math.atan2(front[0] - standAt[0], front[2] - standAt[2])
      // …then get drawn into its centre, shrinking and spinning
      const pull = THREE.MathUtils.smoothstep(f, 0.66, 0.84)
      x += (portalAt[0] - x) * pull
      z += (portalAt[2] - z) * pull
      lift = pull * 0.9
      scale = 1 - pull
      face += pull * pull * 9
    }
    g.position.set(x, standAt[1] + lift, z)
    g.scale.setScalar(Math.max(0.0001, scale))
    g.rotation.y = phase === 'leaving' && scale < 0.98 ? face : THREE.MathUtils.damp(g.rotation.y, face, 10, dt)
  })

  const playerAnim =
    phase === 'entering' || phase === 'leaving' ? ANIM.run
        : action === 'correctAnswer' ? ANIM.wave
          : action === 'wrongAnswer' ? ANIM.hit
            : character.animation

  const companionAnim =
    action === 'correctAnswer' ? 'Yes'
      : action === 'wrongAnswer' ? 'No'
        : phase === 'entering' || phase === 'leaving' ? 'Walk'
          : companion?.animation

  const chest = [standAt[0], 1.0, standAt[2]]
  const staffTip = [wizardAt[0] + 0.25, 1.4, wizardAt[2] + 0.35]

  return (
    <group>
      <StageLight stage={stage} />
      <group ref={player} position={standAt}>
        <Suspense fallback={null}>
          <GltfCharacter key={character.file} src={character.file} animationName={playerAnim} targetHeight={character.height} />
          {companion && (
            <group position={[COMPANION_OFFSET[0] - playerX, 0, COMPANION_OFFSET[2] - PLAYER_OFFSET[2]]}>
              <GltfCharacter key={companion.file} src={companion.file} animationName={companionAnim} targetHeight={companion.height} rotationY={0.4} />
              <BlobShadow size={0.8} opacity={0.35} />
            </group>
          )}
        </Suspense>
        <BlobShadow size={1.1} />
      </group>

      {wizard && (
        <group>
          <group ref={wizardGroup} position={wizardAt}>
            <group position={[-wizardAt[0], -wizardAt[1], -wizardAt[2]]}>
          <Wizard position={wizardAt} scale={WIZARD_SCALE} rotation={-0.5} mood={wizardTalking && wizardMood === 'idle' ? 'talk' : wizardMood} talking={wizardTalking} />
          <group position={wizardAt}>
            <BlobShadow size={1.4} opacity={0.5} />
          </group>
            </group>
          </group>
          <SparkleBurst position={[wizardAt[0], 1.2, wizardAt[2]]} burstKey={poofKey} color="#c4b5fd" count={34} />
          <SpellBolt from={staffTip} to={chest} boltKey={boltKey} onHit={() => setBurstKey((k) => k + 1)} />
        </group>
      )}
      <SparkleBurst position={chest} burstKey={burstKey} />
      <Portal position={portalAt} openRef={portalOpen} />
      <SparkleBurst position={[portalAt[0], 1.45, portalAt[2]]} burstKey={collapseKey} color="#c4b5fd" count={40} />
      {wizard && <CastBeam from={[wizardAt[0], 1.45, wizardAt[2]]} to={[portalAt[0], 1.45, portalAt[2]]} visibleRef={beamOn} />}
    </group>
  )
}
