import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GameProvider, useGame } from './context/GameContext'

import ProfilesScreen from './screens/ProfilesScreen'
import CharacterCreateScreen from './screens/CharacterCreateScreen'
import CastleScreen from './screens/CastleScreen'
import RoomScreen from './screens/RoomScreen'
import BossScreen from './screens/BossScreen'
import WardrobeScreen from './screens/WardrobeScreen'
import VictoryFloorScreen from './screens/VictoryFloorScreen'
import VictoryGameScreen from './screens/VictoryGameScreen'
import DefeatScreen from './screens/DefeatScreen'

function OrientationGuard({ children }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (isPortrait) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f0c29] to-[#302b63] flex flex-col items-center justify-center text-center p-8 z-50">
        <div className="text-8xl mb-6">🔄</div>
        <div className="font-title text-amber-400 text-3xl mb-3">¡Gira tu dispositivo!</div>
        <div className="font-body text-white/70 text-lg">
          Este juego está diseñado para jugarse en horizontal.
          <br />Por favor, gira tu pantalla. 🧙
        </div>
      </div>
    )
  }

  return children
}

function ActiveProfileGuard({ children }) {
  const { activeProfile } = useGame()
  const location = useLocation()

  if (!activeProfile && location.pathname !== '/' && location.pathname !== '/create') {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const { activeProfile } = useGame()
  const location = useLocation()
  const practiceFloor = location.state?.practiceFloor
  const roomKey = practiceFloor
    ? `practice-${practiceFloor}-${location.state?.practiceRoom || 1}`
    : activeProfile
      ? `${activeProfile.currentFloor}-${activeProfile.currentRoom}`
      : 'none'

  return (
    <ActiveProfileGuard>
      <Routes>
        <Route path="/" element={<ProfilesScreen />} />
        <Route path="/create" element={<CharacterCreateScreen />} />
        <Route path="/castle" element={<CastleScreen />} />
        <Route path="/room" element={<RoomScreen key={roomKey} />} />
        <Route path="/boss" element={<BossScreen />} />
        <Route path="/wardrobe" element={<WardrobeScreen />} />
        <Route path="/victory-floor" element={<VictoryFloorScreen />} />
        <Route path="/victory-game" element={<VictoryGameScreen />} />
        <Route path="/defeat" element={<DefeatScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ActiveProfileGuard>
  )
}

export default function App() {
  return (
    <GameProvider>
      <HashRouter>
        <OrientationGuard>
          <AppRoutes />
        </OrientationGuard>
      </HashRouter>
    </GameProvider>
  )
}
