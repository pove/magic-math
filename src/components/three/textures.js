import * as THREE from 'three'

/**
 * Procedural, tileable surface textures painted on a <canvas> at runtime —
 * zero downloaded assets. Each generator returns a colour map plus a matching
 * normal map (derived from the same height field) and roughness map, so a
 * plain MeshStandardMaterial gets real per-brick relief under the lights.
 *
 * Results are cached per key: every floor/turret shares one GPU upload and
 * only clones the Texture wrapper to set its own repeat.
 */

const cache = new Map()

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Periodic value noise: a lattice of `period` cells that wraps, so the
 *  texture tiles seamlessly. */
function makeNoise(period, seed) {
  const r = rng(seed)
  const lattice = new Float32Array(period * period)
  for (let i = 0; i < lattice.length; i++) lattice[i] = r()
  const at = (x, y) => lattice[((y % period) + period) % period * period + (((x % period) + period) % period)]
  return (u, v) => {
    const x = u * period
    const y = v * period
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = x - xi
    const fy = y - yi
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const a = at(xi, yi)
    const b = at(xi + 1, yi)
    const c = at(xi, yi + 1)
    const d = at(xi + 1, yi + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

function fbm(noises, u, v) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (const n of noises) {
    sum += n(u, v) * amp
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function toTexture(canvas, srgb) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/** Build colour/normal/roughness canvases from per-pixel callbacks. */
function paint(size, sample, normalStrength) {
  const heights = new Float32Array(size * size)
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = size
  const cctx = colorCanvas.getContext('2d')
  const cimg = cctx.createImageData(size, size)
  const rough = document.createElement('canvas')
  rough.width = rough.height = size
  const rctx = rough.getContext('2d')
  const rimg = rctx.createImageData(size, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const s = sample(x / size, y / size)
      heights[i] = s.h
      cimg.data[i * 4] = Math.min(255, s.r * 255)
      cimg.data[i * 4 + 1] = Math.min(255, s.g * 255)
      cimg.data[i * 4 + 2] = Math.min(255, s.b * 255)
      cimg.data[i * 4 + 3] = 255
      const rv = Math.min(255, s.rough * 255)
      rimg.data[i * 4] = rimg.data[i * 4 + 1] = rimg.data[i * 4 + 2] = rv
      rimg.data[i * 4 + 3] = 255
    }
  }
  cctx.putImageData(cimg, 0, 0)
  rctx.putImageData(rimg, 0, 0)

  // Normal map from the height field (wrapping Sobel)
  const normal = document.createElement('canvas')
  normal.width = normal.height = size
  const nctx = normal.getContext('2d')
  const nimg = nctx.createImageData(size, size)
  const h = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1))
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1)) - (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1))
      let nx = -dx * normalStrength
      let ny = dy * normalStrength
      let nz = 1
      const len = Math.hypot(nx, ny, nz)
      nx /= len; ny /= len; nz /= len
      const i = (y * size + x) * 4
      nimg.data[i] = (nx * 0.5 + 0.5) * 255
      nimg.data[i + 1] = (ny * 0.5 + 0.5) * 255
      nimg.data[i + 2] = (nz * 0.5 + 0.5) * 255
      nimg.data[i + 3] = 255
    }
  }
  nctx.putImageData(nimg, 0, 0)

  return {
    map: toTexture(colorCanvas, true),
    normalMap: toTexture(normal, false),
    roughnessMap: toTexture(rough, false),
  }
}

/**
 * Staggered ashlar masonry: `rows` courses of `cols` blocks, each block with
 * its own tone, chipped bevelled edges and grainy surface; recessed mortar.
 */
function stoneSet({ rows = 8, cols = 6, seed = 7, size = 512 }) {
  const r = rng(seed)
  const tones = []
  for (let i = 0; i < rows * (cols + 1); i++) tones.push(0.86 + r() * 0.2)
  const tints = []
  for (let i = 0; i < rows * (cols + 1); i++) tints.push(r())
  const grain = [makeNoise(64, seed + 1), makeNoise(128, seed + 2), makeNoise(256, seed + 3)]
  const blotch = [makeNoise(6, seed + 4), makeNoise(12, seed + 5)]
  const chip = makeNoise(40, seed + 6)
  const mortar = 0.055

  return paint(size, (u, v) => {
    const row = Math.floor(v * rows)
    const fy = v * rows - row
    const shift = row % 2 ? 0.5 : 0
    const bu = u * cols + shift
    const col = Math.floor(bu)
    const fx = bu - col
    const colWrapped = ((col % cols) + cols) % cols
    const id = row * (cols + 1) + colWrapped

    // Distance to this block's edge, in block-height units, roughened so
    // the edges look chipped rather than ruler-straight.
    // (a block is ~2× wider than tall once the repeat is applied, hence the
    // halving of the horizontal distance).
    const ex = Math.min(fx, 1 - fx) * 2
    const ey = Math.min(fy, 1 - fy)
    const d = Math.min(ex, ey) - (chip(u, v) - 0.5) * 0.05

    const g = fbm(grain, u, v)
    const b = fbm(blotch, u, v)
    const isMortar = d < mortar
    const bevel = smoothstep(mortar, mortar + 0.09, d)

    if (isMortar) {
      const m = 0.4 + g * 0.1
      return { r: m * 0.9, g: m * 0.88, b: m, h: 0.05 + g * 0.05, rough: 0.98 }
    }
    const tone = tones[id] * (0.84 + g * 0.26) * (0.88 + b * 0.24)
    const t = tints[id]
    return {
      // Cool lavender-grey stone with a little warm/cool drift per block
      r: tone * (0.58 + t * 0.06),
      g: tone * (0.55 + (1 - t) * 0.03),
      b: tone * (0.68 + (1 - t) * 0.06),
      h: 0.35 + bevel * 0.5 + g * 0.18,
      rough: 0.78 + g * 0.18,
    }
  }, 3.2)
}

