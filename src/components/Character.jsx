import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { getSkinById } from '../data/skins'

const SKIN_LIGHT = '#fddba8'
const SKIN_MID   = '#f9c584'
const SKIN_DARK  = '#e8a96b'

let _counter = 0

function darken(hex, amt = 0.26) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - Math.round(255 * amt))
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amt))
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amt))
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function WingsLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v  = skin.shapeVariant
  if (v === 1) return (
    <g opacity="0.85">
      <ellipse cx="36" cy="190" rx="30" ry="48" fill={c1} transform="rotate(-22 36 190)" />
      <ellipse cx="164" cy="190" rx="30" ry="48" fill={c1} transform="rotate(22 164 190)" />
      <ellipse cx="36" cy="190" rx="17" ry="32" fill={c2} opacity="0.55" transform="rotate(-22 36 190)" />
      <ellipse cx="164" cy="190" rx="17" ry="32" fill={c2} opacity="0.55" transform="rotate(22 164 190)" />
    </g>
  )
  if (v === 2) return (
    <g opacity="0.9">
      <path d="M 58 188 Q 18 148 13 202 Q 8 252 53 222 Z" fill={c1} />
      <path d="M 142 188 Q 182 148 187 202 Q 192 252 147 222 Z" fill={c1} />
      <path d="M 58 188 Q 28 162 24 205 Q 20 242 52 222 Z" fill={c2} opacity="0.4" />
      <path d="M 142 188 Q 172 162 176 205 Q 180 242 148 222 Z" fill={c2} opacity="0.4" />
    </g>
  )
  if (v === 3) return (
    <g opacity="0.85">
      <ellipse cx="33" cy="185" rx="32" ry="53" fill={c1} transform="rotate(-27 33 185)" />
      <ellipse cx="167" cy="185" rx="32" ry="53" fill={c1} transform="rotate(27 167 185)" />
      <ellipse cx="33" cy="200" rx="22" ry="33" fill={c2} transform="rotate(-17 33 200)" />
      <ellipse cx="167" cy="200" rx="22" ry="33" fill={c2} transform="rotate(17 167 200)" />
    </g>
  )
  return (
    <g opacity="0.9">
      <ellipse cx="36" cy="188" rx="30" ry="44" fill={c1} transform="rotate(-20 36 188)" />
      <ellipse cx="164" cy="188" rx="30" ry="44" fill={c1} transform="rotate(20 164 188)" />
      <path d="M 36 163 L 55 190 L 36 217 Z" fill={c2} opacity="0.6" />
      <path d="M 164 163 L 145 190 L 164 217 Z" fill={c2} opacity="0.6" />
    </g>
  )
}

function ShoesLayer({ skinId, uid }) {
  const skin = skinId ? getSkinById(skinId) : null
  const c1  = skin?.primaryColor   || '#ffffff'
  const c2  = skin?.secondaryColor || '#94a3b8'
  const c1d = darken(c1)
  const v   = skin?.shapeVariant || 1
  const gid = `shoeGrad${uid}`
  const defs = (
    <defs>
      <linearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="100%" stopColor={c1d} />
      </linearGradient>
    </defs>
  )
  const f = `url(#${gid})`
  if (v === 2) return (
    <g>{defs}
      <ellipse cx="72" cy="323" rx="23" ry="11" fill={c1d} />
      <ellipse cx="128" cy="323" rx="23" ry="11" fill={c1d} />
      <rect x="54" y="305" width="36" height="20" rx="7" fill={f} />
      <rect x="110" y="305" width="36" height="20" rx="7" fill={f} />
      <rect x="57" y="308" width="30" height="6" rx="3" fill={c2} opacity="0.5" />
      <rect x="113" y="308" width="30" height="6" rx="3" fill={c2} opacity="0.5" />
    </g>
  )
  if (v === 3) return (
    <g>{defs}
      <ellipse cx="72" cy="323" rx="23" ry="11" fill={c1d} />
      <ellipse cx="128" cy="323" rx="23" ry="11" fill={c1d} />
      <rect x="54" y="302" width="36" height="24" rx="5" fill={f} />
      <rect x="110" y="302" width="36" height="24" rx="5" fill={f} />
    </g>
  )
  if (v === 4) return (
    <g>{defs}
      <ellipse cx="72" cy="323" rx="25" ry="12" fill={c1d} />
      <ellipse cx="128" cy="323" rx="25" ry="12" fill={c1d} />
      <rect x="53" y="305" width="38" height="19" rx="9" fill={f} />
      <rect x="109" y="305" width="38" height="19" rx="9" fill={f} />
      <circle cx="72" cy="311" r="3.5" fill={c2} opacity="0.7" />
      <circle cx="128" cy="311" r="3.5" fill={c2} opacity="0.7" />
    </g>
  )
  return (
    <g>{defs}
      <ellipse cx="72" cy="323" rx="23" ry="11" fill={c1d} />
      <ellipse cx="128" cy="323" rx="23" ry="11" fill={c1d} />
      <rect x="54" y="308" width="36" height="17" rx="9" fill={f} />
      <rect x="110" y="308" width="36" height="17" rx="9" fill={f} />
    </g>
  )
}

