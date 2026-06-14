import { motion } from 'framer-motion'
import { getSkinById } from '../data/skins'

const SKIN_TONE = '#f9c584'
const SKIN_DARK = '#e8a96b'

function ShoesLayer({ skinId, gender }) {
  const skin = skinId ? getSkinById(skinId) : null
  const c1 = skin?.primaryColor || '#ffffff'
  const c2 = skin?.secondaryColor || '#94a3b8'
  const v = skin?.shapeVariant || 1
  if (v === 2) return (
    <g>
      <ellipse cx="72" cy="322" rx="22" ry="10" fill={c1} />
      <ellipse cx="128" cy="322" rx="22" ry="10" fill={c1} />
      <rect x="55" y="305" width="34" height="18" rx="6" fill={c2} />
      <rect x="111" y="305" width="34" height="18" rx="6" fill={c2} />
    </g>
  )
  if (v === 3) return (
    <g>
      <ellipse cx="72" cy="322" rx="22" ry="10" fill={c1} />
      <ellipse cx="128" cy="322" rx="22" ry="10" fill={c1} />
      <rect x="55" y="302" width="34" height="22" rx="4" fill={c2} />
      <rect x="111" y="302" width="34" height="22" rx="4" fill={c2} />
    </g>
  )
  if (v === 4) return (
    <g>
      <ellipse cx="72" cy="322" rx="24" ry="11" fill={c1} />
      <ellipse cx="128" cy="322" rx="24" ry="11" fill={c1} />
      <rect x="54" y="306" width="36" height="17" rx="8" fill={c2} />
      <rect x="110" y="306" width="36" height="17" rx="8" fill={c2} />
      <circle cx="72" cy="310" r="3" fill={c1} opacity="0.6" />
      <circle cx="128" cy="310" r="3" fill={c1} opacity="0.6" />
    </g>
  )
  return (
    <g>
      <ellipse cx="72" cy="322" rx="22" ry="10" fill={c1} />
      <ellipse cx="128" cy="322" rx="22" ry="10" fill={c1} />
      <rect x="55" y="308" width="34" height="16" rx="8" fill={c2} />
      <rect x="111" y="308" width="34" height="16" rx="8" fill={c2} />
    </g>
  )
}

function BottomLayer({ skinId, gender }) {
  const skin = skinId ? getSkinById(skinId) : null
  const c1 = skin?.primaryColor || (gender === 'girl' ? '#4b5563' : '#1e40af')
  const c2 = skin?.secondaryColor || '#93c5fd'
  const isSkirt = gender === 'girl' && (!skin || skin.shapeVariant <= 2)
  if (isSkirt) return (
    <g>
      <path d="M 68 230 L 58 320 L 92 320 L 100 270 L 108 320 L 142 320 L 132 230 Z" fill={c1} />
      <path d="M 65 240 Q 100 255 135 240 L 132 230 L 68 230 Z" fill={c2} opacity="0.5" />
    </g>
  )
  return (
    <g>
      <rect x="67" y="228" width="66" height="92" rx="5" fill={c1} />
      <rect x="67" y="228" width="30" height="92" rx="5" fill={c1} />
      <rect x="103" y="228" width="30" height="92" rx="5" fill={c1} />
      <line x1="100" y1="228" x2="100" y2="320" stroke={c2} strokeWidth="2" opacity="0.4" />
    </g>
  )
}

