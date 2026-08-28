import { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getBossRoom } from '../engine/floorConfig'
import { getCharacter3dById } from '../data/characters3d'

const LS_KEY = 'magic_school_profiles'
const LS_ACTIVE = 'magic_school_active_id'

const DEFAULT_EQUIPPED = { hair: null, top: null, bottom: null, shoes: null, hat: null, glasses: null, wings: null, accessory: null }

function loadProfiles() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || []
  } catch {
    return []
  }
}

function saveProfiles(profiles) {
  localStorage.setItem(LS_KEY, JSON.stringify(profiles))
}

const initialState = {
  profiles: loadProfiles(),
  activeId: localStorage.getItem(LS_ACTIVE) || null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_PROFILE': {
      const profile = {
        id: uuidv4(),
        name: action.payload.name,
        gender: action.payload.gender,
        ageMode: action.payload.ageMode,
        currentFloor: 1,
        currentRoom: 1,
        lives: 3,
        score: 0,
        unlockedSkins: [],
        equippedSkins: { ...DEFAULT_EQUIPPED },
        character3dId: null,
        activeCompanion: null,
        completedGame: false,
        newGamePlus: false,
        currentMode: 'normal',
        unlockedModes: ['normal'],
        ...action.payload.overrides,
      }
      const profiles = [...state.profiles, profile]
      saveProfiles(profiles)
      localStorage.setItem(LS_ACTIVE, profile.id)
      return { profiles, activeId: profile.id }
    }
    case 'SELECT_PROFILE': {
      localStorage.setItem(LS_ACTIVE, action.payload)
      return { ...state, activeId: action.payload }
    }
    case 'DELETE_PROFILE': {
      const profiles = state.profiles.filter((p) => p.id !== action.payload)
      saveProfiles(profiles)
      const activeId = state.activeId === action.payload ? null : state.activeId
      if (state.activeId === action.payload) localStorage.removeItem(LS_ACTIVE)
      return { profiles, activeId }
    }
    case 'UPDATE_PROFILE': {
      const profiles = state.profiles.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload.changes } : p
      )
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'LOSE_LIFE': {
      const profiles = state.profiles.map((p) =>
        p.id === action.payload ? { ...p, lives: Math.max(0, p.lives - 1) } : p
      )
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'RESET_FLOOR': {
      const profiles = state.profiles.map((p) =>
        p.id === action.payload ? { ...p, lives: 3, currentRoom: 1 } : p
      )
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'ADVANCE_ROOM': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload) return p
        const bossRoom = getBossRoom(p.currentFloor)
        if (p.currentRoom >= bossRoom) {
          // Advance floor
          const nextFloor = p.currentFloor + 1
          if (nextFloor > 12) return { ...p, currentRoom: bossRoom } // Will trigger victory
          return { ...p, currentFloor: nextFloor, currentRoom: 1, lives: 3 }
        }
        return { ...p, currentRoom: p.currentRoom + 1 }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'UNLOCK_SKIN': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload.id) return p
        if (p.unlockedSkins.includes(action.payload.skinId)) return p
        return { ...p, unlockedSkins: [...p.unlockedSkins, action.payload.skinId] }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'EQUIP_SKIN': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload.id) return p
        return { ...p, equippedSkins: { ...p.equippedSkins, [action.payload.slot]: action.payload.skinId } }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'SET_CHARACTER3D': {
      // Keep the 2D gender (which drives skins/PixiCharacter) in step with
      // whichever 3D character is active, so switching back to 2D shows the
      // matching look instead of whatever gender was picked at creation.
      const character = getCharacter3dById(action.payload.character3dId)
      const profiles = state.profiles.map((p) =>
        p.id === action.payload.id
          ? { ...p, character3dId: action.payload.character3dId, ...(character ? { gender: character.gender } : {}) }
          : p
      )
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'SET_ACTIVE_COMPANION': {
      const profiles = state.profiles.map((p) =>
        p.id === action.payload.id ? { ...p, activeCompanion: { type: action.payload.type, id: action.payload.companionId } } : p
      )
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'COMPLETE_GAME': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload) return p
        const unlockedModes = [...p.unlockedModes]
        let nextMode = p.currentMode
        if (p.currentMode === 'normal') { if (!unlockedModes.includes('pro')) unlockedModes.push('pro') }
        else if (p.currentMode === 'pro' && p.ageMode === 'older') { if (!unlockedModes.includes('super-pro')) unlockedModes.push('super-pro') }
        else if (p.currentMode === 'super-pro') { if (!unlockedModes.includes('super-chachi')) unlockedModes.push('super-chachi') }
        return { ...p, completedGame: true, newGamePlus: true, unlockedModes }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    case 'START_NEW_GAME_PLUS': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload.id) return p
        return { ...p, currentFloor: 1, currentRoom: 1, lives: 3, score: 0, completedGame: false, currentMode: action.payload.mode, topModeProgress: null }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    // Salta entre modos ya desbloqueados. Cualquier modo que no sea el último
    // desbloqueado está, por definición, completo (es la única forma de haber
    // llegado al siguiente), así que se muestra siempre listo para repasar sin
    // guardar nada. Solo el modo más avanzado tiene progreso real que
    // recordar, así que basta un único snapshot para retomarlo tal cual se dejó.
    case 'SWITCH_MODE': {
      const profiles = state.profiles.map((p) => {
        if (p.id !== action.payload.id) return p
        const targetMode = action.payload.mode
        if (targetMode === p.currentMode || !p.unlockedModes.includes(targetMode)) return p
        const topMode = p.unlockedModes[p.unlockedModes.length - 1]
        const topModeProgress = p.currentMode === topMode
          ? { currentFloor: p.currentFloor, currentRoom: p.currentRoom, lives: p.lives }
          : p.topModeProgress
        const restored = targetMode === topMode
          ? topModeProgress || { currentFloor: 1, currentRoom: 1, lives: 3 }
          : { currentFloor: 12, currentRoom: getBossRoom(12), lives: 3 }
        return { ...p, ...restored, currentMode: targetMode, topModeProgress }
      })
      saveProfiles(profiles)
      return { ...state, profiles }
    }
    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const activeProfile = state.profiles.find((p) => p.id === state.activeId) || null

  const actions = {
    createProfile: (data, overrides) => dispatch({ type: 'CREATE_PROFILE', payload: { ...data, overrides } }),
    selectProfile: (id) => dispatch({ type: 'SELECT_PROFILE', payload: id }),
    deleteProfile: (id) => dispatch({ type: 'DELETE_PROFILE', payload: id }),
    updateProfile: (id, changes) => dispatch({ type: 'UPDATE_PROFILE', payload: { id, changes } }),
    loseLife: (id) => dispatch({ type: 'LOSE_LIFE', payload: id }),
    resetFloor: (id) => dispatch({ type: 'RESET_FLOOR', payload: id }),
    advanceRoom: (id) => dispatch({ type: 'ADVANCE_ROOM', payload: id }),
    unlockSkin: (id, skinId) => dispatch({ type: 'UNLOCK_SKIN', payload: { id, skinId } }),
    equipSkin: (id, slot, skinId) => dispatch({ type: 'EQUIP_SKIN', payload: { id, slot, skinId } }),
    setCharacter3d: (id, character3dId) => dispatch({ type: 'SET_CHARACTER3D', payload: { id, character3dId } }),
    setActiveCompanion: (id, type, companionId) => dispatch({ type: 'SET_ACTIVE_COMPANION', payload: { id, type, companionId } }),
    completeGame: (id) => dispatch({ type: 'COMPLETE_GAME', payload: id }),
    startNewGamePlus: (id, mode) => dispatch({ type: 'START_NEW_GAME_PLUS', payload: { id, mode } }),
    switchMode: (id, mode) => dispatch({ type: 'SWITCH_MODE', payload: { id, mode } }),
  }

  return (
    <GameContext.Provider value={{ state, activeProfile, ...actions }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
