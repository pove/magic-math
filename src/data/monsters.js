import { getMaxCompletedFloor } from './pets'

// Quaternius "Ultimate Monsters" mixes three very different native scales
// (Big/Blob/Flying) and several models don't sit at y=0 in their idle pose —
// GltfCharacter's bounding-box normalization grounds and rescales every
// model to a per-category target height, so monsters in the same category
// always render the same size, while Big ones still read as bigger than
// Blob ones (the pack's own intentional variety), not randomly so.
const HEIGHT = { big: 1.1, blob: 0.7, flying: 0.85 }

export const MONSTERS = [
  { id: 'dino', name: 'Dino', unlockedAtFloor: 1, file: '/models/monsters/monster_dino.gltf', height: HEIGHT.big, animation: 'Idle', emoji: '🦖' },
  { id: 'bunny', name: 'Conejo Grande', unlockedAtFloor: 2, file: '/models/monsters/monster_bunny.gltf', height: HEIGHT.big, animation: 'Idle', emoji: '🐇' },
  { id: 'yeti', name: 'Yeti', unlockedAtFloor: 3, file: '/models/monsters/monster_yeti.gltf', height: HEIGHT.big, animation: 'Idle', emoji: '🧊' },
  { id: 'cat', name: 'Gato Blob', unlockedAtFloor: 4, file: '/models/monsters/monster_cat.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '😺' },
  { id: 'dog', name: 'Perro Blob', unlockedAtFloor: 5, file: '/models/monsters/monster_dog.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '🐕' },
  { id: 'chicken', name: 'Pollo Blob', unlockedAtFloor: 6, file: '/models/monsters/monster_chicken.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '🐔' },
  { id: 'greenblob', name: 'Blob Verde', unlockedAtFloor: 7, file: '/models/monsters/monster_greenblob.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '🟢' },
  { id: 'pinkblob', name: 'Blob Rosa', unlockedAtFloor: 8, file: '/models/monsters/monster_pinkblob.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '🩷' },
  { id: 'wizard', name: 'Blob Mago', unlockedAtFloor: 9, file: '/models/monsters/monster_wizard.gltf', height: HEIGHT.blob, animation: 'Idle', emoji: '🔮' },
  { id: 'dragon', name: 'Dragón', unlockedAtFloor: 10, file: '/models/monsters/monster_dragon.gltf', height: HEIGHT.flying, animation: 'Flying_Idle', emoji: '🐉' },
  { id: 'ghost', name: 'Fantasma', unlockedAtFloor: 11, file: '/models/monsters/monster_ghost.gltf', height: HEIGHT.flying, animation: 'Flying_Idle', emoji: '👻' },
  { id: 'alpaking', name: 'Alpaca Voladora', unlockedAtFloor: 12, file: '/models/monsters/monster_alpaking.gltf', height: HEIGHT.flying, animation: 'Flying_Idle', emoji: '🦙' },
]

export const getMonsterById = (id) => MONSTERS.find((m) => m.id === id)
export const getMonsterForFloor = (floor) => MONSTERS.find((m) => m.unlockedAtFloor === floor)

export const getUnlockedMonsters = (profile) => {
  const maxFloor = getMaxCompletedFloor(profile)
  return MONSTERS.filter((m) => m.unlockedAtFloor <= maxFloor)
}
