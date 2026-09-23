import * as THREE from 'three'

/**
 * Where the actors (player + Director Mago) stand in a 3D room, and where
 * the camera has to be for them to land inside the on-screen slot the HTML
 * layout reserves for them.
 *
 * The room screen lays out its UI in HTML (question, answers, hearts...)
 * and leaves an empty box where the characters go. We measure that box and
 * solve the camera from it:
 *   - its height decides how far away the camera stands (so the actors fill
 *     the box), and
 *   - its bottom-centre decides the camera pitch and how far left/right of
 *     the room's centre line the actors stand (so their feet land on the
 *     box's bottom edge).
 * The camera itself always looks straight down the room, so the room stays
 * centred and symmetric whatever the layout.
 */

export const ROOM_FOV = 52
const T = Math.tan(THREE.MathUtils.degToRad(ROOM_FOV / 2))

/** Depth (world z) of the actors' spot, in front of every room's props. */
export const STAGE_Z = 2.5
const EYE = 1.55

/** Framing used when there's no slot to aim at (no actors on screen). */
export const DEFAULT_FRAMING = {
  rest: [0, 3.2, 9],
  look: [0, 2.4, -12],
  stage: [0, 0, STAGE_Z],
}

/**
 * @param anchor  { bx, by, fh } — the slot's bottom-centre in NDC (-1..1,
 *                +y up) and its height as a fraction of the canvas height.
 * @param aspect  canvas width / height
 * @param actorsHeight  world height the slot has to fit (tallest actor)
 */
export function computeFraming(anchor, aspect, actorsHeight = 2.2) {
  if (!anchor || !(anchor.fh > 0.05)) return DEFAULT_FRAMING
  const { bx, by, fh } = anchor
  // Distance at which `actorsHeight` (+ a little headroom) fills the slot
  const dist = THREE.MathUtils.clamp((actorsHeight * 1.12) / (2 * T * fh), 3.4, 12)
  const horiz = Math.sqrt(Math.max(dist * dist - EYE * EYE, 1))
  // Pitch so the feet (at y=0, `horiz` ahead) project onto the slot's bottom
  const feetBelow = Math.atan(EYE / horiz)
  const pitch = -feetBelow - Math.atan(by * T)
  // Shift the actors sideways (instead of turning the camera) so their
  // centre projects onto the slot's centre line; keep them inside the room.
  const stageX = THREE.MathUtils.clamp(bx * T * aspect * horiz, -6.5, 6.5)
  const rest = [0, EYE, STAGE_Z + horiz]
  const look = [0, EYE + Math.sin(pitch) * 20, rest[2] - Math.cos(pitch) * 20]
  return { rest, look, stage: [stageX, 0, STAGE_Z] }
}

/**
 * Measure an HTML element against the canvas container, as the anchor that
 * computeFraming expects. Returns null when either isn't laid out yet.
 */
export function measureAnchor(el, container) {
  if (!el || !container) return null
  const r = el.getBoundingClientRect()
  const c = container.getBoundingClientRect()
  if (r.height < 4 || c.height < 4) return null
  const cx = r.left + r.width / 2 - c.left
  const bottom = r.bottom - c.top
  return {
    bx: (cx / c.width) * 2 - 1,
    by: 1 - (bottom / c.height) * 2,
    fh: r.height / c.height,
  }
}
