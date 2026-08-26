import { useEffect, useState } from 'react'

/** Subscribes to a CSS media query and re-renders when it flips. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    // The query may already have flipped between render and effect
    setMatches(mql.matches)
    // Safari < 14 only ships the deprecated addListener API
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

/**
 * Layout facts that only JS can act on — canvas sizes and 3D camera framing,
 * which are numeric props rather than classes.
 *
 * Anything expressible in CSS should use Tailwind's `portrait:` / `sm:`
 * variants instead; the breakpoints here mirror them on purpose:
 *   isCompact ↔ everything below `sm:`
 *   isShort   ↔ phone held in landscape, where vertical room is the scarce axis
 */
export default function useViewport() {
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isCompact = useMediaQuery('(max-width: 639px)')
  const isShort = useMediaQuery('(max-height: 480px)')
  return { isPortrait, isCompact, isShort }
}