function TopLayer({ skinId, gender }) {
  const skin = skinId ? getSkinById(skinId) : null
  const c1 = skin?.primaryColor || (gender === 'boy' ? '#1d4ed8' : '#ec4899')
  const c2 = skin?.secondaryColor || '#93c5fd'
  const v = skin?.shapeVariant || 1
  if (v === 2) return (
    <g>
      <path d="M 60 175 Q 50 180 48 230 L 152 230 Q 150 180 140 175 L 120 165 L 80 165 Z" fill={c1} />
      <path d="M 80 165 Q 100 175 120 165" stroke={c2} strokeWidth="3" fill="none" />
      <rect x="48" y="195" width="18" height="35" rx="6" fill={c1} />
      <rect x="134" y="195" width="18" height="35" rx="6" fill={c1} />
    </g>
  )
  if (v === 3) return (
    <g>
      <path d="M 60 175 Q 50 180 48 230 L 152 230 Q 150 180 140 175 L 120 165 L 80 165 Z" fill="#ffffff" />
      <path d="M 65 175 Q 55 180 53 230 L 147 230 Q 145 180 135 175 L 115 168 L 85 168 Z" fill={c1} opacity="0.3" />
      <rect x="48" y="195" width="18" height="35" rx="6" fill="#ffffff" />
      <rect x="134" y="195" width="18" height="35" rx="6" fill="#ffffff" />
      <circle cx="100" cy="195" r="4" fill={c2} />
      <circle cx="100" cy="210" r="4" fill={c2} />
    </g>
  )
  if (v === 4) return (
    <g>
      <path d="M 60 175 Q 50 180 48 230 L 152 230 Q 150 180 140 175 L 120 165 L 80 165 Z" fill={c1} />
      <path d="M 80 165 L 100 230 L 120 165" fill={c2} opacity="0.5" />
      <rect x="48" y="195" width="18" height="35" rx="6" fill={c1} />
      <rect x="134" y="195" width="18" height="35" rx="6" fill={c1} />
      <text x="100" y="205" textAnchor="middle" fontSize="14" fill={c2}>✦</text>
    </g>
  )
  return (
    <g>
      <path d="M 60 175 Q 50 180 48 230 L 152 230 Q 150 180 140 175 L 120 165 L 80 165 Z" fill={c1} />
      <rect x="48" y="195" width="18" height="35" rx="6" fill={c1} />
      <rect x="134" y="195" width="18" height="35" rx="6" fill={c1} />
      <path d="M 82 165 Q 100 172 118 165" stroke={c2} strokeWidth="2" fill="none" opacity="0.6" />
    </g>
  )
}

function WingsLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v = skin.shapeVariant
  if (v === 1) return (
    <g opacity="0.85">
      <ellipse cx="38" cy="190" rx="28" ry="45" fill={c1} transform="rotate(-20 38 190)" />
      <ellipse cx="162" cy="190" rx="28" ry="45" fill={c1} transform="rotate(20 162 190)" />
      <ellipse cx="38" cy="190" rx="16" ry="30" fill={c2} opacity="0.5" transform="rotate(-20 38 190)" />
      <ellipse cx="162" cy="190" rx="16" ry="30" fill={c2} opacity="0.5" transform="rotate(20 162 190)" />
    </g>
  )
  if (v === 2) return (
    <g opacity="0.9">
      <path d="M 60 185 Q 20 150 15 200 Q 10 250 55 220 Z" fill={c1} />
      <path d="M 140 185 Q 180 150 185 200 Q 190 250 145 220 Z" fill={c1} />
    </g>
  )
  if (v === 3) return (
    <g opacity="0.85">
      <ellipse cx="35" cy="185" rx="30" ry="50" fill={c1} transform="rotate(-25 35 185)" />
      <ellipse cx="165" cy="185" rx="30" ry="50" fill={c1} transform="rotate(25 165 185)" />
      <ellipse cx="35" cy="200" rx="20" ry="30" fill={c2} transform="rotate(-15 35 200)" />
      <ellipse cx="165" cy="200" rx="20" ry="30" fill={c2} transform="rotate(15 165 200)" />
    </g>
  )
  return (
    <g opacity="0.9">
      <ellipse cx="38" cy="188" rx="28" ry="42" fill={c1} transform="rotate(-18 38 188)" />
      <ellipse cx="162" cy="188" rx="28" ry="42" fill={c1} transform="rotate(18 162 188)" />
      <path d="M 38 165 L 55 190 L 38 215 Z" fill={c2} opacity="0.6" />
      <path d="M 162 165 L 145 190 L 162 215 Z" fill={c2} opacity="0.6" />
    </g>
  )
}

