// Codifica/decodifica el progreso de un perfil en un código corto para
// transferirlo a otro dispositivo (por QR o tecleado a mano).
//
// No hay backend, así que la "firma" HMAC no es seguridad real: cualquiera
// que mire el bundle de JS puede encontrar SIGNING_SECRET. Su único objetivo
// es que un código escrito a mano, adivinado o con un carácter cambiado
// (p.ej. para intentar saltar de planta) sea rechazado en vez de aceptado.
import { SKINS } from '../data/skins'

const VERSION = 1
const MODES = ['normal', 'pro', 'super-pro', 'super-chachi']
const EQUIP_SLOTS = ['hair', 'top', 'bottom', 'shoes', 'hat', 'glasses', 'wings', 'accessory']
const SIGNATURE_BYTES = 4
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const SIGNING_SECRET = 'magic-school-castle-save-code-v1'

class BitWriter {
  constructor() {
    this.bits = []
  }

  write(value, width) {
    for (let i = width - 1; i >= 0; i--) this.bits.push((value >> i) & 1)
  }

  toBytes() {
    const padded = [...this.bits]
    while (padded.length % 8 !== 0) padded.push(0)
    const bytes = new Uint8Array(padded.length / 8)
    for (let i = 0; i < bytes.length; i++) {
      let byte = 0
      for (let b = 0; b < 8; b++) byte = (byte << 1) | padded[i * 8 + b]
      bytes[i] = byte
    }
    return bytes
  }
}

class BitReader {
  constructor(bytes) {
    this.bits = []
    for (const byte of bytes) {
      for (let b = 7; b >= 0; b--) this.bits.push((byte >> b) & 1)
    }
    this.pos = 0
  }

  read(width) {
    let value = 0
    for (let i = 0; i < width; i++) value = (value << 1) | (this.bits[this.pos++] || 0)
    return value
  }
}

function base32Encode(bytes) {
  let bitBuffer = 0
  let bitCount = 0
  let output = ''
  for (const byte of bytes) {
    bitBuffer = (bitBuffer << 8) | byte
    bitCount += 8
    while (bitCount >= 5) {
      output += CROCKFORD_ALPHABET[(bitBuffer >>> (bitCount - 5)) & 31]
      bitCount -= 5
    }
  }
  if (bitCount > 0) output += CROCKFORD_ALPHABET[(bitBuffer << (5 - bitCount)) & 31]
  return output
}

function base32Decode(str) {
  let bitBuffer = 0
  let bitCount = 0
  const bytes = []
  for (const char of str) {
    const value = CROCKFORD_ALPHABET.indexOf(char)
    if (value === -1) continue
    bitBuffer = (bitBuffer << 5) | value
    bitCount += 5
    if (bitCount >= 8) {
      bytes.push((bitBuffer >>> (bitCount - 8)) & 0xff)
      bitCount -= 8
    }
  }
  return new Uint8Array(bytes)
}

async function signBytes(bytes) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, bytes)
  return new Uint8Array(signature).slice(0, SIGNATURE_BYTES)
}

function formatCode(raw) {
  return raw.match(/.{1,4}/g).join('-')
}

export async function generateSaveCode(profile) {
  const writer = new BitWriter()
  writer.write(VERSION, 3)
  writer.write(profile.gender === 'girl' ? 1 : 0, 1)
  writer.write(profile.ageMode === 'older' ? 1 : 0, 1)
  writer.write(profile.currentFloor - 1, 4)
  writer.write(profile.currentRoom - 1, 3)
  writer.write(profile.completedGame ? 1 : 0, 1)
  writer.write(profile.newGamePlus ? 1 : 0, 1)
  writer.write(Math.max(0, MODES.indexOf(profile.currentMode)), 2)

  let modesMask = 0
  MODES.forEach((mode, i) => {
    if (profile.unlockedModes?.includes(mode)) modesMask |= 1 << i
  })
  writer.write(modesMask, 4)

  for (const slot of EQUIP_SLOTS) {
    const skinId = profile.equippedSkins?.[slot]
    const index = skinId ? SKINS.findIndex((s) => s.id === skinId) : -1
    writer.write(index + 1, 7) // 0 = nada equipado, N+1 = índice en SKINS
  }

  const payload = writer.toBytes()
  const signature = await signBytes(payload)
  const full = new Uint8Array(payload.length + signature.length)
  full.set(payload, 0)
  full.set(signature, payload.length)

  return formatCode(base32Encode(full))
}

export async function decodeSaveCode(rawCode) {
  const clean = String(rawCode).toUpperCase().replace(/[^0-9A-Z]/g, '')
  const bytes = base32Decode(clean)
  if (bytes.length <= SIGNATURE_BYTES) throw new Error('INVALID_CODE')

  const payload = bytes.slice(0, bytes.length - SIGNATURE_BYTES)
  const signature = bytes.slice(bytes.length - SIGNATURE_BYTES)
  const expectedSignature = await signBytes(payload)
  const isValid = signature.length === expectedSignature.length &&
    signature.every((b, i) => b === expectedSignature[i])
  if (!isValid) throw new Error('INVALID_CODE')

  const reader = new BitReader(payload)
  const version = reader.read(3)
  if (version !== VERSION) throw new Error('UNSUPPORTED_VERSION')

  const gender = reader.read(1) ? 'girl' : 'boy'
  const ageMode = reader.read(1) ? 'older' : 'young'
  const currentFloor = reader.read(4) + 1
  const currentRoom = reader.read(3) + 1
  const completedGame = !!reader.read(1)
  const newGamePlus = !!reader.read(1)
  const currentMode = MODES[reader.read(2)] || 'normal'
  const modesMask = reader.read(4)
  const unlockedModes = MODES.filter((_, i) => modesMask & (1 << i))
  if (!unlockedModes.includes('normal')) unlockedModes.unshift('normal')

  const equippedSkins = {}
  for (const slot of EQUIP_SLOTS) {
    const index = reader.read(7)
    equippedSkins[slot] = index === 0 ? null : (SKINS[index - 1]?.id ?? null)
  }

  // El desbloqueo de ítems es determinista según planta/habitación alcanzada,
  // así que no hace falta codificarlo aparte (y así el código es más corto).
  const unlockedSkins = SKINS.filter((s) =>
    s.unlockedAtFloor < currentFloor ||
    (s.unlockedAtFloor === currentFloor && s.unlockedAtRoom < currentRoom)
  ).map((s) => s.id)
  Object.values(equippedSkins).forEach((id) => {
    if (id && !unlockedSkins.includes(id)) unlockedSkins.push(id)
  })

  return {
    gender,
    ageMode,
    currentFloor,
    currentRoom,
    lives: 3,
    score: 0,
    completedGame,
    newGamePlus,
    currentMode,
    unlockedModes,
    unlockedSkins,
    equippedSkins,
  }
}
