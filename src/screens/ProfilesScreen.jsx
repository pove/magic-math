import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import Character from '../components/PixiCharacter'
import ShareCodeModal from '../components/ShareCodeModal'
import ImportCodeModal from '../components/ImportCodeModal'

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
  const [shareTarget, setShareTarget] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const importCode = searchParams.get('import') || ''

  useEffect(() => {
    if (importCode) setShowImport(true)
  }, [importCode])

  const handleCloseImport = () => {
    setShowImport(false)
    if (importCode) setSearchParams({}, { replace: true })
  }

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
    <div className="relative h-dvh bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <Stars />

      <motion.div
        className="text-center mb-6 sm:mb-8 z-10 shrink-0"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="text-4xl sm:text-6xl mb-2">🪄</div>
        <h1 className="font-title text-2xl sm:text-4xl text-amber-400">Escuela de Magia</h1>
        <p className="font-body text-white/60 text-sm sm:text-lg">En busca de la Varita Encantada</p>
      </motion.div>

      <div className="z-10 w-full max-w-2xl">
        {/* One card per row on a phone — two 170px cards leave no room for the
            character next to the name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
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
              <button
                onClick={(e) => { e.stopPropagation(); setShareTarget(p.id) }}
                className="absolute top-3 right-11 text-white/40 hover:text-amber-400 text-xl transition-colors"
                title="Continuar en otro dispositivo"
              >📤</button>

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

        <motion.button
          onClick={() => setShowImport(true)}
          className="block mx-auto mt-2 font-body text-white/50 hover:text-amber-400 text-sm underline transition-colors"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        >
          📥 Tengo un código de otro dispositivo
        </motion.button>
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            name={profile?.name || ''}
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
        {shareTarget && (
          <ShareCodeModal
            profile={state.profiles.find((p) => p.id === shareTarget)}
            onClose={() => setShareTarget(null)}
          />
        )}
        {showImport && (
          <ImportCodeModal initialCode={importCode} onClose={handleCloseImport} />
        )}
      </AnimatePresence>
    </div>
  )
}
