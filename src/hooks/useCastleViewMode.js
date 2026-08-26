import { useCallback, useEffect, useMemo, useState } from 'react'

const LS_KEY = 'magic_school_castle_view'

function detectWebGLSupport() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch {
    return false
  }
}

/**
 * Resolves whether the castle should render as the classic 2D screen or the
 * 3D tower, and lets the user force either mode regardless of device support.
 * preference: 'auto' | '2d' | '3d', persisted per browser.
 */
export default function useCastleViewMode() {
  const supports3D = useMemo(detectWebGLSupport, [])
  const [preference, setPreferenceState] = useState(() => localStorage.getItem(LS_KEY) || 'auto')

  useEffect(() => {
    localStorage.setItem(LS_KEY, preference)
  }, [preference])

  const setPreference = useCallback((value) => setPreferenceState(value), [])

  const mode = preference === 'auto' ? (supports3D ? '3d' : '2d') : preference

  return { mode, preference, setPreference, supports3D }
}
