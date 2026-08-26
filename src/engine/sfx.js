/**
 * Zero-asset sound effects synthesized with the Web Audio API.
 * No files, no downloads — everything generated in code.
 */

let ctx = null
let muted = false

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(v) { muted = v }
export function isMuted() { return muted }

function tone({ freq = 440, type = 'sine', dur = 0.2, vol = 0.15, delay = 0, slideTo = null }) {
  const c = getCtx()
  if (!c || muted) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function noise({ dur = 0.3, vol = 0.12, delay = 0, filterFreq = 1200 }) {
  const c = getCtx()
  if (!c || muted) return
  const t0 = c.currentTime + delay
  const len = Math.floor(c.sampleRate * dur)
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(t0)
}

const NOTE = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, C6: 1046.5 }

export const sfx = {
  correct() {
    // happy ascending arpeggio
    ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.18, vol: 0.14, delay: i * 0.09 })
    )
    // sparkle
    tone({ freq: 1568, type: 'sine', dur: 0.35, vol: 0.06, delay: 0.36 })
  },
  wrong() {
    tone({ freq: 220, type: 'sawtooth', dur: 0.25, vol: 0.08, slideTo: 140 })
    tone({ freq: 180, type: 'square', dur: 0.3, vol: 0.05, delay: 0.12, slideTo: 110 })
  },
  click() {
    tone({ freq: 600, type: 'triangle', dur: 0.07, vol: 0.09 })
  },
  pop() {
    tone({ freq: 350, type: 'sine', dur: 0.1, vol: 0.12, slideTo: 700 })
  },
  reward() {
    // little fanfare
    ;[NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5].forEach((f, i) =>
      tone({ freq: f, type: 'square', dur: 0.16, vol: 0.08, delay: i * 0.11 })
    )
    ;[NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.1, delay: 0.5 + i * 0.08 })
    )
    noise({ dur: 0.5, vol: 0.04, delay: 0.5, filterFreq: 4000 })
  },
  victory() {
    const melody = [NOTE.C5, NOTE.C5, NOTE.C5, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.C6]
    melody.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.13, delay: i * 0.18 }))
  },
  defeat() {
    ;[NOTE.E4, NOTE.D4, NOTE.C4, NOTE.A4 - 40].forEach((f, i) =>
      tone({ freq: f, type: 'sine', dur: 0.35, vol: 0.1, delay: i * 0.25 })
    )
  },
  heartLost() {
    tone({ freq: 300, type: 'sine', dur: 0.3, vol: 0.12, slideTo: 100 })
  },
  whoosh() {
    noise({ dur: 0.25, vol: 0.06, filterFreq: 2500 })
  },
  magic() {
    // twinkly spell cast
    ;[1200, 1500, 1800, 2100].forEach((f, i) =>
      tone({ freq: f, type: 'sine', dur: 0.25, vol: 0.05, delay: i * 0.06 })
    )
  },
  tick() {
    tone({ freq: 900, type: 'square', dur: 0.04, vol: 0.04 })
  },
}
