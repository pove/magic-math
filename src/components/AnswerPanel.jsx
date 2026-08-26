import { useState } from 'react'
import { motion } from 'framer-motion'
import { sfx } from '../engine/sfx'

function OptionButton({ value, onClick, disabled, ageMode, index = 0 }) {
  const isYoung = ageMode === 'young'
  return (
    <motion.button
      onClick={() => { sfx.click(); onClick(value) }}
      disabled={disabled}
      className="relative bg-gradient-to-b from-white/25 to-white/10 hover:from-amber-300/30 hover:to-white/15 backdrop-blur-md rounded-2xl border-2 border-white/30 hover:border-amber-400 font-title text-white shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-hidden"
      style={{ minHeight: '64px' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={disabled ? {} : { scale: 1.06, rotate: [-0.5, 0.5, 0] }}
      whileTap={disabled ? {} : { scale: 0.92 }}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <span
        className={isYoung ? 'text-2xl py-4 px-4 inline-block uppercase' : 'text-xl py-3 px-4 inline-block'}
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

  const keys = ['7','8','9','4','5','6','1','2','3','0','⌫','✓']

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="bg-white/20 rounded-2xl border-2 border-white/30 px-6 py-3 font-title text-white text-3xl min-w-[120px] text-center min-h-[56px]">
        {input || <span className="opacity-40">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
        {keys.map((k) => (
          <motion.button
            key={k}
            onClick={() => handleKey(k)}
            className={`rounded-xl border-2 font-title text-white transition-colors min-h-[48px] text-xl
              ${k === '✓' ? 'bg-emerald-600 border-emerald-400 hover:bg-emerald-500' :
                k === '⌫' ? 'bg-red-700/60 border-red-400/50 hover:bg-red-600/80' :
                'bg-white/20 border-white/30 hover:bg-white/40 hover:border-amber-400'}`}
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

  const cols = interfaceType === '6_options' ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className={`grid ${cols} gap-3`}>
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
