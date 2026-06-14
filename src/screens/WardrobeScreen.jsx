import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { SKINS } from '../data/skins'
import Character from '../components/Character'

const SLOTS = [
  { key: 'hair', label: 'Pelo', emoji: '💇' },
  { key: 'hat', label: 'Sombrero', emoji: '🎩' },
  { key: 'glasses', label: 'Gafas', emoji: '👓' },
  { key: 'top', label: 'Camiseta', emoji: '👕' },
  { key: 'bottom', label: 'Pantalón', emoji: '👖' },
  { key: 'shoes', label: 'Zapatos', emoji: '👟' },
  { key: 'wings', label: 'Alas', emoji: '🦋' },
  { key: 'accessory', label: 'Extras', emoji: '🎒' },
]

export default function WardrobeScreen() {
  const { activeProfile, equipSkin } = useGame()
  const navigate = useNavigate()
  const [activeSlot, setActiveSlot] = useState('hat')

  if (!activeProfile) return null

  const slotSkins = SKINS.filter((s) => s.slot === activeSlot && (s.gender === 'unisex' || s.gender === activeProfile.gender))

  const handleEquip = (skinId) => {
    const skin = SKINS.find((s) => s.id === skinId)
    if (!skin) return
    if (!activeProfile.unlockedSkins.includes(skinId)) return
    const current = activeProfile.equippedSkins[skin.slot]
    equipSkin(activeProfile.id, skin.slot, current === skinId ? null : skinId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="font-title text-amber-400 text-2xl">👗 Mi Armario</h1>
        <motion.button
          onClick={() => navigate('/castle')}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title px-6 py-2 rounded-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ¡LISTO! →
        </motion.button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Character preview */}
        <div className="flex flex-col items-center justify-center w-48 p-4 border-r border-white/10 shrink-0">
          <Character
            gender={activeProfile.gender}
            equippedSkins={activeProfile.equippedSkins}
            animationState="idle"
            size={160}
          />
          <div className="font-title text-white/60 text-sm mt-2">{activeProfile.name}</div>
        </div>

        {/* Slot tabs + items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slot tabs */}
          <div className="flex gap-1 p-3 overflow-x-auto border-b border-white/10 shrink-0">
            {SLOTS.map((s) => (
              <motion.button
                key={s.key}
                onClick={() => setActiveSlot(s.key)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${activeSlot === s.key ? 'bg-amber-400/20 border border-amber-400' : 'bg-white/10 border border-transparent hover:bg-white/20'}`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="font-body text-white text-xs">{s.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slotSkins.length === 0 && (
                <div className="col-span-full text-center text-white/40 font-body py-8">
                  No hay ítems disponibles en esta categoría
                </div>
              )}
              {slotSkins.map((skin) => {
                const isUnlocked = activeProfile.unlockedSkins.includes(skin.id)
                const isEquipped = activeProfile.equippedSkins[skin.slot] === skin.id
                return (
                  <motion.button
                    key={skin.id}
                    onClick={() => handleEquip(skin.id)}
                    disabled={!isUnlocked}
                    className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                      isEquipped ? 'border-amber-400 bg-amber-400/20 animate-pulse-gold' :
                      isUnlocked ? 'border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50' :
                      'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={isUnlocked ? { scale: 1.04 } : {}}
                    whileTap={isUnlocked ? { scale: 0.96 } : {}}
                  >
                    <span className="text-3xl">{skin.emoji}</span>
                    <span className="font-body text-white text-xs text-center leading-tight">{skin.name}</span>
                    {!isUnlocked && (
                      <span className="absolute top-1 right-1 text-xs text-white/50">🔒P{skin.unlockedAtFloor}</span>
                    )}
                    {isEquipped && (
                      <span className="absolute top-1 left-1 text-xs">✓</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
