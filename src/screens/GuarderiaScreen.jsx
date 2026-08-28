import { Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGame } from '../context/GameContext'
import { CHARACTERS_3D, CC_BY_CREDIT, getCharacter3dById, getDefaultCharacter3dId } from '../data/characters3d'
import { PETS, getUnlockedPets } from '../data/pets'
import { MONSTERS, getUnlockedMonsters } from '../data/monsters'
import GltfCharacter from '../components/character3d/GltfCharacter'
import { ErrorBoundary, useCanvasWatchdog } from '../components/CrashOverlay'

const TABS = [
  { key: 'character', label: 'Personaje', emoji: '🧑' },
  { key: 'pet', label: 'Mascota', emoji: '🐾' },
  { key: 'monster', label: 'Monstruo', emoji: '👹' },
]

export default function GuarderiaScreen() {
  const { activeProfile, setCharacter3d, setActiveCompanion } = useGame()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('character')
  const [showCredits, setShowCredits] = useState(false)
  const watchGl = useCanvasWatchdog()

  if (!activeProfile) return null

  const character = getCharacter3dById(activeProfile.character3dId) || getCharacter3dById(getDefaultCharacter3dId(activeProfile.gender))
  const companion = activeProfile.activeCompanion?.type === 'pet'
    ? PETS.find((p) => p.id === activeProfile.activeCompanion.id)
    : activeProfile.activeCompanion?.type === 'monster'
      ? MONSTERS.find((m) => m.id === activeProfile.activeCompanion.id)
      : null

  const items = activeTab === 'character' ? CHARACTERS_3D : activeTab === 'pet' ? getUnlockedPets(activeProfile) : getUnlockedMonsters(activeProfile)

  const handleSelect = (item) => {
    if (activeTab === 'character') {
      setCharacter3d(activeProfile.id, item.id)
      return
    }
    const isActive = activeProfile.activeCompanion?.type === activeTab && activeProfile.activeCompanion?.id === item.id
    setActiveCompanion(activeProfile.id, activeTab, isActive ? null : item.id)
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <h1 className="font-title text-amber-400 text-lg sm:text-2xl">🐾 Guardería</h1>
        <motion.button
          onClick={() => navigate('/castle')}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-title px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ¡LISTO! →
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col landscape:flex-row overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-2 w-full landscape:w-[26rem] p-2 sm:p-4 border-b landscape:border-b-0 landscape:border-r border-white/10 shrink-0 h-80 landscape:h-auto">
          <ErrorBoundary compact>
            <Canvas
              camera={{ fov: 40, position: [0.48, 1.28, 4.5] }}
              onCreated={({ gl }) => watchGl(gl)}
              dpr={[1, 2]}
            >
              <ambientLight intensity={0.9} />
              <directionalLight position={[3, 5, 4]} intensity={1.6} color="#e9d5ff" />
              <directionalLight position={[-3, 2, -3]} intensity={0.6} color="#93c5fd" />
              <hemisphereLight args={['#8b7fd4', '#2a2350', 1.1]} />
              <Suspense fallback={null}>
                <GltfCharacter key={character.file} src={character.file} animationName={character.animation} targetHeight={character.height} position={[-0.3, 0, 0]} />
                {companion && (
                  <GltfCharacter key={companion.file} src={companion.file} animationName={companion.animation} targetHeight={companion.height} position={[0.85, 0, 0.4]} rotationY={-0.6} />
                )}
              </Suspense>
              <OrbitControls target={[0.2, 0.8, 0]} enablePan={false} minDistance={1.5} maxDistance={8} />
            </Canvas>
          </ErrorBoundary>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 p-3 overflow-x-auto border-b border-white/10 shrink-0">
            {TABS.map((t) => (
              <motion.button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === t.key ? 'bg-amber-400/20 border border-amber-400' : 'bg-white/10 border border-transparent hover:bg-white/20'}`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="font-body text-white text-xs">{t.label}</span>
              </motion.button>
            ))}
          </div>

          {activeTab === 'character' && character.ccBy && (
            <div className="px-3 pt-2 text-xs font-body text-amber-300/80">
              © CC-BY —{' '}
              <button onClick={() => setShowCredits((v) => !v)} className="underline">créditos</button>
              {showCredits && <div className="mt-1 text-white/60">{CC_BY_CREDIT}</div>}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-white/40 font-body py-8">
                Completa una planta del castillo para desbloquear tu primer compañero
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map((item) => {
                  const isSelected = activeTab === 'character'
                    ? character.id === item.id
                    : activeProfile.activeCompanion?.type === activeTab && activeProfile.activeCompanion?.id === item.id
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                        isSelected ? 'border-amber-400 bg-amber-400/20 animate-pulse-gold' : 'border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50'
                      }`}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="font-body text-white text-xs text-center leading-tight">{item.name}</span>
                      {isSelected && (
                        <span className="absolute top-1 left-1 text-xs">✓</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