function BottomLayer({ skinId, gender, uid }) {
  const skin    = skinId ? getSkinById(skinId) : null
  const c1      = skin?.primaryColor   || (gender === 'girl' ? '#4b5563' : '#1e40af')
  const c2      = skin?.secondaryColor || '#93c5fd'
  const c1d     = darken(c1, 0.22)
  const isSkirt = gender === 'girl' && (!skin || skin.shapeVariant <= 2)
  const gid     = `bottomGrad${uid}`
  const defs = (
    <defs>
      <linearGradient id={gid} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="100%" stopColor={c1d} />
      </linearGradient>
    </defs>
  )
  const f = `url(#${gid})`
  if (isSkirt) return (
    <g>{defs}
      <path d="M 68 232 L 56 322 L 94 322 L 100 272 L 106 322 L 144 322 L 132 232 Z" fill={f} />
      <path d="M 65 243 Q 100 258 135 243 L 132 232 L 68 232 Z" fill={c2} opacity="0.4" />
      <path d="M 68 268 Q 100 278 132 268" stroke={c2} strokeWidth="1.5" fill="none" opacity="0.35" />
    </g>
  )
  return (
    <g>{defs}
      <rect x="67" y="230" width="66" height="92" rx="6" fill={f} />
      <line x1="100" y1="230" x2="100" y2="322" stroke={c2} strokeWidth="2" opacity="0.28" />
      <rect x="67" y="230" width="10" height="92" rx="4" fill={c2} opacity="0.07" />
    </g>
  )
}

function TopLayer({ skinId, gender, uid }) {
  const skin = skinId ? getSkinById(skinId) : null
  const c1   = skin?.primaryColor   || (gender === 'boy' ? '#1d4ed8' : '#ec4899')
  const c2   = skin?.secondaryColor || '#93c5fd'
  const c1d  = darken(c1, 0.22)
  const v    = skin?.shapeVariant || 1
  const gid  = `topGrad${uid}`
  const defs = (
    <defs>
      <linearGradient id={gid} x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="100%" stopColor={c1d} />
      </linearGradient>
    </defs>
  )
  const f = `url(#${gid})`
  if (v === 2) return (
    <g>{defs}
      <path data-char="torso" d="M 60 178 Q 50 183 48 232 L 152 232 Q 150 183 140 178 L 120 167 L 80 167 Z" fill={f} />
      <path d="M 80 167 Q 100 178 120 167" stroke={c2} strokeWidth="3" fill="none" />
      <rect x="48" y="197" width="18" height="36" rx="7" fill={f} />
      <rect x="134" y="197" width="18" height="36" rx="7" fill={f} />
    </g>
  )
  if (v === 3) return (
    <g>{defs}
      <path data-char="torso" d="M 60 178 Q 50 183 48 232 L 152 232 Q 150 183 140 178 L 120 167 L 80 167 Z" fill="#ffffff" />
      <path d="M 65 178 Q 55 183 53 232 L 147 232 Q 145 183 135 178 L 115 170 L 85 170 Z" fill={f} opacity="0.28" />
      <rect x="48" y="197" width="18" height="36" rx="7" fill="#ffffff" />
      <rect x="134" y="197" width="18" height="36" rx="7" fill="#ffffff" />
      <circle cx="100" cy="197" r="4.5" fill={c2} />
      <circle cx="100" cy="213" r="4.5" fill={c2} />
    </g>
  )
  if (v === 4) return (
    <g>{defs}
      <path data-char="torso" d="M 60 178 Q 50 183 48 232 L 152 232 Q 150 183 140 178 L 120 167 L 80 167 Z" fill={f} />
      <path d="M 80 167 L 100 232 L 120 167" fill={c2} opacity="0.4" />
      <rect x="48" y="197" width="18" height="36" rx="7" fill={f} />
      <rect x="134" y="197" width="18" height="36" rx="7" fill={f} />
      <text x="100" y="208" textAnchor="middle" fontSize="14" fill={c2}>✦</text>
    </g>
  )
  return (
    <g>{defs}
      <path data-char="torso" d="M 60 178 Q 50 183 48 232 L 152 232 Q 150 183 140 178 L 120 167 L 80 167 Z" fill={f} />
      <rect x="48" y="197" width="18" height="36" rx="7" fill={f} />
      <rect x="134" y="197" width="18" height="36" rx="7" fill={f} />
      <path d="M 82 167 Q 100 175 118 167" stroke={c2} strokeWidth="2.5" fill="none" opacity="0.5" />
    </g>
  )
}

