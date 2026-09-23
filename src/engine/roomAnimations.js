/**
 * Centralized timing knobs for the room/floor entrance & exit choreography.
 * Tweak these to change the pacing everywhere at once instead of hunting
 * through SceneBackground.jsx / RoomScreen.jsx. All values in milliseconds.
 *
 * Sequence on entering a room (fully sequential, one beat at a time so kids
 * can follow each step):
 *   1. background settles
 *   2. "Entrando en..." title pops in, holds long enough to read, fades out
 *   3. the character flies/walks in
 *   4. only once the character has arrived, the question/answers fade in
 */

// Arriving at room 1 of a new floor: background flies in first, then the
// title, then the character, then the question. Big, slow and dramatic so
// kids have plenty of time to enjoy — and read — each step.
export const FLOOR_INTRO = {
  bgDurationMs: 2600,     // background zoom/darken → settle
  titleDelayMs: 2000,     // "Entrando en..." appears once the background has settled
  titleFadeMs: 500,       // fade in/out duration for the title
  titleHoldMs: 2600,      // how long the title stays fully visible (reading time)
  charDurationMs: 1400,   // character flies in after the title is gone
  contentFadeMs: 600,     // question/answers fade in once the character has landed
}

// Moving to the next room of the same floor: lighter and quicker than a
// floor intro (it happens several times per floor), but the title still
// holds long enough to read before the character walks in.
export const ROOM_INTRO = {
  bgDurationMs: 1400,
  titleDelayMs: 250,
  titleFadeMs: 400,
  titleHoldMs: 2000,
  charDurationMs: 1000,
  contentFadeMs: 500,
}

// Leaving a finished room: the character flies off happily before we
// actually navigate to the next one.
export const ROOM_LEAVE = {
  charDurationMs: 1300,
  // Kept >= charDurationMs so the fly-off is fully visible before the cut.
  navigateDelayMs: 1500,
}

// 3D rooms tell the same story on stage: the camera tours the room first
// (with the title shown at the top so it doesn't hide the view), the Mago
// pops in, the back door swings open and the player runs in from it to
// their spot, then the question appears. `charDelayMs` is when the door
// opens and the run begins; `charDurationMs` is the run itself.
export const FLOOR_INTRO_3D = {
  bgDurationMs: 6500,     // the grand camera tour of a floor's first room
  titleDelayMs: 600,
  titleFadeMs: 500,
  titleHoldMs: 3400,
  charDelayMs: 6200,      // the door opens as the tour settles
  charDurationMs: 2600,
  contentFadeMs: 600,
}

export const ROOM_INTRO_3D = {
  bgDurationMs: 3000,
  titleDelayMs: 250,
  titleFadeMs: 400,
  titleHoldMs: 1900,
  charDelayMs: 2800,
  charDurationMs: 2300,
  contentFadeMs: 500,
}

// Leaving a 3D room: the Mago opens a portal and the player runs into it.
export const ROOM_LEAVE_3D = {
  charDurationMs: 1500,
  navigateDelayMs: 1800,
}
