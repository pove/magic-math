/**
 * Procedural SVG scene backgrounds — one rich animated scene per floor theme.
 * 100% code-drawn, zero assets, scales to any resolution.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FLOOR_INTRO, ROOM_INTRO } from '../engine/roomAnimations'
import { getRoomVariant } from '../engine/roomVariants'
import useViewport from '../hooks/useViewport'

// Deterministic pseudo-random so scenes don't reshuffle every render
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const uidBase = `scene-${Math.random().toString(36).slice(2, 8)}`

/* ---------- Shared pieces ---------- */

function Stars({ rand, count = 40, area = '0 0 1000 600' }) {
  const stars = useMemo(() => {
    const r = mulberry32(rand)
    return Array.from({ length: count }, (_, i) => ({
      x: r() * 1000, y: r() * 380, s: 1 + r() * 2.4, d: r() * 4, o: 0.3 + r() * 0.7, i,
    }))
  }, [rand, count])
  return (
    <g>
      {stars.map((s) => (
        <circle key={s.i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o}>
          <animate attributeName="opacity" values={`${s.o};0.1;${s.o}`} dur={`${2 + (s.d % 3)}s`} begin={`${s.d}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

function Window({ x, y, w = 70, h = 110, sky = '#1e1b4b' }) {
  const id = `${uidBase}-win-${x}-${y}`
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <path d={`M ${x - 6} ${y - 6} h ${w + 12} v ${h + 12} h -${w + 12} Z`} fill="#3f3f46" />
      <path d={`M ${x} ${y} h ${w} v ${h} h -${w} Z`} fill={`url(#${id})`} />
      <path d={`M ${x + w / 2} ${y} v ${h} M ${x} ${y + h / 2} h ${w}`} stroke="#3f3f46" strokeWidth="6" />
      <path d={`M ${x - 10} ${y + h + 6} h ${w + 20} l -8 10 h -${w + 4} Z`} fill="#52525b" />
      {/* moon glow */}
      <circle cx={x + w * 0.72} cy={y + h * 0.28} r="9" fill="#fef9c3" opacity="0.95">
        <animate attributeName="opacity" values="0.95;0.7;0.95" dur="4s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function Torch({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-4" y="0" width="8" height="34" rx="3" fill="#78350f" />
      <ellipse cx="0" cy="-10" rx="10" ry="16" fill="#f59e0b" opacity="0.35">
        <animate attributeName="rx" values="10;13;10" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="ry" values="16;20;16" dur="0.8s" repeatCount="indefinite" />
      </ellipse>
      <path d="M 0 -26 Q 8 -12 0 -2 Q -8 -12 0 -26" fill="#f97316">
        <animate attributeName="opacity" values="1;0.75;1" dur="0.5s" repeatCount="indefinite" />
      </path>
      <path d="M 0 -18 Q 4 -10 0 -4 Q -4 -10 0 -18" fill="#fde047" />
    </g>
  )
}

function FloorStone({ y = 520 }) {
  return (
    <g>
      <rect x="-400" y={y} width="1800" height={900 - y} fill="#3f3147" />
      <rect x="-400" y={y} width="1800" height="10" fill="#584a68" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 170 + (row % 2 ? 85 : 0)}
            y={y + 14 + row * 22}
            width="160"
            height="18"
            rx="3"
            fill="#4c3d5c"
            opacity={0.5 + ((row * 7 + col * 13) % 5) * 0.1}
          />
        ))
      )}
    </g>
  )
}

function Carpet({ color = '#7f1d1d', portrait }) {
  const floorY = portrait ? 800 : 600
  const y0 = floorY - 100
  return (
    <g opacity="0.85">
      <path d={`M 330 ${floorY} L 420 ${y0} L 580 ${y0} L 670 ${floorY} Z`} fill={color} />
      <path d={`M 360 ${floorY} L 432 ${y0 + 12} L 568 ${y0 + 12} L 640 ${floorY}`} fill="none" stroke="#fbbf24" strokeWidth="4" opacity="0.6" />
    </g>
  )
}

