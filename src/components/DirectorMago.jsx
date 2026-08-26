import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Animated wizard director — blinking eyes, talking mouth, glowing staff orb.
 * states: 'idle' | 'applaud' | 'sad'; extra prop `talking` animates the mouth.
 */
export default function DirectorMago({ animationState = 'idle', size = 180, talking = false }) {
  const scale = size / 180
  const [blink, setBlink] = useState(false)
  const [talkOpen, setTalkOpen] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 2800 + Math.random() * 2000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!talking) { setTalkOpen(false); return }
    const iv = setInterval(() => setTalkOpen((o) => !o), 220)
    return () => clearInterval(iv)
  }, [talking])

  const anim =
    animationState === 'applaud'
      ? { x: [0, -8, 8, -8, 8, 0], rotate: [0, -3, 3, -3, 3, 0], transition: { duration: 0.9, repeat: Infinity } }
      : animationState === 'sad'
      ? { y: [4, 8, 4], rotate: [-2, 2, -2], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }
      : { y: [0, -7, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }

  const eyeH = blink ? 1.5 : 11
  const mouthPath = talkOpen
    ? 'M 74 132 Q 90 148 106 132 Q 90 140 74 132 Z'
    : 'M 76 133 Q 90 141 104 133'

  return (
    <motion.div animate={anim} style={{ display: 'inline-block', filter: 'drop-shadow(0 10px 20px rgba(124,58,237,0.45))' }}>
      <svg viewBox="0 0 180 320" width={180 * scale} height={320 * scale} xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <defs>
          <radialGradient id="dm-orb" cx="0.35" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="60%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
          <linearGradient id="dm-cape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
        </defs>
        {/* Cape */}
        <path d="M 50 165 Q 30 220 28 300 L 152 300 Q 150 220 130 165 Z" fill="url(#dm-cape)" />
        <path d="M 50 165 Q 35 210 33 280 L 60 280 Q 55 220 65 175 Z" fill="#7c3aed" opacity="0.6" />
        <path d="M 130 165 Q 145 210 147 280 L 120 280 Q 125 220 115 175 Z" fill="#7c3aed" opacity="0.6" />
        {/* Stars on cape */}
        <text x="70" y="220" fontSize="14" fill="#f59e0b">✦</text>
        <text x="100" y="250" fontSize="12" fill="#fde68a">✦</text>
        <text x="60" y="265" fontSize="10" fill="#f59e0b">✦</text>
        <text x="115" y="230" fontSize="10" fill="#fde68a">✦</text>
        {/* Body */}
        <rect x="55" y="165" width="70" height="70" rx="8" fill="#6d28d9" />
        <rect x="55" y="165" width="70" height="12" rx="6" fill="#fbbf24" opacity="0.85" />
        {/* Neck */}
        <rect x="78" y="148" width="24" height="22" rx="4" fill="#f4d4a0" />
        {/* Head */}
        <ellipse cx="90" cy="110" rx="48" ry="52" fill="#f4d4a0" />
        {/* Beard */}
        <path d="M 48 130 Q 60 170 90 175 Q 120 170 132 130 Q 115 155 90 158 Q 65 155 48 130 Z" fill="#e5e7eb" />
        <path d="M 65 150 L 62 170 Q 70 175 80 172 Z" fill="#e5e7eb" />
        <path d="M 115 150 L 118 170 Q 110 175 100 172 Z" fill="#e5e7eb" />
        <path d="M 80 165 Q 90 178 100 165" stroke="#d1d5db" strokeWidth="2" fill="none" />
        {/* Mustache */}
        <path d="M 72 130 Q 85 125 90 128 Q 95 125 108 130" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
        {/* Mouth (talks!) */}
        <path d={mouthPath} stroke="#7c2d12" strokeWidth="2.5" fill={talkOpen ? '#7c2d12' : 'none'} />
        {/* Eyes (blink) */}
        <ellipse cx="74" cy="108" rx="10" ry={eyeH} fill="white" />
        <ellipse cx="106" cy="108" rx="10" ry={eyeH} fill="white" />
        {!blink && (
          <>
            <circle cx="77" cy="110" r="6" fill="#1e293b" />
            <circle cx="109" cy="110" r="6" fill="#1e293b" />
            <circle cx="79" cy="108" r="2.5" fill="white" />
            <circle cx="111" cy="108" r="2.5" fill="white" />
          </>
        )}
        {/* Eyebrows — expressive */}
        <path
          d={animationState === 'sad' ? 'M 64 96 Q 72 102 80 98' : 'M 64 98 Q 72 92 80 96'}
          stroke="#9ca3af" strokeWidth="3" fill="none" strokeLinecap="round"
        />
        <path
          d={animationState === 'sad' ? 'M 100 98 Q 108 102 116 96' : 'M 100 96 Q 108 92 116 98'}
          stroke="#9ca3af" strokeWidth="3" fill="none" strokeLinecap="round"
        />
        {/* Wrinkles */}
        <path d="M 62 100 Q 70 95 76 100" stroke="#c4a882" strokeWidth="1.5" fill="none" />
        <path d="M 104 100 Q 110 95 118 100" stroke="#c4a882" strokeWidth="1.5" fill="none" />
        <path d="M 58 115 Q 64 120 62 126" stroke="#c4a882" strokeWidth="1" fill="none" />
        <path d="M 122 115 Q 116 120 118 126" stroke="#c4a882" strokeWidth="1" fill="none" />
        {/* Nose */}
        <ellipse cx="90" cy="122" rx="9" ry="7" fill="#e8b88a" />
        {/* Hat */}
        <rect x="50" y="64" width="80" height="8" rx="4" fill="#4c1d95" />
        <rect x="64" y="24" width="52" height="42" rx="6" fill="#4c1d95" />
        <path d="M 64 26 L 73 8 Q 90 0 107 8 L 116 26" fill="#4c1d95" />
        <rect x="50" y="62" width="80" height="6" rx="3" fill="#fbbf24" />
        <text x="90" y="48" textAnchor="middle" fontSize="10" fill="#f59e0b">✦</text>
        <text x="78" y="35" textAnchor="middle" fontSize="8" fill="#fde68a">✦</text>
        <text x="102" y="35" textAnchor="middle" fontSize="8" fill="#fde68a">✦</text>
        {/* Left arm (waves on applaud) */}
        <motion.g
          animate={
            animationState === 'applaud'
              ? { rotate: [-15, 15, -15] }
              : animationState === 'sad'
              ? { rotate: [0, 4, 0] }
              : { rotate: [0, -4, 0] }
          }
          transition={{ duration: animationState === 'applaud' ? 0.45 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '55px', originY: '175px' }}
        >
          <path d="M 55 175 Q 30 200 28 240 L 44 242 Q 44 210 55 195" fill="#6d28d9" />
          <ellipse cx="28" cy="246" rx="12" ry="9" fill="#f4d4a0" />
        </motion.g>
        {/* Staff */}
        <rect x="149" y="180" width="6" height="122" rx="3" fill="#78350f" />
        <circle cx="152" cy="176" r="18" fill="#fbbf24" opacity="0.25">
          <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="152" cy="176" r="12" fill="url(#dm-orb)" />
        <text x="152" y="181" textAnchor="middle" fontSize="11">⭐</text>
      </svg>
    </motion.div>
  )
}
