/**
 * Camera framing for the 3D castle, derived from the viewport aspect ratio.
 *
 * three.js expresses `fov` vertically, so the horizontal field of view is
 * `2·atan(tan(fov/2)·aspect)`. On a phone held upright (aspect ≈ 0.46) that
 * collapses to roughly a quarter of the landscape width, and the keep gets
 * sliced down both sides. Widening the lens alone would fix the width but
 * distort badly, so we widen it a little and back the camera off for the rest.
 *
 * The targets are chosen so the focused floor plus its billboard labels
 * (~10 world units of half-width) stay comfortably inside the frame.
 */

const WIDE_ASPECT = 1.3
const NARROW_ASPECT = 0.5

const WIDE = { fov: 55, distance: 26 }
const NARROW = { fov: 68, distance: 32 }

export function framingForAspect(aspect) {
  const t = Math.min(1, Math.max(0, (WIDE_ASPECT - aspect) / (WIDE_ASPECT - NARROW_ASPECT)))
  return {
    fov: WIDE.fov + t * (NARROW.fov - WIDE.fov),
    distance: WIDE.distance + t * (NARROW.distance - WIDE.distance),
  }
}

export { WIDE as WIDE_FRAMING }
