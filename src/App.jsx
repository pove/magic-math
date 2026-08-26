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
        <AppRoutes />
      </HashRouter>
    </GameProvider>
  )
}
