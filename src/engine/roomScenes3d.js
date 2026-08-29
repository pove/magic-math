// Which floors have a 3D room background so far. Kept as a plain list
// (instead of reading RoomScene3D's own scene map) so screens can check
// `hasRoomScene3D(floor)` synchronously without pulling in the lazy-loaded
// three.js bundle just to make that decision.
const FLOORS_WITH_3D_ROOM = [1, 2, 3, 4, 5]

export function hasRoomScene3D(floor) {
  return FLOORS_WITH_3D_ROOM.includes(floor)
}
