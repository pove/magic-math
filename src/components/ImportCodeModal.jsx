import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { decodeSaveCode } from '../utils/saveCode'

const AGE_LABEL = { young: 'Suma y Resta', older: 'Multiplicación' }
const MODE_LABEL = { normal: 'Normal', pro: 'Pro', 'super-pro': 'Super Pro', 'super-chachi': 'Super Chachi' }

export default function ImportCodeModal({ initialCode = '', onClose }) {
  const { state, createProfile, updateProfile } = useGame()
  const [input, setInput] = useState(initialCode)
  const [decoded, setDecoded] = useState(null)
  const [error, setError] = useState(null)
  const [target, setTarget] = useState('new') // 'new' or a profile id
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (initialCode) handleDecode(initialCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecode = async (raw) => {
    setError(null)
    setDecoded(null)
    const value = raw ?? input
    if (!value.trim()) return
    try {
      const result = await decodeSaveCode(value)
      setDecoded(result)
    } catch {
      setError('Ese código no es válido. Revisa que esté bien escrito.')
    }
  }

  const canCreateNew = state.profiles.length < 4

  const handleApply = () => {
    if (!decoded) return
    const overrides = {
      currentFloor: decoded.currentFloor,
      currentRoom: decoded.currentRoom,
      lives: decoded.lives,
      score: decoded.score,
      completedGame: decoded.completedGame,
      newGamePlus: decoded.newGamePlus,
      currentMode: decoded.currentMode,
      unlockedModes: decoded.unlockedModes,
      unlockedSkins: decoded.unlockedSkins,
      equippedSkins: decoded.equippedSkins,
    }

    if (target === 'new') {
      if (!name.trim()) return
      createProfile({ name: name.trim(), gender: decoded.gender, ageMode: decoded.ageMode }, overrides)
    } else {
      updateProfile(target, { gender: decoded.gender, ageMode: decoded.ageMode, ...overrides })
    }
    setDone(true)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gradient-to-br from-indigo-950 to-purple-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.7 }} animate={{ scale: 1 }}
      >
        {done ? (
          <>
            <div className="text-4xl mb-2">✨</div>
            <div className="font-title text-white text-xl mb-4">¡Progreso importado!</div>
            <motion.button onClick={onClose} className="w-full bg-amber-400 text-indigo-950 font-title px-6 py-3 rounded-full" whileTap={{ scale: 0.97 }}>
              CONTINUAR
            </motion.button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">📥</div>
            <div className="font-title text-white text-xl mb-1">Tengo un código</div>
            <div className="font-body text-white/60 text-sm mb-4">
              Escribe el código que te dieron en el otro dispositivo.
            </div>

            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setDecoded(null); setError(null) }}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full bg-black/30 rounded-xl px-4 py-3 mb-3 font-mono text-amber-300 text-center tracking-wider uppercase placeholder:text-white/30 outline-none border border-white/10 focus:border-amber-400/60"
            />

            {error && <div className="font-body text-red-300 text-sm mb-3">{error}</div>}

            {!decoded && (
              <motion.button
                onClick={() => handleDecode(input)}
                disabled={!input.trim()}
                className="w-full bg-amber-400 text-indigo-950 font-title px-6 py-3 rounded-full mb-3 disabled:opacity-40"
                whileTap={{ scale: 0.97 }}
              >VERIFICAR CÓDIGO</motion.button>
            )}

            {decoded && (
              <div className="text-left mb-4">
                <div className="bg-white/10 rounded-2xl p-4 mb-4 font-body text-white/80 text-sm space-y-1">
                  <div>🏰 Planta <b className="text-amber-300">{decoded.currentFloor}</b> de 12</div>
                  <div>📚 Modo: <b className="text-amber-300">{AGE_LABEL[decoded.ageMode]}</b></div>
                  {decoded.currentMode !== 'normal' && (
                    <div>⭐ Dificultad: <b className="text-amber-300">{MODE_LABEL[decoded.currentMode]}</b></div>
                  )}
                </div>

                <div className="font-body text-white/70 text-sm mb-2">¿Dónde aplicamos este progreso?</div>
                <div className="flex flex-col gap-2 mb-3">
                  {state.profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTarget(p.id)}
                      className={`text-left px-4 py-2 rounded-xl border font-body text-white transition-all ${target === p.id ? 'border-amber-400 bg-amber-400/20' : 'border-white/20 bg-white/5'}`}
                    >
                      Reemplazar el progreso de <b>{p.name}</b>
                    </button>
                  ))}
                  {canCreateNew && (
                    <button
                      onClick={() => setTarget('new')}
                      className={`text-left px-4 py-2 rounded-xl border font-body text-white transition-all ${target === 'new' ? 'border-amber-400 bg-amber-400/20' : 'border-white/20 bg-white/5'}`}
                    >
                      Crear un mago nuevo con este progreso
                    </button>
                  )}
                </div>

                {target === 'new' && (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del mago"
                    maxLength={20}
                    className="w-full bg-black/30 rounded-xl px-4 py-3 mb-3 font-body text-white text-center outline-none border border-white/10 focus:border-amber-400/60"
                  />
                )}

                <motion.button
                  onClick={handleApply}
                  disabled={target === 'new' && !name.trim()}
                  className="w-full bg-amber-400 text-indigo-950 font-title px-6 py-3 rounded-full disabled:opacity-40"
                  whileTap={{ scale: 0.97 }}
                >APLICAR PROGRESO</motion.button>
              </div>
            )}

            <motion.button onClick={onClose} className="w-full bg-white/10 text-white font-title px-6 py-3 rounded-full" whileTap={{ scale: 0.97 }}>
              CANCELAR
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
