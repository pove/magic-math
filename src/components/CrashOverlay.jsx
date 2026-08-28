import { Component, useEffect, useRef, useState } from 'react'

function formatError(error) {
  if (!error) return 'Error desconocido'
  if (error instanceof Error) return `${error.name}: ${error.message}\n${error.stack || ''}`
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function CrashCard({ title, detail }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0620]/97 text-white flex items-center justify-center p-4 overflow-auto">
      <div className="max-w-lg w-full bg-red-950/70 border border-red-500/50 rounded-2xl p-5">
        <div className="font-title text-red-300 text-base mb-2">⚠️ {title}</div>
        <pre className="whitespace-pre-wrap break-words text-red-100/90 text-[11px] sm:text-xs font-mono max-h-[45vh] overflow-auto">
          {detail}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 font-title text-white text-sm"
        >
          Recargar
        </button>
      </div>
    </div>
  )
}

// Dispatched when a Canvas's WebGL context is unexpectedly lost (see
// useCanvasWatchdog below) so GPU context loss — common on low-memory mobile
// devices rendering GLTF models — surfaces on screen too. The native
// `webglcontextlost` event doesn't bubble to window, so it can't be caught
// by a single global listener; each Canvas has to forward it itself.
const CONTEXT_LOST_EVENT = 'app:webgl-context-lost'

// react-three-fiber deliberately delays freeing a Canvas's WebGL context by
// 500ms after it unmounts (kept alive in case React 18 StrictMode's
// mount→unmount→mount dance immediately remounts it — see
// unmountComponentAtNode in @react-three/fiber). That means navigating
// between two 3D screens inside that window leaves two live WebGL contexts
// competing for the same GPU budget. Desktop GPUs shrug this off; low-memory
// mobile GPUs can't, and the browser force-loses a context to cope — which
// looked like the whole app silently dying. Freeing our own context the
// instant the screen unmounts (instead of waiting on that timer) closes the
// window where two contexts overlap.
export function useCanvasWatchdog() {
  const glRef = useRef(null)
  const lostHandlerRef = useRef(null)

  useEffect(
    () => () => {
      const gl = glRef.current
      const el = gl == null ? void 0 : gl.domElement
      if (el && lostHandlerRef.current) el.removeEventListener('webglcontextlost', lostHandlerRef.current)
      const ext = gl?.getContext?.()?.getExtension?.('WEBGL_lose_context')
      ext?.loseContext()
    },
    []
  )

  return (gl) => {
    glRef.current = gl
    const onLost = (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent(CONTEXT_LOST_EVENT))
    }
    lostHandlerRef.current = onLost
    gl.domElement.addEventListener('webglcontextlost', onLost)
  }
}

// Catches render/commit errors thrown by React components beneath it —
// including inside a react-three-fiber <Canvas>, whose scene graph is a
// separate reconciler root but still mounts/updates through this tree's
// effects. Without this, React's default behavior on an uncaught render
// error is to unmount the whole app, which is why the screen was going
// blank with nothing printed to the console.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      if (this.props.compact) {
        return (
          this.props.fallback ?? (
            <div className="w-full h-full min-h-[4rem] flex items-center justify-center bg-red-950/40 border border-red-500/30 rounded-xl text-red-100 text-[10px] font-mono p-2 text-center overflow-auto">
              {formatError(this.state.error).slice(0, 300)}
            </div>
          )
        )
      }
      return <CrashCard title="Algo se rompió" detail={formatError(this.state.error)} />
    }
    return this.props.children
  }
}

// Mount once near the app root. Catches errors React's own boundaries can't
// see: exceptions thrown asynchronously (e.g. inside three.js's animation
// frame loop, which runs outside any React commit), unhandled promise
// rejections (e.g. a GLTF fetch failing on a flaky mobile connection), and
// WebGL context loss forwarded via watchContextLoss.
export function GlobalCrashOverlay() {
  const [crash, setCrash] = useState(null)

  useEffect(() => {
    const onError = (event) => {
      setCrash(formatError(event.error || event.message))
    }
    const onRejection = (event) => {
      setCrash(formatError(event.reason))
    }
    const onContextLost = () => {
      setCrash('WebGL context perdido — probablemente el dispositivo se quedó sin memoria de vídeo al cargar los modelos 3D.')
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener(CONTEXT_LOST_EVENT, onContextLost)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener(CONTEXT_LOST_EVENT, onContextLost)
    }
  }, [])

  if (!crash) return null
  return <CrashCard title="Error no capturado" detail={crash} />
}
