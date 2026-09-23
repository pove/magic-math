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
const PLAYER_OFFSET = [-0.35, 0, 0.2]
const COMPANION_OFFSET = [-1.15, 0, 0.55]
const WIZARD_OFFSET = [0.95, 0, -0.95]
const WIZARD_SCALE = 0.88
// Entrance/exit paths, relative to where the player ends up standing
const ENTER_FROM = [-3.2, 0, -2.4]
const EXIT_TO = [3.6, 0, -3.2]

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
}) {
  const character = getCharacter3dById(profile?.character3dId) || getCharacter3dById(getDefaultCharacter3dId(profile?.gender))
  const companion = getCompanion(profile?.activeCompanion)

  const player = useRef()
  const phaseStart = useRef(null)
  const lastPhase = useRef(phase)

  const standAt = useMemo(() => [stage[0] + PLAYER_OFFSET[0], stage[1], stage[2] + PLAYER_OFFSET[2]], [stage])
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
    else if (phase === 'leaving') setMoodFor('wave', 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The Mago reads out every new question
  useEffect(() => {
    if (questionKey === undefined || phase !== 'playing') return
    setMoodFor('talk', 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey])

  // --- player movement ------------------------------------------------------
  useFrame((state, dt) => {
    const g = player.current
    if (!g) return
    if (lastPhase.current !== phase || phaseStart.current === null) {
      lastPhase.current = phase
      phaseStart.current = state.clock.elapsedTime
    }
    const elapsed = (state.clock.elapsedTime - phaseStart.current) * 1000
    let x = standAt[0]
    let z = standAt[2]
    let face = 0.35 // resting: a 3/4 turn, towards the camera and the Mago
    if (phase === 'waiting') {
      g.visible = false
      return
    }
    g.visible = true
    if (phase === 'entering') {
      const t = easeInOut(Math.min(1, elapsed / enterMs))
      x = standAt[0] + ENTER_FROM[0] * (1 - t)
      z = standAt[2] + ENTER_FROM[2] * (1 - t)
      face = t < 0.92 ? Math.atan2(-ENTER_FROM[0], -ENTER_FROM[2]) : 0.35
    } else if (phase === 'leaving') {
      const t = Math.min(1, elapsed / leaveMs)
      const e = t * t
      x = standAt[0] + EXIT_TO[0] * e
      z = standAt[2] + EXIT_TO[2] * e
      face = Math.atan2(EXIT_TO[0], EXIT_TO[2])
    }
    g.position.set(x, standAt[1], z)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, face, 10, dt)
  })

  const playerAnim =
    phase === 'entering' ? ANIM.walk
      : phase === 'leaving' ? ANIM.run
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
            <group position={[COMPANION_OFFSET[0] - PLAYER_OFFSET[0], 0, COMPANION_OFFSET[2] - PLAYER_OFFSET[2]]}>
              <GltfCharacter key={companion.file} src={companion.file} animationName={companionAnim} targetHeight={companion.height} rotationY={0.4} />
              <BlobShadow size={0.8} opacity={0.35} />
            </group>
          )}
        </Suspense>
        <BlobShadow size={1.1} />
      </group>

      {wizard && (
        <group>
          <Wizard position={wizardAt} scale={WIZARD_SCALE} rotation={-0.5} mood={wizardTalking && wizardMood === 'idle' ? 'talk' : wizardMood} talking={wizardTalking} />
          <group position={wizardAt}>
            <BlobShadow size={1.4} opacity={0.5} />
          </group>
          <SpellBolt from={staffTip} to={chest} boltKey={boltKey} onHit={() => setBurstKey((k) => k + 1)} />
        </group>
      )}
      <SparkleBurst position={chest} burstKey={burstKey} />
    </group>
  )
}