/** Overlapping rounded roof shingles (fish-scale), for the turret cones. */
function shingleSet({ rows = 10, cols = 14, seed = 21, size = 512 }) {
  const r = rng(seed)
  const tones = []
  for (let i = 0; i < rows * (cols + 1); i++) tones.push(0.75 + r() * 0.4)
  const grain = [makeNoise(64, seed + 1), makeNoise(128, seed + 2)]
  return paint(size, (u, v) => {
    const row = Math.floor(v * rows)
    const fy = v * rows - row
    const shift = row % 2 ? 0.5 : 0
    const bu = u * cols + shift
    const col = Math.floor(bu)
    const fx = bu - col
    const id = row * (cols + 1) + (((col % cols) + cols) % cols)
    // Fish-scale tile: square top, rounded lower lip (canvas y grows down,
    // which maps to down the roof). Outside the lip is the shadowed gap
    // where the row below tucks underneath.
    const cx = fx - 0.5
    const lip = 0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - (cx * 2) ** 2))
    const inTile = fy < lip
    const g = fbm(grain, u, v)
    const shade = smoothstep(0, 1, fy / lip) // catches light toward the lip
    const t = tones[id] * (0.75 + g * 0.3)
    if (!inTile) {
      return { r: 0.18 * t, g: 0.18 * t, b: 0.2 * t, h: 0.02, rough: 0.9 }
    }
    const k = t * (0.5 + shade * 0.55) * (1 - smoothstep(lip - 0.08, lip, fy) * 0.4)
    return { r: k, g: k, b: k, h: 0.3 + shade * 0.6 + g * 0.1, rough: 0.55 + g * 0.2 }
  }, 2.6)
}

/** Vertical wooden planks with grain and iron-banded seams. */
function woodSet({ planks = 5, seed = 33, size = 256 }) {
  const r = rng(seed)
  const tones = Array.from({ length: planks }, () => 0.8 + r() * 0.3)
  const streak = [makeNoise(8, seed + 1), makeNoise(16, seed + 2)]
  const fine = makeNoise(128, seed + 3)
  return paint(size, (u, v) => {
    const p = Math.floor(u * planks)
    const fx = u * planks - p
    const seam = Math.min(fx, 1 - fx) < 0.04
    // Stretch noise vertically for long grain
    const grain = fbm(streak, u * 6 + p * 0.37, v * 0.5) * 0.6 + fine(u, v) * 0.4
    const t = tones[p] * (0.7 + grain * 0.45)
    if (seam) return { r: 0.12, g: 0.07, b: 0.04, h: 0, rough: 0.9 }
    return { r: 0.48 * t, g: 0.29 * t, b: 0.15 * t, h: 0.5 + grain * 0.3, rough: 0.7 + grain * 0.2 }
  }, 2)
}

function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key)
}

/** Clone a cached set with its own repeat (shares the GPU image). */
function withRepeat(set, rx, ry) {
  const out = {}
  for (const k of Object.keys(set)) {
    const t = set[k].clone()
    t.repeat.set(rx, ry)
    t.needsUpdate = true
    out[k] = t
  }
  return out
}

export function stoneTextures(rx = 1, ry = 1) {
  return withRepeat(cached('stone', () => stoneSet({})), rx, ry)
}

export function shingleTextures(rx = 1, ry = 1) {
  return withRepeat(cached('shingle', () => shingleSet({})), rx, ry)
}

export function woodTextures(rx = 1, ry = 1) {
  return withRepeat(cached('wood', () => woodSet({})), rx, ry)
}

/**
 * A strip of glowing "runes" — the game's own math symbols — used as an
 * emissive map on each floor's band so the magic reads as *math* magic.
 */
export function runeBandTexture(repeatX = 1) {
  const base = cached('runes', () => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 64
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, 1024, 64)
    const glyphs = ['+', '−', '×', '÷', '=', 'π', '√', '∑', '%', '∞', '7', '3', '9', '½']
    ctx.font = 'bold 40px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#fff'
    const n = 16
    for (let i = 0; i < n; i++) {
      ctx.fillText(glyphs[(i * 5) % glyphs.length], (i + 0.5) * (1024 / n), 34)
    }
    // Thin engraved rails above and below the glyphs
    ctx.shadowBlur = 4
    ctx.fillRect(0, 5, 1024, 3)
    ctx.fillRect(0, 56, 1024, 3)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  })
  const t = base.clone()
  t.repeat.set(repeatX, 1)
  t.needsUpdate = true
  return t
}

/** Soft radial glow sprite (white → transparent) for halos and fireflies. */
export function glowTexture() {
  return cached('glow', () => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
}
