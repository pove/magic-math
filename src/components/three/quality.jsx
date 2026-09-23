import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Render quality for every 3D scene, decided once per page load.
 *
 * 1. A first guess from the device: touch, memory, CPU cores and the GPU's
 *    own name.
 * 2. A short calibration behind the first scene's loading screen, once its
 *    shaders are compiled (see SceneWarmup): the real frame rate is measured
 *    and the tier stepped down (or tried one step up) until it holds.
 * 3. That tier then stays fixed for the rest of the session — no changes
 *    mid-game — until the page is reloaded (F5).
 *
 *   high    – ambient occlusion, bloom, MSAA, soft shadows, dpr up to 2
 *   medium  – bloom, shadows, dpr up to 1.5, up to 10 point lights
 *   low     – no post-processing, no shadows, dpr 1, 4 point lights
 *   minimal – as low, at a reduced resolution, 3 point lights
 *
 * Add `?quality=low` (etc.) to the URL to force a tier, `?fps` to show a
 * frame-rate meter.
 */

export const TIERS = ['minimal', 'low', 'medium', 'high']

export const QUALITY = {
  minimal: { dpr: 0.75, post: false, ao: false, msaa: 0, shadows: false, shadowMapSize: 512, grass: 0.2, particles: 0.35, lights: 3 },
  low: { dpr: 1, post: false, ao: false, msaa: 0, shadows: false, shadowMapSize: 512, grass: 0.35, particles: 0.5, lights: 4 },
  medium: { dpr: 1.5, post: true, ao: false, msaa: 0, shadows: true, shadowMapSize: 1024, grass: 0.7, particles: 0.8, lights: 10 },
  high: { dpr: 2, post: true, ao: true, msaa: 4, shadows: true, shadowMapSize: 2048, grass: 1, particles: 1, lights: Infinity },
}

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const forced = TIERS.includes(params.get('quality')) ? params.get('quality') : null
export const SHOW_FPS = params.has('fps')

function gpuName() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return String(name || '')
  } catch {
    return ''
  }
}

/** Best guess before a single frame has been measured. */
function detectTier() {
  if (typeof window === 'undefined') return 'medium'
  const gpu = gpuName()
  const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  const memory = navigator.deviceMemory || 8
  const cores = navigator.hardwareConcurrency || 4
  const smallScreen = Math.min(window.screen?.width || 1920, window.screen?.height || 1080) < 820

  // Software rendering or very little memory: go straight to the floor
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu) || memory <= 2) return 'minimal'
  // Older / entry-level mobile GPUs
  if (/mali-[gt]?[1-7]\d|adreno \(tm\) [1-5]\d\d|adreno [1-5]\d\d|powervr|videocore/i.test(gpu)) return 'low'
  if (touch && (memory <= 4 || cores <= 4)) return 'low'
  // Integrated laptop graphics and other phones/tablets
  if (/intel(.*)(hd|uhd) graphics|intel\(r\) (hd|uhd)/i.test(gpu)) return 'medium'
  if (touch || smallScreen) return 'medium'
  return 'high'
}

// The session's tier, shared by the castle and every room
let sessionTier = null
let calibrated = false
function getSessionTier() {
  if (!sessionTier) sessionTier = forced || detectTier()
  return sessionTier
}

const QualityContext = createContext({ tier: 'medium', ...QUALITY.medium, setTier: () => {}, calibrated: true })

export function useQuality() {
  return useContext(QualityContext)
}

/** Must be rendered inside <Canvas>. Provides the session's tier. */
export function QualityProvider({ children }) {
  const [tier, setTierState] = useState(getSessionTier)
  const value = useMemo(
    () => ({
      tier,
      ...QUALITY[tier],
      setTier: (t) => {
        sessionTier = t
        setTierState(t)
      },
    }),
    [tier]
  )
  return (
    <QualityContext.Provider value={value}>
      <LightBudget budget={value.lights} />
      <RendererSettings />
      {children}
    </QualityContext.Provider>
  )
}

const nextFrame = () => new Promise((res) => requestAnimationFrame(() => res()))

