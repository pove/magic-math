import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import Character from '../components/PixiCharacter'

function Stars() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle text-white/40 select-none pointer-events-none"
          style={{
            left: `${(i * 17 + 3) % 95}%`,
            top: `${(i * 23 + 5) % 90}%`,
            fontSize: `${0.5 + (i % 4) * 0.3}rem`,
            animationDelay: `${(i * 0.3) % 2}s`,
          }}
        >
          ✦
        </div>
      ))}
    </>
  )
}

function ConfirmModal({ name, onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gradient-to-br from-red-900 to-purple-900 border-2 border-red-400 rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
        initial={{ scale: 0.7 }} animate={{ scale: 1 }}
      >
        <div className="text-5xl mb-4">🗑️</div>
        <div className="font-title text-white text-2xl mb-2">¿Borrar a {name}?</div>
        <div className="font-body text-white/70 mb-6">Se perderá todo el progreso. Esta acción no se puede deshacer.</div>
        <div className="flex gap-4 justify-center">
          <motion.button
            onClick={onCancel}
            className="bg-white/20 text-white font-title px-6 py-3 rounded-full"
            whileTap={{ scale: 0.95 }}
          >CANCELAR</motion.button>
          <motion.button
            onClick={onConfirm}
            className="bg-red-600 text-white font-title px-6 py-3 rounded-full"
            whileTap={{ scale: 0.95 }}
          >BORRAR</motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfilesScreen() {
  const { state, selectProfile, deleteProfile } = useGame()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleSelect = (id) => {
    selectProfile(id)
    navigate('/castle')
  }

  const handleDelete = (id) => {
    deleteProfile(id)
    setDeleteTarget(null)
  }

  const profile = deleteTarget ? state.profiles.find((p) => p.id === deleteTarget) : null

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center p-6 overflow-hidden">
      <Stars />

      <motion.div
        className="text-center mb-8 z-10"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-6xl mb-2">🪄</div>
        <h1 className="font-title text-4xl text-amber-400">Escuela de Magia</h1>
        <p className="font-body text-white/60 text-lg">En busca de la Varita Encantada</p>
      </motion.div>

      <div className="z-10 w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {state.profiles.map((p, i) => (
            <motion.div
              key={p.id}
              className="relative bg-white/10 backdrop-blur rounded-3xl border border-white/20 p-5 cursor-pointer hover:bg-white/20 transition-all"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(p.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(p.id) }}
                className="absolute top-3 right-3 text-white/40 hover:text-red-400 text-xl transition-colors"
              >🗑️</button>

              <div className="flex items-center gap-3">
                <Character
                  gender={p.gender}
                  equippedSkins={p.equippedSkins}
                  animationState="idle"
                  size={70}
                />
                <div>
                  <div className="font-title text-white text-xl">{p.name}</div>
                  <div className="font-body text-white/60 text-sm">
                    {p.ageMode === 'young' ? '⭐ Suma y Resta' : '✦ Multiplicación'}
                  </div>
                  <div className="font-body text-amber-400 text-sm">Planta {p.currentFloor}/12</div>
                  {p.currentMode !== 'normal' && (
                    <div className="font-body text-pink-400 text-xs">Modo {p.currentMode.toUpperCase()}</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {state.profiles.length < 4 && (
            <motion.button
              className="bg-white/5 backdrop-blur rounded-3xl border-2 border-dashed border-white/30 p-5 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all min-h-[120px]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: state.profiles.length * 0.1 }}
              onClick={() => navigate('/create')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-4xl">+</span>
              <span className="font-title text-white/60 text-lg">Nuevo Mago</span>
            </motion.button>
          )}
        </div>

        {state.profiles.length === 0 && (
          <motion.p
            className="text-center font-body text-white/50 text-lg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            ¡Crea tu primer mago para empezar la aventura!
          </motion.p>
        )}
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            name={profile?.name || ''}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
