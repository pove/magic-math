// Kenney "Cube Pets" native heights vary ~1.46-2.01 units (bunny ears vs.
// koala), which read as wildly different sizes once rendered — one flat
// target height (see GltfCharacter's bounding-box normalization) keeps every
// pet the same companion-sized scale next to the player.
const PET_HEIGHT = 0.65

export const PETS = [
  { id: 'dog', name: 'Perro', unlockedAtFloor: 1, file: '/models/pets/kenney_pet_dog.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐶' },
  { id: 'cat', name: 'Gato', unlockedAtFloor: 2, file: '/models/pets/kenney_pet_cat.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐱' },
  { id: 'fox', name: 'Zorro', unlockedAtFloor: 3, file: '/models/pets/kenney_pet_fox.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🦊' },
  { id: 'panda', name: 'Panda', unlockedAtFloor: 4, file: '/models/pets/kenney_pet_panda.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐼' },
  { id: 'bunny', name: 'Conejo', unlockedAtFloor: 5, file: '/models/pets/kenney_pet_bunny.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐰' },
  { id: 'koala', name: 'Koala', unlockedAtFloor: 6, file: '/models/pets/kenney_pet_koala.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐨' },
  { id: 'penguin', name: 'Pingüino', unlockedAtFloor: 7, file: '/models/pets/kenney_pet_penguin.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐧' },
  { id: 'chick', name: 'Pollito', unlockedAtFloor: 8, file: '/models/pets/kenney_pet_chick.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐥' },
  { id: 'cow', name: 'Vaca', unlockedAtFloor: 9, file: '/models/pets/kenney_pet_cow.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐮' },
  { id: 'pig', name: 'Cerdito', unlockedAtFloor: 10, file: '/models/pets/kenney_pet_pig.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🐷' },
  { id: 'deer', name: 'Ciervo', unlockedAtFloor: 11, file: '/models/pets/kenney_pet_deer.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🦌' },
  { id: 'parrot', name: 'Loro', unlockedAtFloor: 12, file: '/models/pets/kenney_pet_parrot.glb', height: PET_HEIGHT, animation: 'idle', emoji: '🦜' },
]

export const getPetById = (id) => PETS.find((p) => p.id === id)
export const getPetForFloor = (floor) => PETS.find((p) => p.unlockedAtFloor === floor)

export const getMaxCompletedFloor = (profile) => (profile.completedGame ? 12 : profile.currentFloor - 1)

export const getUnlockedPets = (profile) => {
  const maxFloor = getMaxCompletedFloor(profile)
  return PETS.filter((p) => p.unlockedAtFloor <= maxFloor)
}
