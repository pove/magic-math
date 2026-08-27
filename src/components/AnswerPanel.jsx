import { useState } from 'react'
import { motion } from 'framer-motion'
import { sfx } from '../engine/sfx'

function OptionButton({ value, onClick, disabled, ageMode, index = 0 }) {
  const isYoung = ageMode === 'young'
  return (
    <motion.button
      onClick={() => { sfx.click(); onClick(value) }}
      disabled={disabled}
      className="relative min-h-[64px] short:min-h-[44px] bg-gradient-to-b from-white/25 to-white/10 hover:from-amber-300/30 hover:to-white/15 backdrop-blur-md rounded-2xl border-2 border-white/30 hover:border-amber-400 font-title text-white shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-hidden"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={disabled ? {} : { scale: 1.06, rotate: [-0.5, 0.5, 0] }}
      whileTap={disabled ? {} : { scale: 0.92 }}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <span
        className={isYoung ? 'text-xl sm:text-2xl short:text-lg py-4 short:py-2 px-3 sm:px-4 inline-block uppercase' : 'text-lg sm:text-xl short:text-base py-3 short:py-2 px-3 sm:px-4 inline-block'}
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
      >
        {isYoung ? String(value).toUpperCase() : value}
      </span>
    </motion.button>
  )
}

function VirtualKeyboard({ onAnswer, ageMode }) {
  const [input, setInput] = useState('')
  const isYoung = ageMode === 'young'

  const handleKey = (k) => {
    sfx.click()
    if (k === '⌫') { setInput((p) => p.slice(0, -1)); return }
    if (k === '✓') { if (input !== '') { onAnswer(Number(input)); setInput('') }; return }
    if (input.length < 5) setInput((p) => p + k)
  }

  // 4 columns × 3 rows (instead of 3×4) trades a bit of button width for one
  // fewer row — the row axis is what runs out on a phone in landscape, and
  // trimming it there keeps the keyboard from being cut off on short screens.
  const keys = ['7','8','9','⌫','4','5','6','✓','1','2','3','0']

  return (
    <div className="flex flex-col items-center gap-2 short:gap-1.5 w-full">
      <div
        className="bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-md rounded-2xl border-2 border-white/30 px-6 py-3 short:py-1.5 font-title text-white text-3xl short:text-2xl min-w-[120px] text-center min-h-[56px] short:min-h-[40px]"
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
      >
        {input || <span className="opacity-40">?</span>}
      </div>
      {/* Portrait has vertical room to spare, so the keys get fatter targets;
          landscape on a phone does not, so they stay compact there. */}
      <div className="grid grid-cols-4 gap-2 short:gap-1.5 w-full max-w-[280px] portrait:max-w-[320px]">
        {keys.map((k) => (
          <motion.button
            key={k}
            onClick={() => handleKey(k)}
            className={`rounded-xl border-2 backdrop-blur-md font-title text-white shadow-lg shadow-purple-900/40 transition-colors min-h-[48px] short:min-h-[36px] portrait:min-h-[58px] text-xl short:text-base
              ${k === '✓' ? 'bg-emerald-600 border-emerald-400 hover:bg-emerald-500' :
                k === '⌫' ? 'bg-red-700/60 border-red-400/50 hover:bg-red-600/80' :
                'bg-gradient-to-b from-white/30 to-white/15 border-white/30 hover:from-amber-300/30 hover:to-white/20 hover:border-amber-400'}`}
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            {isYoung && k !== '⌫' && k !== '✓' ? k : k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function AnswerPanel({ interfaceType, options = [], onAnswer, disabled = false, ageMode = 'young' }) {
  if (interfaceType === 'keyboard') {
    return (
      <div className="flex justify-center">
        <VirtualKeyboard onAnswer={onAnswer} ageMode={ageMode} />
      </div>
    )
  }

  // Six options across three columns leaves ~110px per button on a phone in
  // portrait, which is below a comfortable tap target — drop to two columns
  // there and let the extra row use the vertical room portrait actually has.
  const cols = interfaceType === '6_options' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'

  return (
    <div className={`grid ${cols} gap-2 sm:gap-3`}>
      {options.map((opt, i) => (
        <OptionButton
          key={`${opt}-${i}`}
          value={opt}
          onClick={onAnswer}
          disabled={disabled}
          ageMode={ageMode}
          index={i}
        />
      ))}
    </div>
  )
}