function BodyBase({ gender }) {
  const isGirl = gender === 'girl'
  return (
    <g>
      {/* Neck */}
      <rect x="88" y="155" width="24" height="20" rx="4" fill={SKIN_TONE} />
      {/* Head */}
      <ellipse cx="100" cy="115" rx="52" ry="55" fill={SKIN_TONE} />
      {/* Eyes */}
      <ellipse cx="80" cy="108" rx="12" ry="13" fill="white" />
      <ellipse cx="120" cy="108" rx="12" ry="13" fill="white" />
      <circle cx="83" cy="110" r="7" fill="#1e293b" />
      <circle cx="123" cy="110" r="7" fill="#1e293b" />
      <circle cx="85" cy="107" r="3" fill="white" />
      <circle cx="125" cy="107" r="3" fill="white" />
      {/* Eyebrows */}
      {isGirl ? (
        <>
          <path d="M 68 95 Q 80 90 88 94" stroke="#5d3a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 112 94 Q 120 90 132 95" stroke="#5d3a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Lashes */}
          <line x1="70" y1="97" x2="68" y2="93" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="75" y1="94" x2="74" y2="90" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="80" y1="92" x2="80" y2="88" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="85" y1="93" x2="86" y2="89" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="90" y1="97" x2="92" y2="93" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="110" y1="97" x2="108" y2="93" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="115" y1="94" x2="114" y2="90" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="120" y1="92" x2="120" y2="88" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="125" y1="93" x2="126" y2="89" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="130" y1="97" x2="132" y2="93" stroke="#1e293b" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M 68 95 Q 80 89 88 93" stroke="#3d2008" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 112 93 Q 120 89 132 95" stroke="#3d2008" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* Nose */}
      <circle cx="95" cy="125" r="2.5" fill={SKIN_DARK} />
      <circle cx="105" cy="125" r="2.5" fill={SKIN_DARK} />
      {/* Mouth */}
      <path d="M 82 138 Q 100 150 118 138" stroke="#c2705a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 82 138 Q 100 148 118 138" fill="#e87455" opacity="0.3" />
      {/* Cheeks */}
      <ellipse cx="66" cy="130" rx="10" ry="7" fill="#f9a8a8" opacity="0.45" />
      <ellipse cx="134" cy="130" rx="10" ry="7" fill="#f9a8a8" opacity="0.45" />
      {/* Ears */}
      <ellipse cx="48" cy="115" rx="8" ry="10" fill={SKIN_TONE} />
      <ellipse cx="152" cy="115" rx="8" ry="10" fill={SKIN_TONE} />
      {/* Arms */}
      <path d="M 60 175 Q 40 200 38 240 L 55 242 Q 55 210 68 190" fill={SKIN_TONE} />
      <path d="M 140 175 Q 160 200 162 240 L 145 242 Q 145 210 132 190" fill={SKIN_TONE} />
      {/* Hands (3 fingers cartoon) */}
      <ellipse cx="38" cy="246" rx="12" ry="9" fill={SKIN_TONE} />
      <ellipse cx="162" cy="246" rx="12" ry="9" fill={SKIN_TONE} />
      <line x1="30" y1="240" x2="28" y2="232" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="237" x2="37" y2="229" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="240" x2="47" y2="232" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
      <line x1="154" y1="240" x2="153" y2="232" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
      <line x1="162" y1="237" x2="163" y2="229" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
      <line x1="170" y1="240" x2="172" y2="232" stroke={SKIN_DARK} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function HairLayer({ skinId, gender }) {
  const skin = skinId ? getSkinById(skinId) : null
  const hairColor = skin?.primaryColor || '#5d3a1a'
  const hairAcc = skin?.secondaryColor || '#7b4f2e'
  if (gender === 'girl') return (
    <g>
      <ellipse cx="100" cy="90" rx="54" ry="42" fill={hairColor} />
      <path d="M 48 105 Q 38 140 42 180 L 56 170 Q 52 145 58 120 Z" fill={hairColor} />
      <path d="M 152 105 Q 162 140 158 180 L 144 170 Q 148 145 142 120 Z" fill={hairColor} />
      <ellipse cx="100" cy="67" rx="52" ry="18" fill={hairColor} />
      <circle cx="50" cy="165" r="12" fill={hairColor} />
      <circle cx="150" cy="165" r="12" fill={hairColor} />
      <circle cx="50" cy="165" r="6" fill={hairAcc} opacity="0.7" />
      <circle cx="150" cy="165" r="6" fill={hairAcc} opacity="0.7" />
    </g>
  )
  return (
    <g>
      <ellipse cx="100" cy="88" rx="53" ry="38" fill={hairColor} />
      <ellipse cx="100" cy="65" rx="51" ry="16" fill={hairColor} />
      <path d="M 60 80 Q 52 70 55 60 Q 65 55 70 65" fill={hairColor} />
      <path d="M 140 80 Q 148 70 145 60 Q 135 55 130 65" fill={hairColor} />
      <path d="M 88 60 Q 95 52 102 58" stroke={hairAcc} strokeWidth="2" fill="none" opacity="0.6" />
    </g>
  )
}

function HatLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v = skin.shapeVariant
  if (v === 1) return (
    <g>
      <rect x="70" y="58" width="60" height="30" rx="8" fill={c1} />
      <rect x="55" y="84" width="90" height="10" rx="5" fill={c2} />
      <path d="M 80 58 Q 100 45 120 58" fill={c1} />
    </g>
  )
  if (v === 2) return (
    <g>
      <rect x="82" y="35" width="36" height="40" rx="4" fill={c1} />
      <rect x="60" y="70" width="80" height="8" rx="4" fill={c2} />
      <text x="100" y="62" textAnchor="middle" fontSize="12" fill={c2}>✦</text>
    </g>
  )
  if (v === 3) return (
    <g>
      <ellipse cx="100" cy="68" rx="40" ry="15" fill={c1} />
      <ellipse cx="100" cy="58" rx="25" ry="20" fill={c1} />
    </g>
  )
  if (v === 4) return (
    <g>
      <path d="M 70 78 L 80 48 Q 100 35 120 48 L 130 78 Z" fill={c1} />
      <rect x="58" y="76" width="84" height="10" rx="5" fill={c2} />
      <circle cx="100" cy="42" r="5" fill={c2} />
    </g>
  )
  return null
}

function GlassesLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v = skin.shapeVariant
  if (v === 1) return (
    <g>
      <circle cx="80" cy="110" r="14" fill="none" stroke={c1} strokeWidth="3" />
      <circle cx="120" cy="110" r="14" fill="none" stroke={c1} strokeWidth="3" />
      <line x1="94" y1="110" x2="106" y2="110" stroke={c1} strokeWidth="2" />
      <line x1="66" y1="108" x2="58" y2="105" stroke={c1} strokeWidth="2" />
      <line x1="134" y1="108" x2="142" y2="105" stroke={c1} strokeWidth="2" />
    </g>
  )
  if (v === 2) return (
    <g>
      <path d="M 68 110 Q 80 96 92 110 Q 80 124 68 110 Z" fill="none" stroke={c1} strokeWidth="3" />
      <path d="M 108 110 Q 120 96 132 110 Q 120 124 108 110 Z" fill="none" stroke={c1} strokeWidth="3" />
      <line x1="92" y1="110" x2="108" y2="110" stroke={c1} strokeWidth="2" />
    </g>
  )
  if (v === 3) return (
    <g>
      <path d="M 68 106 L 80 96 L 92 106 L 80 116 Z" fill="none" stroke={c1} strokeWidth="3" />
      <path d="M 108 106 L 120 96 L 132 106 L 120 116 Z" fill="none" stroke={c1} strokeWidth="3" />
      <line x1="92" y1="107" x2="108" y2="107" stroke={c1} strokeWidth="2" />
    </g>
  )
  return (
    <g>
      <rect x="66" y="99" width="28" height="22" rx="5" fill={c2} opacity="0.3" stroke={c1} strokeWidth="2.5" />
      <rect x="106" y="99" width="28" height="22" rx="5" fill={c2} opacity="0.3" stroke={c1} strokeWidth="2.5" />
      <line x1="94" y1="110" x2="106" y2="110" stroke={c1} strokeWidth="2" />
    </g>
  )
}

function AccessoryLayer({ skinId }) {
  const skin = skinId ? getSkinById(skinId) : null
  if (!skin) return null
  const c1 = skin.primaryColor
  const c2 = skin.secondaryColor
  const v = skin.shapeVariant
  if (skin.slot === 'accessory') {
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
        <rect x="4" y="1" width="14" height="8" rx="2" fill={c2} />
        <text x="11" y="22" textAnchor="middle" fontSize="12">📖</text>
      </g>
    )
  }
  return null
}

const ANIMATIONS = {
  idle: { y: [0, -8, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  correctAnswer: { y: [0, -30, 0], scale: [1, 1.1, 1], transition: { duration: 0.5 } },
  wrongAnswer: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } },
  newSkin: { scale: [1, 1.15, 1], transition: { duration: 0.6 } },
  sad: { rotate: [-2, 2, -2], transition: { duration: 0.5, repeat: 3 } },
}

export default function Character({ gender = 'boy', equippedSkins = {}, animationState = 'idle', size = 200 }) {
  const anim = ANIMATIONS[animationState] || ANIMATIONS.idle
  const scale = size / 200

  return (
    <motion.div
      animate={anim}
      style={{ display: 'inline-block', filter: animationState === 'newSkin' ? 'drop-shadow(0 0 12px #f59e0b)' : 'none' }}
    >
      <svg
        viewBox="0 0 200 350"
        width={200 * scale}
        height={350 * scale}
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <WingsLayer skinId={equippedSkins.wings} />
        <ShoesLayer skinId={equippedSkins.shoes} gender={gender} />
        <BottomLayer skinId={equippedSkins.bottom} gender={gender} />
        <TopLayer skinId={equippedSkins.top} gender={gender} />
        <BodyBase gender={gender} />
        <HairLayer skinId={equippedSkins.hair} gender={gender} />
        <HatLayer skinId={equippedSkins.hat} />
        <GlassesLayer skinId={equippedSkins.glasses} />
        <AccessoryLayer skinId={equippedSkins.accessory} />
      </svg>
    </motion.div>
  )
}
