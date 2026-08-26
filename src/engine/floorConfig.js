// Casi todas las plantas tienen 3 habitaciones normales + 1 examen del jefe.
// Las plantas de "gran repaso" (mezclan varias tablas/rangos ya vistos de golpe)
// tienen 2 habitaciones extra para poder subir la dificultad de forma más gradual
// antes del examen.
const EXTRA_ROOMS_BY_FLOOR = { 4: 5, 10: 5, 12: 5 }
const DEFAULT_NORMAL_ROOMS = 3

export function getNormalRoomCount(floor) {
  return EXTRA_ROOMS_BY_FLOOR[floor] || DEFAULT_NORMAL_ROOMS
}

export function getBossRoom(floor) {
  return getNormalRoomCount(floor) + 1
}

export function isBossRoom(floor, room) {
  return room === getBossRoom(floor)
}

export function getFloorStatus(floor, currentFloor) {
  if (floor < currentFloor) return 'done'
  if (floor === currentFloor) return 'active'
  return 'locked'
}