/** Average frame rate over `ms`, ignoring the first few frames. */
async function measureFps(ms = 1400) {
  for (let i = 0; i < 6; i++) await nextFrame()
  const start = performance.now()
  let frames = 0
  while (performance.now() - start < ms) {
    await nextFrame()
    frames++
  }
  return (frames * 1000) / (performance.now() - start)
}

/**
 * One-off calibration, run behind the first scene's loading screen after its
 * shaders are compiled. `apply(tier)` switches tier and resolves once the
 * scene is ready to be measured again. Later scenes skip it.
 */
export async function calibrateOnce(currentTier, apply) {
  if (calibrated || forced) {
    calibrated = true
    return
  }
  calibrated = true
  // A hidden/background page is throttled by the browser — its frame rate
  // says nothing about the device; keep the detected tier then.
  if (document.visibilityState !== 'visible') return
  let tier = currentTier
  let fps = await measureFps()
  if (fps < 6) return
  // Too slow: step down until it holds (at most twice)
  for (let i = 0; i < 2 && fps < 40 && TIERS.indexOf(tier) > 0; i++) {
    tier = TIERS[TIERS.indexOf(tier) - 1]
    await apply(tier)
    fps = await measureFps()
  }
  // Plenty of headroom: try one step up, and keep it only if it still holds
  if (tier === currentTier && fps >= 56 && TIERS.indexOf(tier) < TIERS.length - 1) {
    const up = TIERS[TIERS.indexOf(tier) + 1]
    await apply(up)
    const upFps = await measureFps()
    if (upFps < 48) await apply(tier)
  }
}

/**
 * Keeps at most `budget` point/spot lights switched on — every extra light
 * makes every lit material in view more expensive. Lights marked
 * `userData.essential` always stay on; the rest are ranked by how much they
 * can light near the camera.
 *
 * Deliberately sticky, so lights don't pop on and off as the camera moves:
 * it re-checks every couple of seconds and only swaps a lit light for an
 * unlit one that scores clearly (60 %) higher. The number of lit lights stays
 * constant, so a swap never forces the shaders to recompile.
 */
function LightBudget({ budget }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const last = useRef(-10)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    if (state.clock.elapsedTime - last.current < 2) return
    last.current = state.clock.elapsedTime
    const lights = []
    scene.traverse((o) => {
      if (o.isPointLight || o.isSpotLight) lights.push(o)
    })
    const setOn = (l, on) => {
      l.visible = on
      l.userData.budgetOff = !on
    }
    if (!Number.isFinite(budget) || lights.length <= budget) {
      lights.forEach((l) => l.userData.budgetOff && setOn(l, true))
      return
    }
    const score = (l) => {
      l.getWorldPosition(tmp)
      const reach = l.distance || 20
      return (l.userData.essential ? 1e9 : 0) + (Math.max(l.intensity, 0.1) * reach) / (1 + tmp.distanceTo(camera.position))
    }
    const scored = lights.map((l) => ({ l, s: score(l) }))
    let on = scored.filter((x) => !x.l.userData.budgetOff)
    let off = scored.filter((x) => x.l.userData.budgetOff)
    // Trim or top up to exactly the budget (first run, tier change, new lights)
    on.sort((x, y) => y.s - x.s)
    off.sort((x, y) => y.s - x.s)
    while (on.length > budget) off.push(on.pop())
    while (on.length < budget && off.length) on.push(off.shift())
    // Sticky swaps: only when an unlit light clearly beats the weakest lit one
    on.sort((x, y) => y.s - x.s)
    off.sort((x, y) => y.s - x.s)
    while (off.length && on.length && off[0].s > on[on.length - 1].s * 1.6) {
      const weakest = on.pop()
      on.push(off.shift())
      off.push(weakest)
      on.sort((x, y) => y.s - x.s)
      off.sort((x, y) => y.s - x.s)
    }
    on.forEach((x) => setOn(x.l, true))
    off.forEach((x) => setOn(x.l, false))
  })
  return null
}

/**
 * Resolution follows the tier; without post-processing the renderer does
 * the tone mapping itself (the post stack normally does it after bloom).
 */
function RendererSettings() {
  const q = useQuality()
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, q.dpr))
  }, [q.dpr, setDpr])
  useEffect(() => {
    gl.toneMapping = q.post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
  }, [gl, q.post])
  return null
}
