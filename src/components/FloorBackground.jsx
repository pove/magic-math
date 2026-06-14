import { useState, useEffect, useRef } from 'react'
import { getLevelData } from '../data/levels'

function FloatingEmoji({ emoji, index }) {
  const delay = index * 0.7
  const duration = 3 + index * 0.5
  const left = 5 + index * 28
  const style = {
    position: 'absolute',
    left: `${left % 90}%`,
    top: `${10 + (index * 17) % 70}%`,
    fontSize: '2rem',
    animation: `floatEmoji ${duration}s ${delay}s ease-in-out infinite`,
    opacity: 0.25,
    pointerEvents: 'none',
    userSelect: 'none',
  }
  return <span style={style}>{emoji}</span>
}

export default function FloorBackground({ floor, children }) {
  const [imgFailed, setImgFailed] = useState(false)
  const level = getLevelData(floor)
  const nn = String(floor).padStart(2, '0')

  return (
    <div className="relative w-full h-full overflow-hidden">
      <style>{`
        @keyframes floatEmoji {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(8deg); }
        }
      `}</style>

      {!imgFailed ? (
        <img
          src={`/backgrounds/floor-${nn}.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient}`} />
      )}

      <div className="absolute inset-0 bg-black/40" />

      {imgFailed && level.decorations.map((emoji, i) => (
        <FloatingEmoji key={i} emoji={emoji} index={i} />
      ))}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
