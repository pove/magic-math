import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import Character from '../components/Character'

export default function CharacterCreateScreen() {
  const { createProfile } = useGame()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [gender, setGender] = useState(null)
  const [ageMode, setAgeMode] = useState(null)

  const handleCreate = () => {
    if (!name.trim() || !gender || !ageMode) return
    createProfile({ name: name.trim(), gender, ageMode })
    navigate('/castle')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🧙</div>
          <h1 className="font-title text-3xl text-amber-400">Crea tu Mago</h1>
          <div className="flex justify-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${step >= s ? 'bg-amber-400' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-3xl border border-white/20 p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-title text-white text-2xl text-center mb-6">¿Cómo te llamas?</h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre mágico..."
                maxLength={20}
                className="w-full bg-white/20 border-2 border-white/30 rounded-2xl px-6 py-4 font-title text-white text-2xl text-center outline-none focus:border-amber-400 placeholder:text-white/40"
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                autoFocus
              />
              <motion.button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-xl py-4 rounded-full disabled:opacity-40"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >SIGUIENTE →</motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-title text-white text-2xl text-center mb-6">¿Eres niño o niña?</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: 'boy', label: 'Niño', emoji: '🧒' },
                  { value: 'girl', label: 'Niña', emoji: '👧' },
                ].map(({ value, label, emoji }) => (
                  <motion.button
                    key={value}
                    onClick={() => setGender(value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all ${gender === value ? 'border-amber-400 bg-amber-400/20' : 'border-white/30 bg-white/10 hover:bg-white/20'}`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Character gender={value} equippedSkins={{}} animationState="idle" size={100} />
                    <span className="font-title text-white text-xl">{label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-3">
                <motion.button onClick={() => setStep(1)} className="bg-white/20 text-white font-title px-6 py-3 rounded-full" whileTap={{ scale: 0.95 }}>← ATRÁS</motion.button>
                <motion.button onClick={() => setStep(3)} disabled={!gender} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-xl py-3 rounded-full disabled:opacity-40" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>SIGUIENTE →</motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-title text-white text-2xl text-center mb-6">¿Cuántos años tienes?</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: 'young', label: '5 años o menos', emoji: '🌟', desc: 'Sumas, restas y comparaciones' },
                  { value: 'older', label: '8-9 años', emoji: '⚡', desc: 'Tablas de multiplicar' },
                ].map(({ value, label, emoji, desc }) => (
                  <motion.button
                    key={value}
                    onClick={() => setAgeMode(value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all text-center ${ageMode === value ? 'border-amber-400 bg-amber-400/20' : 'border-white/30 bg-white/10 hover:bg-white/20'}`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-4xl">{emoji}</span>
                    <span className="font-title text-white text-lg">{label}</span>
                    <span className="font-body text-white/60 text-sm">{desc}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-3">
                <motion.button onClick={() => setStep(2)} className="bg-white/20 text-white font-title px-6 py-3 rounded-full" whileTap={{ scale: 0.95 }}>← ATRÁS</motion.button>
                <motion.button onClick={handleCreate} disabled={!ageMode} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title text-xl py-3 rounded-full disabled:opacity-40" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>¡COMENZAR LA AVENTURA! 🪄</motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
