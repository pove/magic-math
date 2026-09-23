import { createContext, useContext, useMemo, useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'

/**
 * Adaptive render quality for the 3D scenes. Starts from a guess based on the
 * device (phones/tablets begin one tier lower), then drei's PerformanceMonitor
 * watches the real frame rate and steps the tier down if the device can't keep
 * up — or back up if it has headroom — so a kid's old tablet stays smooth
 * while a desktop gets the full treatment.
 *
 *   high   – ambient occlusion, soft shadows, bloom, MSAA, dpr up to 2
 *   medium – shadows + bloom, dpr up to 1.5
 *   low    – bloom only, no shadows, dpr 1
 */

const TIERS = ['low', 'medium', 'high']

export const QUALITY = {
  low: { dpr: 1, shadows: false, shadowMapSize: 512, ao: false, msaa: 0, grass: 0.35 },
  medium: { dpr: 1.5, shadows: true, shadowMapSize: 1024, ao: false, msaa: 0, grass: 0.7 },
  high: { dpr: 2, shadows: true, shadowMapSize: 2048, ao: true, msaa: 4, grass: 1 },
}

function initialTier() {
  if (typeof window === 'undefined') return 'medium'
  const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  const small = Math.min(window.screen?.width || 1920, window.screen?.height || 1080) < 820
  const cores = navigator.hardwareConcurrency || 4
  if (touch && (small || cores <= 4)) return 'low'
  if (touch) return 'medium'
  return 'high'
}

const QualityContext = createContext({ tier: 'medium', ...QUALITY.medium })

export function useQuality() {
  return useContext(QualityContext)
}

/** Must be rendered inside <Canvas>. Wraps the scene and provides the tier. */
export function QualityProvider({ children }) {
  const [tier, setTier] = useState(initialTier)
  const value = useMemo(() => ({ tier, ...QUALITY[tier] }), [tier])
  const step = (dir) => setTier((t) => TIERS[Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(t) + dir))])

  return (
    <PerformanceMonitor
      bounds={() => [45, 58]}
      flipflops={3}
      onDecline={() => step(-1)}
      onIncline={() => step(1)}
    >
      <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
    </PerformanceMonitor>
  )
}