function BodyBase({ gender, uid }) {
  const isGirl   = gender === 'girl'
  const skinGid  = `skinGrad${uid}`
  const eyeGid   = `eyeGrad${uid}`
  const sf       = `url(#${skinGid})`
  const ef       = `url(#${eyeGid})`
  return (
    <g>
      <defs>
        <radialGradient id={skinGid} cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor={SKIN_LIGHT} />
          <stop offset="65%"  stopColor={SKIN_MID} />
          <stop offset="100%" stopColor={SKIN_DARK} />
        </radialGradient>
        <radialGradient id={eyeGid} cx="30%" cy="25%" r="75%">
          <stop offset="0%"   stopColor="#4a5568" />
          <stop offset="100%" stopColor="#1a202c" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="343" rx="48" ry="7" fill="#000000" opacity="0.13" />

      {/* Neck */}
      <rect x="87" y="158" width="26" height="24" rx="5" fill={sf} />

      {/* Head */}
      <ellipse data-char="head" cx="100" cy="108" rx="58" ry="63" fill={sf} />

      {/* Ears */}
      <ellipse cx="42" cy="112" rx="9" ry="12" fill={SKIN_MID} />
      <ellipse cx="158" cy="112" rx="9" ry="12" fill={SKIN_MID} />
      <ellipse cx="42" cy="114" rx="5" ry="7" fill={SKIN_DARK} opacity="0.3" />
      <ellipse cx="158" cy="114" rx="5" ry="7" fill={SKIN_DARK} opacity="0.3" />

      {/* Eye whites */}
      <ellipse cx="78" cy="103" rx="15" ry="16" fill="white" />
      <ellipse cx="122" cy="103" rx="15" ry="16" fill="white" />
      {/* Subtle top shadow on sclera */}
      <ellipse cx="78" cy="97" rx="14" ry="7" fill="#cbd5e1" opacity="0.4" />
      <ellipse cx="122" cy="97" rx="14" ry="7" fill="#cbd5e1" opacity="0.4" />

      {/* Iris */}
      <circle data-char="eye-l" cx="81" cy="106" r="10" fill={ef} />
      <circle data-char="eye-r" cx="119" cy="106" r="10" fill={ef} />
      {/* Pupil */}
      <circle cx="81" cy="106" r="5.5" fill="#0f172a" />
      <circle cx="119" cy="106" r="5.5" fill="#0f172a" />
      {/* Main highlight */}
      <circle cx="85" cy="101" r="4.5" fill="white" opacity="0.92" />
      <circle cx="123" cy="101" r="4.5" fill="white" opacity="0.92" />
      {/* Secondary micro-highlight */}
      <circle cx="78" cy="109" r="2" fill="white" opacity="0.5" />
      <circle cx="116" cy="109" r="2" fill="white" opacity="0.5" />

      {/* Eyebrows */}
      {isGirl ? (
        <>
          <path d="M 66 88 Q 78 83 88 87" stroke="#5d3a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 112 87 Q 122 83 134 88" stroke="#5d3a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <line x1="68"  y1="90" x2="66"  y2="86" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="73"  y1="87" x2="72"  y2="83" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="78"  y1="85" x2="78"  y2="81" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="83"  y1="86" x2="84"  y2="82" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="88"  y1="89" x2="90"  y2="85" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="112" y1="89" x2="110" y2="85" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="117" y1="87" x2="116" y2="83" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="122" y1="85" x2="122" y2="81" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="127" y1="86" x2="128" y2="82" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="132" y1="89" x2="134" y2="85" stroke="#1e293b" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M 66 88 Q 78 82 88 86" stroke="#3d2008" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 112 86 Q 122 82 134 88" stroke="#3d2008" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Nose */}
      <ellipse cx="96"  cy="122" rx="3"  ry="2.5" fill={SKIN_DARK} opacity="0.65" />
      <ellipse cx="104" cy="122" rx="3"  ry="2.5" fill={SKIN_DARK} opacity="0.65" />

      {/* Mouth */}
      <path d="M 83 135 Q 100 150 117 135" stroke="#c2705a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M 83 135 Q 100 147 117 135" fill="#e87455" opacity="0.22" />
      {/* Teeth hint */}
      <path d="M 87 137 Q 100 144 113 137" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45" />

      {/* Cheeks */}
      <ellipse cx="62"  cy="126" rx="13" ry="9" fill="#f9a8a8" opacity="0.38" />
      <ellipse cx="138" cy="126" rx="13" ry="9" fill="#f9a8a8" opacity="0.38" />

      {/* Arms */}
      <path data-char="arm-l" d="M 58 180 Q 38 207 36 244 L 54 246 Q 54 217 66 192" fill={sf} />
      <path data-char="arm-r" d="M 142 180 Q 162 207 164 244 L 146 246 Q 146 217 134 192" fill={sf} />

      {/* Hands — rounder, 3-knuckle cartoon style */}
      <ellipse cx="36"  cy="250" rx="14" ry="11" fill={SKIN_MID} />
      <ellipse cx="164" cy="250" rx="14" ry="11" fill={SKIN_MID} />
      <ellipse cx="27"  cy="246" rx="5.5" ry="4.5" fill={SKIN_MID} />
      <ellipse cx="36"  cy="242" rx="5.5" ry="4.5" fill={SKIN_MID} />
      <ellipse cx="45"  cy="246" rx="5.5" ry="4.5" fill={SKIN_MID} />
      <ellipse cx="155" cy="246" rx="5.5" ry="4.5" fill={SKIN_MID} />
      <ellipse cx="164" cy="242" rx="5.5" ry="4.5" fill={SKIN_MID} />
      <ellipse cx="173" cy="246" rx="5.5" ry="4.5" fill={SKIN_MID} />
    </g>
  )
}

function HairLayerBack({ skinId, gender, uid }) {
  const skin      = skinId ? getSkinById(skinId) : null
  const hairColor = skin?.primaryColor   || '#5d3a1a'
  const hairAcc   = skin?.secondaryColor || '#7b4f2e'
  const hairDark  = darken(hairColor, 0.2)
  const gid       = `hairGrad${uid}`
  const defs = (
    <defs>
      <linearGradient id={gid} x1="30%" y1="0%" x2="70%" y2="100%">
        <stop offset="0%"   stopColor={hairColor} />
        <stop offset="100%" stopColor={hairDark} />
      </linearGradient>
    </defs>
  )
  const f = `url(#${gid})`
  if (gender === 'girl') return (
    <g>
      {defs}
      <path d="M 42 108 Q 32 148 36 186 L 52 175 Q 48 150 54 124 Z" fill={f} />
      <path d="M 158 108 Q 168 148 164 186 L 148 175 Q 152 150 146 124 Z" fill={f} />
      <circle cx="44"  cy="170" r="15" fill={f} />
      <circle cx="156" cy="170" r="15" fill={f} />
      <circle cx="44"  cy="170" r="8" fill={hairAcc} opacity="0.55" />
      <circle cx="156" cy="170" r="8" fill={hairAcc} opacity="0.55" />
    </g>
  )
  return null
}

function HairLayerFront({ skinId, gender, uid }) {
  const skin      = skinId ? getSkinById(skinId) : null
  const hairColor = skin?.primaryColor   || '#5d3a1a'
  const hairAcc   = skin?.secondaryColor || '#7b4f2e'
  const gid       = `hairGrad${uid}`
  const clipId    = `hairTopClip${uid}`
  const f         = `url(#${gid})`
  if (gender === 'girl') return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="200" height="90" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx="100" cy="86" rx="60" ry="44" fill={f} />
        <ellipse cx="100" cy="63" rx="57" ry="20" fill={f} />
        <ellipse cx="85" cy="68" rx="18" ry="8" fill="white" opacity="0.1" transform="rotate(-15 85 68)" />
      </g>
    </g>
  )
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor={hairColor} />
          <stop offset="100%" stopColor={darken(hairColor, 0.2)} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="200" height="90" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <ellipse cx="100" cy="84" rx="58" ry="38" fill={f} />
        <ellipse cx="100" cy="62" rx="56" ry="18" fill={f} />
        <path d="M 58 80 Q 50 68 54 57 Q 64 52 70 63" fill={f} />
        <path d="M 142 80 Q 150 68 146 57 Q 136 52 130 63" fill={f} />
        <path d="M 86 60 Q 93 50 100 56" stroke={hairAcc} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
        <path d="M 100 56 Q 107 50 114 60" stroke={hairAcc} strokeWidth="2" fill="none" opacity="0.38" strokeLinecap="round" />
        <ellipse cx="90" cy="68" rx="20" ry="7" fill="white" opacity="0.09" transform="rotate(-10 90 68)" />
      </g>
    </g>
  )
}

