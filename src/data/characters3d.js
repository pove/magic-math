const IDLE = 'CharacterArmature|Idle'

// All 8 models come from the same Quaternius rig family and measure a very
// consistent ~1.8-1.9 native units tall — so a single target height (see
// GltfCharacter's bounding-box normalization) keeps every character the same
// size on screen, regardless of outfit.
const CHARACTER_HEIGHT = 1.5

export const CHARACTERS_3D = [
  { id: 'woman', name: 'Chica · Formal', gender: 'girl', file: '/models/characters/quaternius_woman.glb', height: CHARACTER_HEIGHT, animation: 'CharacterArmature|Idle_Neutral', emoji: '👩' },
  { id: 'woman-scifi', name: 'Chica · Sci-Fi', gender: 'girl', file: '/models/characters/quaternius_woman_scifi.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '👩‍🚀', ccBy: true },
  { id: 'woman-soldier', name: 'Chica · Soldado', gender: 'girl', file: '/models/characters/quaternius_woman_soldier.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '🪖', ccBy: true },
  { id: 'woman-suit', name: 'Chica · Traje', gender: 'girl', file: '/models/characters/quaternius_woman_suit.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '👩‍💼', ccBy: true },
  { id: 'man-king', name: 'Chico · Rey', gender: 'boy', file: '/models/characters/quaternius_man_king.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '🤴' },
  { id: 'man-business', name: 'Chico · Ejecutivo', gender: 'boy', file: '/models/characters/quaternius_man_businessman.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '👨‍💼' },
  { id: 'man-adventurer', name: 'Chico · Aventurero', gender: 'boy', file: '/models/characters/quaternius_man_adventurer.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '🧭' },
  { id: 'man-hoodie', name: 'Chico · Sudadera', gender: 'boy', file: '/models/characters/quaternius_man_hoodie.glb', height: CHARACTER_HEIGHT, animation: IDLE, emoji: '🧥' },
]

export const CC_BY_CREDIT = 'Modelos CC-BY de Quaternius (poly.pizza) — se requiere atribución.'

export const getCharacter3dById = (id) => CHARACTERS_3D.find((c) => c.id === id)

export const getDefaultCharacter3dId = (gender) =>
  (CHARACTERS_3D.find((c) => c.gender === gender) || CHARACTERS_3D[0]).id
