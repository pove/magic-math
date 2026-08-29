// Every room scene (2D SVG or 3D) keeps its floor's theme, but each room
// within a floor gets its own color mood (hue/saturation tint) and a
// matching accent color for ambient glow — shared here so the 2D and 3D
// backgrounds stay in sync instead of drifting into two separate palettes.
export const ROOM_VARIANTS = [
  { hue: 0, sat: 1, accent: '#fbbf24' },
  { hue: 24, sat: 1.08, accent: '#f472b6' },
  { hue: -20, sat: 0.92, accent: '#60a5fa' },
  { hue: 42, sat: 1.12, accent: '#34d399' },
  { hue: -34, sat: 0.95, accent: '#a78bfa' },
  { hue: 14, sat: 1.05, accent: '#fb923c' },
]

export function getRoomVariant(room) {
  const idx = ((room - 1) % ROOM_VARIANTS.length + ROOM_VARIANTS.length) % ROOM_VARIANTS.length
  return ROOM_VARIANTS[idx]
}