function Banners({ color = '#7c3aed', portrait }) {
  const xs = portrait ? [320, 680] : [140, 860]
  return (
    <g>
      {xs.map((x) => (
        <g key={x}>
          <rect x={x - 4} y="40" width="8" height="30" fill="#52525b" />
          <path d={`M ${x - 45} 66 L ${x + 45} 66 L ${x + 45} 190 L ${x} 220 L ${x - 45} 190 Z`} fill={color} />
          <path d={`M ${x - 45} 66 L ${x + 45} 66 L ${x + 45} 80 L ${x - 45} 80 Z`} fill="#fbbf24" />
          <text x={x} y="150" textAnchor="middle" fontSize="42" fill="#fbbf24">✦</text>
        </g>
      ))}
    </g>
  )
}

/* ---------- Scene themes ---------- */

function CastleEntrance() {
  return (
    <>
      <defs>
        <linearGradient id={`${uidBase}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0533" /><stop offset="100%" stopColor="#2d1b69" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-400" width="1800" height="1400" fill={`url(#${uidBase}-sky)`} />
      <Stars rand={11} count={50} />
      <circle cx="850" cy="90" r="38" fill="#fef9c3" opacity="0.9" />
      <circle cx="836" cy="82" r="34" fill="#1a0533" />
      {/* distant towers */}
      <g fill="#241547">
        <rect x="60" y="260" width="70" height="240" /><path d="M 55 260 L 135 260 L 95 200 Z" />
        <rect x="880" y="280" width="60" height="220" /><path d="M 875 280 L 945 280 L 905 228 Z" />
      </g>
      {/* castle wall */}
      <rect x="150" y="300" width="700" height="300" fill="#3b2d52" />
      {[...Array(12)].map((_, i) => (
        <rect key={i} x={150 + i * 60} y="275" width="36" height="30" fill="#3b2d52" />
      ))}
      {/* gate */}
      <path d="M 430 600 L 430 460 Q 500 400 570 460 L 570 600 Z" fill="#1c1022" />
      <path d="M 430 600 L 430 460 Q 500 400 570 460 L 570 600" fill="none" stroke="#fbbf24" strokeWidth="5" opacity="0.7" />
      <Torch x={395} y={430} scale={1.2} /><Torch x={605} y={430} scale={1.2} />
      <Window x={250} y={340} w={54} h={84} /><Window x={700} y={340} w={54} h={84} />
      <FloorStone y={540} />
    </>
  )
}

function Library({ portrait }) {
  const shelfXs = portrait ? [280, 500] : [80, 720]
  const bookPositions = portrait
    ? [[430, -60], [560, 140], [430, 320]]
    : [[350, 180], [480, 300], [620, 150]]
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#2a1708" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#4a2c12" opacity="0.5" />
      {/* bookshelves */}
      {shelfXs.map((x) => (
        <g key={x}>
          <rect x={x} y="120" width="200" height="400" fill="#5c3a1e" />
          {[0, 1, 2, 3].map((shelf) => (
            <g key={shelf}>
              <rect x={x + 8} y={140 + shelf * 95} width="184" height="80" fill="#3a230f" />
              {[...Array(9)].map((_, b) => {
                const colors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777']
                const bh = 55 + ((b * 17 + shelf * 7) % 20)
                return (
                  <rect key={b} x={x + 14 + b * 20} y={218 + shelf * 95 - bh} width="15" height={bh} rx="2"
                    fill={colors[(b + shelf) % 6]} />
                )
              })}
            </g>
          ))}
        </g>
      ))}
      {/* floating magic books */}
      {bookPositions.map(([bx, by], i) => (
        <g key={i}>
          <g transform={`translate(${bx},${by})`}>
            <animateTransform attributeName="transform" type="translate"
              values={`${bx},${by}; ${bx},${by - 15}; ${bx},${by}`} dur={`${3 + i}s`} repeatCount="indefinite" />
            <path d="M 0 0 Q 25 -12 50 0 L 50 30 Q 25 18 0 30 Z" fill="#dc2626" />
            <path d="M 50 0 Q 75 -12 100 0 L 100 30 Q 75 18 50 30 Z" fill="#b91c1c" />
            <line x1="50" y1="0" x2="50" y2="30" stroke="#fde68a" strokeWidth="2" />
            <circle cx="50" cy="-18" r="3" fill="#fde047"><animate attributeName="cy" values="-18;-30;-18" dur="2s" repeatCount="indefinite" /></circle>
          </g>
        </g>
      ))}
      <Torch x={500} y={120} scale={1.1} />
      <Carpet color="#7f1d1d" portrait={portrait} />
      <FloorStone y={520} />
    </>
  )
}

function PotionLab() {
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#041f14" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#064e3b" opacity="0.4" />
      <Stars rand={33} count={15} />
      {/* shelves with jars */}
      <rect x="120" y="130" width="760" height="14" fill="#3f2d1e" />
      <rect x="120" y="270" width="760" height="14" fill="#3f2d1e" />
      {[...Array(8)].map((_, i) => {
        const colors = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24']
        const c = colors[i % 4]
        return (
          <g key={i}>
            <rect x={160 + i * 90} y={90 + (i % 2) * 140} width="34" height="44" rx="8" fill={c} opacity="0.85" />
            <rect x={166 + i * 90} y={82 + (i % 2) * 140} width="22" height="12" rx="3" fill="#92400e" />
            <circle cx={177 + i * 90} cy={76 + (i % 2) * 140} r="3" fill={c} opacity="0.7">
              <animate attributeName="cy" values={`${76 + (i % 2) * 140};${56 + (i % 2) * 140};${76 + (i % 2) * 140}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )
      })}
      {/* big cauldron */}
      <g transform="translate(500,430)">
        <ellipse cx="0" cy="90" rx="130" ry="18" fill="#022c22" />
        <path d="M -110 0 A 110 95 0 0 0 110 0 Z" fill="#1f2937" />
        <ellipse cx="0" cy="0" rx="110" ry="24" fill="#374151" />
        <ellipse cx="0" cy="2" rx="92" ry="17" fill="#10b981">
          <animate attributeName="ry" values="17;21;17" dur="2s" repeatCount="indefinite" />
        </ellipse>
        {[[-40, -14], [10, -20], [50, -10]].map(([bx, by], i) => (
          <circle key={i} cx={bx} cy={by} r="7" fill="#6ee7b7" opacity="0.8">
            <animate attributeName="cy" values={`${by};${by - 45};${by}`} dur={`${1.6 + i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur={`${1.6 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* fire under cauldron */}
        {[-50, 0, 50].map((fx, i) => (
          <path key={i} d={`M ${fx} 96 Q ${fx + 10} 74 ${fx} 62 Q ${fx - 10} 74 ${fx} 96`} fill="#f97316">
            <animate attributeName="opacity" values="1;0.5;1" dur={`${0.4 + i * 0.15}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>
      <FloorStone y={545} />
    </>
  )
}

function EnchantedGarden() {
  return (
    <>
      <defs>
        <linearGradient id={`${uidBase}-gsky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1445" /><stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-400" width="1800" height="1400" fill={`url(#${uidBase}-gsky)`} />
      <Stars rand={7} count={45} />
      <circle cx="820" cy="100" r="34" fill="#fef9c3" opacity="0.9" />
      {/* hedges */}
      <g fill="#14532d">
        <ellipse cx="120" cy="470" rx="130" ry="70" /><ellipse cx="320" cy="500" rx="120" ry="60" />
        <ellipse cx="700" cy="500" rx="130" ry="65" /><ellipse cx="900" cy="470" rx="110" ry="70" />
      </g>
      {/* glowing flowers */}
      {[...Array(10)].map((_, i) => {
        const fx = 60 + i * 100
        const fy = 470 + ((i * 37) % 60)
        const colors = ['#f472b6', '#fbbf24', '#a78bfa', '#34d399']
        return (
          <g key={i}>
            <line x1={fx} y1={fy} x2={fx} y2={fy - 26} stroke="#166534" strokeWidth="3" />
            <circle cx={fx} cy={fy - 32} r="8" fill={colors[i % 4]}>
              <animate attributeName="r" values="8;10;8" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )
      })}
      {/* fireflies */}
      {[...Array(8)].map((_, i) => (
        <circle key={i} cx={150 + i * 90} cy={200 + ((i * 53) % 150)} r="4" fill="#fde047">
          <animate attributeName="cx" values={`${150 + i * 90};${170 + i * 90};${150 + i * 90}`} dur={`${4 + i}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${200 + ((i * 53) % 150)};${180 + ((i * 53) % 150)};${200 + ((i * 53) % 150)}`} dur={`${3 + i * 0.7}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.2;1" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <FloorStone y={545} />
    </>
  )
}

function PortraitGallery({ portrait }) {
  // In portrait, stack the three portraits vertically (using the taller
  // viewBox) instead of spreading them across the width, which the narrow
  // slice would otherwise crop down to just the center one.
  const frames = portrait
    ? [[500, -160], [500, 135], [500, 428]]
    : [[180, 130], [500, 130], [820, 130]]
  const floorY = portrait ? 680 : 530
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#2e0a0a" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#6b1c1c" opacity="0.35" />
      {frames.map(([x, topY], i) => (
        <g key={i}>
          <rect x={x - 85} y={topY} width="170" height="210" rx="8" fill="#78350f" />
          <rect x={x - 70} y={topY + 15} width="140" height="180" fill="#1c1917" />
          {/* portrait face that follows a slow blink */}
          <ellipse cx={x} cy={topY + 85} rx="34" ry="38" fill="#f4d4a0" />
          <ellipse cx={x - 13} cy={topY + 78} rx="5" ry="6" fill="#1e293b">
            <animate attributeName="ry" values="6;0.5;6" dur={`${3 + i}s`} repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={x + 13} cy={topY + 78} rx="5" ry="6" fill="#1e293b">
            <animate attributeName="ry" values="6;0.5;6" dur={`${3 + i}s`} repeatCount="indefinite" />
          </ellipse>
          <path d={`M ${x - 12} ${topY + 106} Q ${x} ${topY + 114} ${x + 12} ${topY + 106}`} stroke="#1e293b" strokeWidth="2.5" fill="none" />
          <path d={`M ${x - 40} ${topY + 35} Q ${x} ${topY + 10} ${x + 40} ${topY + 35} L ${x + 40} ${topY + 55} Q ${x} ${topY + 32} ${x - 40} ${topY + 55} Z`}
            fill={['#7c3aed', '#2563eb', '#be123c'][i]} />
          <text x={x} y={topY + 180} textAnchor="middle" fontSize="16" fill="#fbbf24" opacity="0.7">✦</text>
        </g>
      ))}
      {portrait ? (
        <><Torch x={330} y={240} /><Torch x={670} y={240} /></>
      ) : (
        <><Torch x={340} y={110} /><Torch x={660} y={110} /></>
      )}
      <Carpet color="#450a0a" portrait={portrait} />
      <FloorStone y={floorY} />
    </>
  )
}

function SpellClassroom({ portrait }) {
  const deskXs = portrait ? [350, 500, 650] : [220, 500, 780]
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#0c1445" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#1e3a8a" opacity="0.4" />
      {/* blackboard with floating equation */}
      <rect x="330" y="110" width="340" height="190" rx="10" fill="#14532d" stroke="#78350f" strokeWidth="10" />
      <text x="500" y="205" textAnchor="middle" fontSize="52" fill="#fefce8" fontFamily="'Fredoka One', cursive">✦ + ✦ = ✨</text>
      <text x="500" y="255" textAnchor="middle" fontSize="26" fill="#a7f3d0" fontFamily="'Fredoka One', cursive">¡Aprende la magia!</text>
      {/* desks */}
      {deskXs.map((x) => (
        <g key={x}>
          <rect x={x - 60} y="450" width="120" height="16" rx="4" fill="#78350f" />
          <rect x={x - 48} y="466" width="12" height="60" fill="#5c3a1e" />
          <rect x={x + 36} y="466" width="12" height="60" fill="#5c3a1e" />
          {/* spellbook on desk */}
          <rect x={x - 22} y="432" width="44" height="18" rx="3" fill="#7c3aed" />
          <rect x={x - 22} y="432" width="44" height="5" rx="2" fill="#fbbf24" />
        </g>
      ))}
      {/* floating sparkles from wand point */}
      {[...Array(6)].map((_, i) => (
        <circle key={i} cx={500 + Math.cos(i) * 120} cy={340 + (i % 3) * 30} r="4" fill="#fde047">
          <animate attributeName="cy" values={`${340 + (i % 3) * 30};${300 + (i % 3) * 30};${340 + (i % 3) * 30}`} dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <Banners color="#1e3a8a" portrait={portrait} />
      <FloorStone y={540} />
    </>
  )
}

function ClockTower({ portrait }) {
  const gearXs = portrait ? [350, 650] : [150, 850]
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#1c1c1c" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#374151" opacity="0.4" />
      {/* giant clock */}
      <circle cx="500" cy="230" r="150" fill="#78350f" />
      <circle cx="500" cy="230" r="128" fill="#fef3c7" />
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <circle key={i} cx={500 + Math.sin(a) * 108} cy={230 - Math.cos(a) * 108} r="6" fill="#78350f" />
      })}
      {/* moving hands */}
      <line x1="500" y1="230" x2="500" y2="140" stroke="#1c1917" strokeWidth="9" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 500 230" to="360 500 230" dur="90s" repeatCount="indefinite" />
      </line>
      <line x1="500" y1="230" x2="560" y2="230" stroke="#1c1917" strokeWidth="7" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 500 230" to="360 500 230" dur="12s" repeatCount="indefinite" />
      </line>
      <circle cx="500" cy="230" r="10" fill="#78350f" />
      {/* gears */}
      {gearXs.map((gx, gi) => (
        <g key={gx} transform={`translate(${gx},470)`}>
          <circle r="55" fill="#52525b" />
          <circle r="20" fill="#1c1c1c" />
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <rect key={i} x={-7} y="-68" width="14" height="18" rx="3" fill="#52525b"
              transform={`rotate(${(a * 180) / Math.PI})`} />
          })}
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${gx} 470`} to={`${gi ? -360 : 360} ${gx} 470`} dur="20s" repeatCount="indefinite" additive="sum" />
        </g>
      ))}
      <FloorStone y={550} />
    </>
  )
}

function CryptOfSages({ portrait }) {
  const orbXs = portrait ? [340, 660] : [250, 750]
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#0d0d14" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#1a0533" opacity="0.5" />
      <Stars rand={99} count={20} />
      {/* columns */}
      {[100, 320, 680, 900].map((x) => (
        <g key={x}>
          <rect x={x - 26} y="80" width="52" height="440" fill="#2a2140" />
          <rect x={x - 34} y="70" width="68" height="18" rx="4" fill="#3d3158" />
          <rect x={x - 34} y="510" width="68" height="18" rx="4" fill="#3d3158" />
        </g>
      ))}
      {/* crystal orbs on pedestals */}
      {orbXs.map((x, i) => (
        <g key={x}>
          <rect x={x - 30} y="420" width="60" height="90" fill="#3f3f46" />
          <circle cx={x} cy="390" r="38" fill="#8b5cf6" opacity="0.35" />
          <circle cx={x} cy="390" r="26" fill="#a78bfa" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.4;0.7" dur={`${2.5 + i}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={x - 8} cy="382" r="7" fill="#ede9fe" opacity="0.9" />
        </g>
      ))}
      {/* floating ancient scroll */}
      <g transform="translate(500,250)">
        <animateTransform attributeName="transform" type="translate" values="500,250; 500,232; 500,250" dur="3.5s" repeatCount="indefinite" />
        <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#e7d8b0" />
        <rect x="-62" y="-34" width="12" height="68" rx="5" fill="#b45309" />
        <rect x="50" y="-34" width="12" height="68" rx="5" fill="#b45309" />
        {[0, 1, 2].map((l) => <line key={l} x1="-40" y1={-14 + l * 15} x2="40" y2={-14 + l * 15} stroke="#92703c" strokeWidth="3" />)}
      </g>
      <Torch x={500} y={90} scale={1.2} />
      <FloorStone y={545} />
    </>
  )
}

function Observatory({ portrait }) {
  const planetX = portrait ? 620 : 800
  return (
    <>
      <defs>
        <radialGradient id={`${uidBase}-ospace`} cx="0.5" cy="0.3" r="1">
          <stop offset="0%" stopColor="#0c1a4a" /><stop offset="100%" stopColor="#000010" />
        </radialGradient>
      </defs>
      <rect x="-400" y="-400" width="1800" height="1400" fill={`url(#${uidBase}-ospace)`} />
      <Stars rand={55} count={70} />
      {/* planet with ring */}
      <g transform={`translate(${planetX},140)`}>
        <circle r="46" fill="#f59e0b" />
        <circle r="46" fill="#fbbf24" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <ellipse rx="78" ry="18" fill="none" stroke="#fde68a" strokeWidth="6" opacity="0.8" transform="rotate(-18)" />
      </g>
      {/* shooting star */}
      <line x1="100" y1="80" x2="160" y2="110" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
        <animate attributeName="x1" values="100;300;100" dur="4s" repeatCount="indefinite" />
        <animate attributeName="y1" values="80;150;80" dur="4s" repeatCount="indefinite" />
      </line>
      {/* telescope */}
      <g transform="translate(380,420)">
        <rect x="-14" y="30" width="28" height="110" fill="#334155" />
        <g transform="rotate(-30)">
          <rect x="-24" y="-90" width="48" height="130" rx="10" fill="#475569" />
          <ellipse cx="0" cy="-90" rx="24" ry="9" fill="#93c5fd" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" />
          </ellipse>
        </g>
      </g>
      {/* dome floor */}
      <FloorStone y={545} />
    </>
  )
}

function CouncilHall({ portrait }) {
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#1c0a00" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#78350f" opacity="0.35" />
      {/* long table */}
      <path d="M 300 470 L 700 470 L 760 560 L 240 560 Z" fill="#5c3a1e" />
      <path d="M 300 470 L 700 470 L 710 486 L 290 486 Z" fill="#78350f" />
      {/* candles on table */}
      {[380, 500, 620].map((x, i) => (
        <g key={x}>
          <rect x={x - 5} y="430" width="10" height="40" fill="#fef3c7" />
          <ellipse cx={x} cy="422" rx="6" ry="10" fill="#f59e0b" opacity="0.4">
            <animate attributeName="ry" values="10;13;10" dur={`${0.6 + i * 0.2}s`} repeatCount="indefinite" />
          </ellipse>
          <path d={`M ${x} 412 Q ${x + 5} 420 ${x} 428 Q ${x - 5} 420 ${x} 412`} fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.7;1" dur={`${0.5 + i * 0.2}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      {/* throne */}
      <g transform="translate(500,240)">
        <rect x="-90" y="0" width="180" height="230" rx="16" fill="#7f1d1d" />
        <rect x="-70" y="20" width="140" height="190" rx="10" fill="#991b1b" />
        <text x="0" y="120" textAnchor="middle" fontSize="64" fill="#fbbf24">👑</text>
      </g>
      <Banners color="#7f1d1d" portrait={portrait} />
      <Carpet color="#7f1d1d" portrait={portrait} />
      <FloorStone y={560} />
    </>
  )
}

function CloudBridge() {
  return (
    <>
      <defs>
        <linearGradient id={`${uidBase}-csky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" /><stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>
      <rect x="-400" y="-400" width="1800" height="1400" fill={`url(#${uidBase}-csky)`} />
      <Stars rand={21} count={12} />
      <circle cx="160" cy="110" r="42" fill="#fef08a" />
      <circle cx="160" cy="110" r="52" fill="#fef08a" opacity="0.3">
        <animate attributeName="r" values="52;62;52" dur="4s" repeatCount="indefinite" />
      </circle>
      {/* drifting clouds */}
      {[[100, 200, 1], [700, 150, 1.3], [420, 90, 0.9], [850, 320, 1.1]].map(([cx, cy, s], i) => (
        <g key={i} transform={`translate(${cx},${cy}) scale(${s})`} opacity="0.95">
          <animateTransform attributeName="transform" type="translate"
            values={`${cx},${cy}; ${cx + 30},${cy}; ${cx},${cy}`} dur={`${8 + i * 2}s`} repeatCount="indefinite" additive="replace" />
          <ellipse cx="0" cy="0" rx="55" ry="24" fill="#fff" />
          <ellipse cx="-35" cy="8" rx="35" ry="18" fill="#fff" />
          <ellipse cx="38" cy="8" rx="38" ry="19" fill="#fff" />
        </g>
      ))}
      {/* rainbow arc */}
      <path d="M 60 560 Q 500 120 940 560" fill="none" stroke="#f87171" strokeWidth="10" opacity="0.55" />
      <path d="M 75 560 Q 500 145 925 560" fill="none" stroke="#fbbf24" strokeWidth="10" opacity="0.55" />
      <path d="M 90 560 Q 500 170 910 560" fill="none" stroke="#4ade80" strokeWidth="10" opacity="0.55" />
      <path d="M 105 560 Q 500 195 895 560" fill="none" stroke="#60a5fa" strokeWidth="10" opacity="0.55" />
      {/* cloud bridge floor */}
      <g>
        {[...Array(7)].map((_, i) => (
          <ellipse key={i} cx={90 + i * 135} cy={545 + (i % 2) * 14} rx="85" ry="30" fill="#fff" opacity="0.98" />
        ))}
      </g>
    </>
  )
}

function WizardTower() {
  return (
    <>
      <rect x="-400" y="-400" width="1800" height="1400" fill="#000000" />
      <rect x="-400" y="-400" width="1800" height="1400" fill="#1c1405" opacity="0.6" />
      <Stars rand={77} count={35} />
      {/* the wand pedestal */}
      <g transform="translate(500,330)">
        <rect x="-70" y="90" width="140" height="140" fill="#292524" />
        <rect x="-84" y="76" width="168" height="22" rx="6" fill="#44403c" />
        {/* glowing wand */}
        <g transform="rotate(20)">
          <rect x="-6" y="-90" width="12" height="150" rx="6" fill="#a16207" />
          <circle cx="0" cy="-104" r="22" fill="#fbbf24">
            <animate attributeName="r" values="22;28;22" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="-104" r="36" fill="#fbbf24" opacity="0.25">
            <animate attributeName="r" values="36;48;36" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.05;0.25" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x="0" y="-96" textAnchor="middle" fontSize="22">⭐</text>
        </g>
        {/* rising sparks */}
        {[...Array(7)].map((_, i) => (
          <circle key={i} cx={-60 + i * 20} cy="60" r="3.5" fill="#fde047">
            <animate attributeName="cy" values="60;-40;60" dur={`${2.2 + i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur={`${2.2 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <Torch x={200} y={300} scale={1.4} /><Torch x={800} y={300} scale={1.4} />
      <FloorStone y={545} />
    </>
  )
}

const SCENES = {
  1: CastleEntrance, 2: Library, 3: PotionLab, 4: EnchantedGarden,
  5: PortraitGallery, 6: SpellClassroom, 7: ClockTower, 8: CryptOfSages,
  9: Observatory, 10: CouncilHall, 11: CloudBridge, 12: WizardTower,
}

/* ---------- Per-room variation ---------- */
// Every scene keeps its theme, but each room within a floor gets its own
// color mood (hue/saturation tint) and a matching set of ambient glow orbs,
// so rooms feel distinct without redrawing all 12 scenes by hand. The
// variants themselves live in engine/roomVariants.js, shared with the 3D
// room background.

function AmbientOrbs({ accent, seed, portrait }) {
  const orbs = useMemo(() => {
    const r = mulberry32(seed)
    const xMin = portrait ? 300 : 60
    const xRange = portrait ? 400 : 880
    return Array.from({ length: 6 }, (_, i) => ({
      x: xMin + r() * xRange,
      y: 120 + r() * 380,
      rad: 5 + r() * 6,
      dur: 3 + r() * 3,
      delay: r() * 2,
      i,
    }))
  }, [seed, portrait])
  return (
    <g>
      {orbs.map((o) => (
        <circle key={o.i} cx={o.x} cy={o.y} r={o.rad} fill={accent} opacity="0.55">
          <animate attributeName="cy" values={`${o.y};${o.y - 26};${o.y}`} dur={`${o.dur}s`} begin={`${o.delay}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.15;0.6" dur={`${o.dur}s`} begin={`${o.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  )
}

/**
 * introLevel controls the entrance flourish played when this background mounts:
 *  - 'floor': big "flying towards the room" zoom + darken→brighten (new floor)
 *  - 'room':  a quick, subtle settle (moving to the next room of the same floor)
 *  - 'none':  no animation (screens that already have their own intro, e.g. boss)
 */
export default function SceneBackground({ floor = 1, room = 1, introLevel = 'room', children }) {
  const { isPortrait } = useViewport()
  const Scene = SCENES[floor] || CastleEntrance
  const variant = getRoomVariant(room)
  const cssFilter = `saturate(${variant.sat}) hue-rotate(${variant.hue}deg)`
  // Scenes are authored on a wide 1000x600 landscape canvas. In portrait we
  // switch to a taller box centered on the same x=500 midline — this halves
  // the amount of horizontal "slice" cropping and gives scenes extra
  // vertical room to relocate side-anchored decorations into.
  const viewBox = isPortrait ? '200 -200 600 1000' : '0 0 1000 600'

  const isFloorIntro = introLevel === 'floor'
  const isRoomIntro = introLevel === 'room'
  const hasIntro = isFloorIntro || isRoomIntro

  const initialFilter = isFloorIntro
    ? `brightness(0.25) blur(14px) ${cssFilter}`
    : isRoomIntro
      ? `brightness(0.75) blur(3px) ${cssFilter}`
      : `brightness(1) blur(0px) ${cssFilter}`
  const initialScale = isFloorIntro ? 1.32 : isRoomIntro ? 1.06 : 1
  const duration = (isFloorIntro ? FLOOR_INTRO.bgDurationMs : isRoomIntro ? ROOM_INTRO.bgDurationMs : 500) / 1000

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={hasIntro ? { scale: initialScale, filter: initialFilter } : false}
        animate={{ scale: 1, filter: `brightness(1) blur(0px) ${cssFilter}` }}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
        >
          <Scene portrait={isPortrait} />
          <AmbientOrbs accent={variant.accent} seed={floor * 97 + room * 13} portrait={isPortrait} />
        </svg>
      </motion.div>
      {/* subtle vignette for readability */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
