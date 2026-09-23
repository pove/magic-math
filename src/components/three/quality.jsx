import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Adaptive render quality for every 3D scene.
 *
 * 1. A first guess from the device (touch, memory, CPU cores and the GPU's
 *    own name) — or the tier this browser settled on last time, which is
 *    remembered.
 * 2. Once the scene has finished loading, drei's PerformanceMonitor watches
 *    the real frame rate and steps the tier down (or back up) until the
 *    device holds a smooth frame rate. The result is saved for next time.
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

const STORE_KEY = 'magic_quality_tier'
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

function initialTier() {
  if (forced) return forced
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (TIERS.includes(saved)) return saved
  } catch {
    // storage unavailable (private mode…) — fall through to detection
  }
  return detectTier()
}

// Shared across scenes so the castle and the rooms agree on the tier
let currentTier = null

const QualityContext = createContext({ tier: 'medium', ...QUALITY.medium })

export function useQuality() {
  return useContext(QualityContext)
}

/**
 * Must be rendered inside <Canvas>. Provides the tier and adapts it.
 * `measuring` — only judge the frame rate once the scene has loaded (shader
 * compilation during loading would otherwise look like a slow device).
 */
export function QualityProvider({ children, measuring = true }) {
  const [tier, setTier] = useState(() => currentTier || (currentTier = initialTier()))
  const value = useMemo(() => ({ tier, ...QUALITY[tier] }), [tier])
  const measuringRef = useRef(measuring)
  measuringRef.current = measuring

  const step = (dir, api) => {
    if (forced || !measuringRef.current) return
    // A hidden or backgrounded page gets its frames throttled by the browser
    // (down to ~1 fps): that says nothing about the device, and saving a
    // tier learned from it would stick for good. Ignore those readings.
    if (document.visibilityState !== 'visible' || (api && api.fps < 6)) return
    setTier((t) => {
      const next = TIERS[Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(t) + dir))]
      currentTier = next
      try {
        localStorage.setItem(STORE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <PerformanceMonitor bounds={() => [42, 57]} flipflops={4} onDecline={(api) => step(-1, api)} onIncline={(api) => step(1, api)}>
      <QualityContext.Provider value={value}>
        <LightBudget budget={value.lights} />
        <RendererSettings />
        {children}
      </QualityContext.Provider>
    </PerformanceMonitor>
  )
}

/**
 * Keeps at most `budget` point/spot lights switched on — every extra light
 * makes every lit material in view more expensive. Lights marked
 * `userData.essential` always stay on; the rest are ranked by how much they
 * can light near the camera. Re-checks now and then, since lights come and
 * go (portal, active floor…).
 */
function LightBudget({ budget }) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const last = useRef(-1)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    if (state.clock.elapsedTime - last.current < 1) return
    last.current = state.clock.elapsedTime
    const lights = []
    scene.traverse((o) => {
      if (o.isPointLight || o.isSpotLight) lights.push(o)
    })
    if (!Number.isFinite(budget)) {
      lights.forEach((l) => {
        if (l.userData.budgetOff) {
          l.visible = true
          l.userData.budgetOff = false
        }
      })
      return
    }
    const score = (l) => {
      l.getWorldPosition(tmp)
      const reach = l.distance || 20
      return (l.userData.essential ? 1e9 : 0) + (Math.max(l.intensity, 0.1) * reach) / (1 + tmp.distanceTo(camera.position))
    }
    lights.sort((a, b) => score(b) - score(a))
    lights.forEach((l, i) => {
      const on = i < budget
      if (!on && (l.visible || !l.userData.budgetOff)) {
        l.visible = false
        l.userData.budgetOff = true
      } else if (on && l.userData.budgetOff) {
        l.visible = true
        l.userData.budgetOff = false
      }
    })
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
