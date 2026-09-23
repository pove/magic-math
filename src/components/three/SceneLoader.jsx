import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useProgress, Stats } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { SHOW_FPS, useQuality } from './quality'

/**
 * Loading for the 3D scenes, so they start smooth instead of stuttering
 * through their first seconds.
 *
 * <SceneWarmup> lives inside the Canvas: it waits for every model download
 * (the loaders' shared progress), then compiles every material's shader up
 * front — including objects that are still hidden, like the characters
 * before they walk in — and lets a couple of frames render so textures and
 * the post-processing pipeline get uploaded too. Only then does it call
 * `onReady`. A time cap makes sure a hiccup can never trap the player on
 * the loading screen.
 *
 * <LoadingScreen> is the HTML curtain shown over the canvas meanwhile.
 */

const MAX_WAIT_MS = 12000

export function SceneWarmup({ onReady }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const active = useProgress((s) => s.active)
  const activeRef = useRef(active)
  activeRef.current = active
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    onReady?.()
  }

  // Safety net
  useEffect(() => {
    const t = setTimeout(finish, MAX_WAIT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (active || done.current) return undefined
    let cancelled = false
    // Give freshly loaded models a moment to mount before compiling
    const t = setTimeout(async () => {
      if (cancelled || activeRef.current) return
      const hidden = []
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o)
          o.visible = true
        }
      })
      try {
        if (gl.compileAsync) await gl.compileAsync(scene, camera)
        else gl.compile(scene, camera)
      } catch {
        // compiling up front is an optimisation — never block on it
      }
      hidden.forEach((o) => (o.visible = false))
      // Two more frames so textures and the post stack are on the GPU
      requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && finish()))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return null
}

/** Optional frame-rate meter (`?fps`) with the current quality tier. */
export function FpsMeter() {
  const q = useQuality()
  if (!SHOW_FPS) return null
  return (
    <>
      <Stats className="fps-meter" />
      <TierBadge tier={q.tier} />
    </>
  )
}

function TierBadge({ tier }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;left:84px;top:0;z-index:10000;background:#000a;color:#0f0;font:11px monospace;padding:3px 6px'
    el.textContent = `calidad: ${tier}`
    document.body.appendChild(el)
    return () => el.remove()
  }, [tier, gl])
  return null
}

const TIPS = [
  'Encendiendo las velas del castillo…',
  'Despertando al Director Mago…',
  'Puliendo el cristal mágico…',
  'Ordenando los libros de hechizos…',
  'Afinando las runas matemáticas…',
]

/** Full-screen magical curtain shown while a 3D scene gets ready. */
export function LoadingScreen({ visible }) {
  const models = useProgress((s) => s.progress)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])
  // Models are most of the wait; the last stretch is shader warm-up
  const pct = Math.round(Math.min(100, models * 0.85 + (visible ? 0 : 15)))
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[#0b0620]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
        >
          <div className="relative w-24 h-24">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-amber-400/30 border-t-amber-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border-2 border-purple-400/30 border-b-purple-300"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-4xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              🪄
            </motion.div>
          </div>
          <div className="font-title text-amber-300 text-xl sm:text-2xl text-center px-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            Preparando la magia…
          </div>
          <div className="w-56 sm:w-72 h-3 rounded-full bg-white/10 overflow-hidden border border-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-300"
              animate={{ width: `${Math.max(8, pct)}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
          <div className="font-body text-white/60 text-sm px-6 text-center">{tip}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
