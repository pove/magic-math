import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Shared geometry for the castle's round-arched windows, built once and
 * reused by every floor/turret (they're drawn instanced). Both pieces are
 * centred on the window's middle and face +Z.
 */

const W = 1.0
const H = 1.9

function archPath(target, w, h, cx = 0, cy = 0) {
  const rr = w / 2
  const straight = h - rr
  target.moveTo(cx - rr, cy - h / 2)
  target.lineTo(cx + rr, cy - h / 2)
  target.lineTo(cx + rr, cy - h / 2 + straight)
  target.absarc(cx, cy - h / 2 + straight, rr, 0, Math.PI, false)
  target.lineTo(cx - rr, cy - h / 2)
  return target
}

let glass
let frame

export function windowGlassGeometry() {
  if (!glass) glass = new THREE.ShapeGeometry(archPath(new THREE.Shape(), W, H), 16)
  return glass
}

/** Stone surround (arch with a hole), iron mullions and a sill, merged. */
export function windowFrameGeometry() {
  if (frame) return frame
  const outer = archPath(new THREE.Shape(), W + 0.36, H + 0.26, 0, 0.05)
  outer.holes.push(archPath(new THREE.Path(), W, H))
  const surround = new THREE.ExtrudeGeometry(outer, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, curveSegments: 16 })

  const mullionV = new THREE.BoxGeometry(0.06, H - 0.1, 0.06).translate(0, 0, 0.12)
  const mullionH = new THREE.BoxGeometry(W, 0.06, 0.06).translate(0, 0.12, 0.12)
  const sill = new THREE.BoxGeometry(W + 0.5, 0.14, 0.34).translate(0, -H / 2 - 0.08, 0.12)

  const parts = [surround, mullionV, mullionH, sill].map((g) => {
    const ng = g.index ? g.toNonIndexed() : g
    // Extrude UVs are in shape units; boxes are 0..1 — both fine for stone
    return ng
  })
  frame = mergeGeometries(parts, false)
  return frame
}
