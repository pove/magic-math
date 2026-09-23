import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import GltfCharacter from '../character3d/GltfCharacter'
import Wizard from '../castle3d/Wizard'
import { getCharacter3dById, getDefaultCharacter3dId } from '../../data/characters3d'
import { getPetById } from '../../data/pets'
import { getMonsterById } from '../../data/monsters'
import { glowTexture } from '../three/textures'

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
const PORTAL_OFFSET = [-1.9, 0, -2.4]

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
      <pointLight position={[stage[0] + 0.4, 1.8, stage[2] + 2.2]} intensity={4} distance={6} color="#e9d5ff" />
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
const portalFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float r = length(c);
    float a = atan(c.y, c.x);
    float swirl = sin(a * 5.0 + r * 14.0 - uTime * 7.0) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.45, 0.2, 1.4), vec3(0.2, 1.3, 1.6), swirl);
    col += vec3(1.8, 1.5, 2.2) * smoothstep(0.35, 0.0, r); // bright core
    float edge = smoothstep(1.0, 0.82, r);
    gl_FragColor = vec4(col * (0.6 + swirl * 0.6), edge * uOpen);
  }
`

/** Swirling magic portal the Mago opens to send the player on to the next
 *  room. Opens/closes with `openRef.current` (0..1). */
function Portal({ position, openRef }) {
  const group = useRef()
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: portalVertex, fragmentShader: portalFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } } }),
    []
  )
  const ring = useRef()
  const light = useRef()
  useFrame((state) => {
    const o = openRef.current
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uOpen.value = o
    if (group.current) {
      group.current.visible = o > 0.01
      group.current.scale.setScalar(Math.max(0.001, o))
    }
    if (ring.current) ring.current.rotation.z = state.clock.elapsedTime * 1.5
    if (light.current) light.current.intensity = o * 10
  })
  return (
    <group position={[position[0], 1.25, position[2]]}>
      <group ref={group} rotation={[0, 0.35, 0]} visible={false}>
        <mesh material={mat}>
          <circleGeometry args={[1.2, 48]} />
        </mesh>
        <mesh ref={ring}>
          <torusGeometry args={[1.22, 0.06, 8, 48]} />
          <meshBasicMaterial color={[1.6, 1.1, 3]} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} color="#a78bfa" intensity={0} distance={7} />
    </group>
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

  const portalAt = useMemo(() => [stage[0] + PORTAL_OFFSET[0], 0, stage[2] + PORTAL_OFFSET[2]], [stage])
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

    // Exit portal: opens as the Mago casts, closes once the player is through
    const portalTarget = phase === 'leaving' && elapsed < leaveMs - 150 ? 1 : 0
    portalOpen.current = THREE.MathUtils.damp(portalOpen.current, portalTarget, portalTarget ? 7 : 9, dt)

    let x = standAt[0]
    let z = standAt[2]
    let scale = 1
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
      const runStart = 300
      const runEnd = leaveMs * 0.72
      const t = Math.min(1, Math.max(0, (elapsed - runStart) / (runEnd - runStart)))
      const e = t * t * (3 - 2 * t)
      x = standAt[0] + (portalAt[0] - standAt[0]) * e
      z = standAt[2] + (portalAt[2] - standAt[2]) * e
      if (elapsed > runStart) face = Math.atan2(portalAt[0] - standAt[0], portalAt[2] - standAt[2])
      // Swallowed by the portal: shrink and spin away
      const gone = Math.min(1, Math.max(0, (elapsed - runEnd) / (leaveMs - runEnd)))
      scale = 1 - gone
      face += gone * 6
    }
    g.position.set(x, standAt[1], z)
    g.scale.setScalar(Math.max(0.0001, scale))
    g.rotation.y = phase === 'leaving' && scale < 1 ? face : THREE.MathUtils.damp(g.rotation.y, face, 10, dt)
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
    </group>
  )
}