function HatLayer({ skinId, uid }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1  = skin.primaryColor
  const c2  = skin.secondaryColor
  const c1d = darken(c1, 0.2)
  const v   = skin.shapeVariant
  const gid = `hatGrad${uid}`
  const defs = (
    <defs>
      <linearGradient id={gid} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%"   stopColor={c1} />
        <stop offset="100%" stopColor={c1d} />
      </linearGradient>
    </defs>
  )
  const f = `url(#${gid})`
  if (v === 1) return (
    <g>{defs}
      <rect x="68" y="56" width="64" height="32" rx="9" fill={f} />
      <rect x="53" y="83" width="94" height="11" rx="6" fill={c2} />
      <path d="M 78 56 Q 100 42 122 56" fill={f} />
      <ellipse cx="100" cy="62" rx="20" ry="6" fill="white" opacity="0.1" />
    </g>
  )
  if (v === 2) return (
    <g>{defs}
      <rect x="81" y="33" width="38" height="42" rx="5" fill={f} />
      <rect x="58" y="70" width="84" height="9" rx="5" fill={c2} />
      <text x="100" y="60" textAnchor="middle" fontSize="13" fill={c2}>✦</text>
      <rect x="81" y="33" width="38" height="8" rx="4" fill="white" opacity="0.1" />
    </g>
  )
  if (v === 3) return (
    <g>{defs}
      <ellipse cx="100" cy="66" rx="42" ry="16" fill={f} />
      <ellipse cx="100" cy="55" rx="27" ry="22" fill={f} />
      <ellipse cx="100" cy="50" rx="18" ry="8" fill="white" opacity="0.1" />
    </g>
  )
  if (v === 4) return (
    <g>{defs}
      <path d="M 68 76 L 78 46 Q 100 32 122 46 L 132 76 Z" fill={f} />
      <rect x="56" y="74" width="88" height="11" rx="6" fill={c2} />
      <circle cx="100" cy="39" r="6" fill={c2} />
      <ellipse cx="100" cy="54" rx="14" ry="5" fill="white" opacity="0.1" />
    </g>
  )
  return null
}

function GlassesLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v  = skin.shapeVariant
  if (v === 1) return (
    <g>
      <circle cx="79"  cy="105" r="15" fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <circle cx="121" cy="105" r="15" fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <line x1="94" y1="105" x2="106" y2="105" stroke={c1} strokeWidth="2.5" />
      <line x1="64" y1="103" x2="56" y2="100"  stroke={c1} strokeWidth="2.5" />
      <line x1="136" y1="103" x2="144" y2="100" stroke={c1} strokeWidth="2.5" />
    </g>
  )
  if (v === 2) return (
    <g>
      <path d="M 66 105 Q 79 90 92 105 Q 79 120 66 105 Z"   fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <path d="M 108 105 Q 121 90 134 105 Q 121 120 108 105 Z" fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <line x1="92" y1="105" x2="108" y2="105" stroke={c1} strokeWidth="2.5" />
    </g>
  )
  if (v === 3) return (
    <g>
      <path d="M 66 101 L 79 90 L 92 101 L 79 112 Z"    fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <path d="M 108 101 L 121 90 L 134 101 L 121 112 Z" fill={c2} opacity="0.18" stroke={c1} strokeWidth="3" />
      <line x1="92" y1="102" x2="108" y2="102" stroke={c1} strokeWidth="2.5" />
    </g>
  )
  return (
    <g>
      <rect x="64"  y="97" width="30" height="24" rx="6" fill={c2} opacity="0.22" stroke={c1} strokeWidth="2.5" />
      <rect x="106" y="97" width="30" height="24" rx="6" fill={c2} opacity="0.22" stroke={c1} strokeWidth="2.5" />
      <line x1="94" y1="109" x2="106" y2="109" stroke={c1} strokeWidth="2.5" />
    </g>
  )
}

function AccessoryLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin || skin.slot !== 'accessory') return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v  = skin.shapeVariant
  if (v === 1) return (
    <g transform="translate(130, 185)">
      <rect x="0" y="0" width="28" height="36" rx="5" fill={c1} />
      <rect x="3" y="3" width="22" height="22" rx="3" fill={c2} opacity="0.5" />
      <path d="M 6 -8 Q 14 -14 22 -8" stroke={c1} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
  if (v === 2) return (
    <g transform="translate(130, 185)">
      <rect x="0" y="0" width="28" height="36" rx="5" fill={c1} />
      <text x="14" y="22" textAnchor="middle" fontSize="16">⭐</text>
      <path d="M 6 -8 Q 14 -14 22 -8" stroke={c1} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
  if (v === 3) return (
    <g>
      <rect x="155" y="195" width="6" height="50" rx="3" fill={c2} />
      <circle cx="158" cy="192" r="8" fill={c1} />
      <text x="158" y="196" textAnchor="middle" fontSize="10">✦</text>
    </g>
  )
  if (v === 4) return (
    <g transform="translate(128, 185)">
      <rect x="0" y="5" width="22" height="28" rx="3" fill={c1} />
      <rect x="4" y="1" width="14" height="8"  rx="2" fill={c2} />
      <text x="11" y="22" textAnchor="middle" fontSize="12">📖</text>
    </g>
  )
  return null
}

export default function Character({ gender = 'boy', equippedSkins = {}, animationState = 'idle', size = 200 }) {
  const charRef      = useRef()
  const tweensRef    = useRef([])
  const blinkRef     = useRef(null)
  const uidRef       = useRef(null)
  if (uidRef.current === null) uidRef.current = String(++_counter)
  const uid   = uidRef.current
  const scale = size / 200

  useEffect(() => {
    if (!charRef.current) return
    const el = charRef.current

    tweensRef.current.forEach(t => t?.kill())
    tweensRef.current = []
    if (blinkRef.current) { blinkRef.current.kill(); blinkRef.current = null }

    const q    = sel => el.querySelector(sel)
    const head = q('[data-char="head"]')
    const eyeL = q('[data-char="eye-l"]')
    const eyeR = q('[data-char="eye-r"]')
    const torso = q('[data-char="torso"]')
    const push = (...ts) => tweensRef.current.push(...ts)

    function scheduleBlink() {
      blinkRef.current = gsap.delayedCall(3 + Math.random() * 2.5, () => {
        if (!eyeL || !eyeR) return scheduleBlink()
        const t = gsap.to([eyeL, eyeR], {
          scaleY: 0.08, transformOrigin: 'center center',
          duration: 0.06, yoyo: true, repeat: 1,
          onComplete: scheduleBlink,
        })
        push(t)
      })
    }

    function resetEl() {
      gsap.set(el, { x: 0, y: 0, scale: 1, rotation: 0 })
      gsap.set(el, { clearProps: 'filter' })
      if (head)           gsap.set(head, { clearProps: 'all' })
      if (eyeL && eyeR)   gsap.set([eyeL, eyeR], { clearProps: 'all' })
    }

    function launchIdle() {
      tweensRef.current.forEach(t => t?.kill())
      tweensRef.current = []
      if (blinkRef.current) { blinkRef.current.kill(); blinkRef.current = null }
      resetEl()
      push(gsap.to(el, { y: -6, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
      if (torso) push(gsap.to(torso, { scaleY: 1.03, transformOrigin: 'center center', duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1 }))
      scheduleBlink()
    }

    if (animationState === 'idle') {
      launchIdle()

    } else if (animationState === 'correctAnswer') {
      resetEl()
      const tl = gsap.timeline({ onComplete: launchIdle })
      tl.to(el, { y: -35, scale: 1.12, duration: 0.22, ease: 'power2.out' })
      if (head) tl.to(head, { rotation: 8, transformOrigin: 'center center', duration: 0.22, ease: 'power2.out' }, 0)
      tl.to(el, { y: 0, scale: 1, duration: 0.23, ease: 'power2.in' })
      if (head) {
        tl.to(head, { rotation: -5, duration: 0.1 })
        tl.to(head, { rotation: 0,  duration: 0.12 })
      }
      push(tl)

    } else if (animationState === 'wrongAnswer') {
      resetEl()
      const tl = gsap.timeline({ onComplete: launchIdle })
      if (eyeL && eyeR) tl.to([eyeL, eyeR], { scaleY: 0.2, transformOrigin: 'center center', duration: 0.05 }, 0)
      tl.to(el, { x: -12, duration: 0.055, ease: 'none' })
      tl.to(el, { x:  12, duration: 0.055, ease: 'none' })
      tl.to(el, { x:  -8, duration: 0.055, ease: 'none' })
      tl.to(el, { x:   8, duration: 0.055, ease: 'none' })
      tl.to(el, { x:  -4, duration: 0.055, ease: 'none' })
      tl.to(el, { x:   4, duration: 0.055, ease: 'none' })
      tl.to(el, { x:   0, duration: 0.055, ease: 'none' })
      if (eyeL && eyeR) tl.to([eyeL, eyeR], { scaleY: 1, transformOrigin: 'center center', duration: 0.1 })
      push(tl)

    } else if (animationState === 'newSkin') {
      resetEl()
      const tl = gsap.timeline({ onComplete: launchIdle })
      tl.to(el, { rotation: 180, scale: 1.18, duration: 0.25, ease: 'power1.in',  filter: 'drop-shadow(0 0 18px #f59e0b)' })
      tl.to(el, { rotation: 360, scale: 1,    duration: 0.25, ease: 'power1.out', filter: 'drop-shadow(0 0 8px #f59e0b)' })
      tl.set(el, { rotation: 0 })
      push(tl)

    } else if (animationState === 'sad') {
      resetEl()
      const tl = gsap.timeline({ onComplete: launchIdle })
      if (head) tl.to(head, { y: 8, transformOrigin: 'center center', duration: 0.15, ease: 'power2.out' }, 0)
      tl.to(el, { rotation: -3, duration: 0.2, ease: 'sine.inOut' })
      tl.to(el, { rotation:  3, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 5 })
      tl.to(el, { rotation:  0, duration: 0.2 })
      if (head) tl.to(head, { y: 0, duration: 0.2 }, '-=0.2')
      push(tl)

    } else {
      launchIdle()
    }

    return () => {
      tweensRef.current.forEach(t => t?.kill())
      if (blinkRef.current) blinkRef.current.kill()
    }
  }, [animationState])

  return (
    <div ref={charRef} style={{ display: 'inline-block' }}>
      <svg
        viewBox="0 0 200 350"
        width={200 * scale}
        height={350 * scale}
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <WingsLayer skinId={equippedSkins.wings} />
        <ShoesLayer skinId={equippedSkins.shoes} uid={uid} />
        <BottomLayer skinId={equippedSkins.bottom} gender={gender} uid={uid} />
        <TopLayer skinId={equippedSkins.top} gender={gender} uid={uid} />
        <HairLayerBack skinId={equippedSkins.hair} gender={gender} uid={uid} />
        <BodyBase gender={gender} uid={uid} />
        <HairLayerFront skinId={equippedSkins.hair} gender={gender} uid={uid} />
        <HatLayer skinId={equippedSkins.hat} uid={uid} />
        <GlassesLayer skinId={equippedSkins.glasses} />
        <AccessoryLayer skinId={equippedSkins.accessory} />
      </svg>
    </div>
  )
}
