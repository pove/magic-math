export const SKINS = [
  // ── HAIR (8) — asignados a los huecos libres entre planta 2-11 ──
  // Huecos libres: F2R2, F3R3, F4R1, F5R2, F6R3, F8R2, F9R1, F11R1
  { id: 'hair_blonde', name: 'Pelo Rubio', slot: 'hair', gender: 'unisex', unlockedAtFloor: 2, unlockedAtRoom: 2, emoji: '👱', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 1 },
  { id: 'hair_red', name: 'Pelo Pelirrojo', slot: 'hair', gender: 'unisex', unlockedAtFloor: 3, unlockedAtRoom: 3, emoji: '🦰', primaryColor: '#dc2626', secondaryColor: '#fca5a5', shapeVariant: 1 },
  { id: 'hair_black', name: 'Pelo Negro', slot: 'hair', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 1, emoji: '🖤', primaryColor: '#0f172a', secondaryColor: '#334155', shapeVariant: 1 },
  { id: 'hair_blue', name: 'Pelo Azul Mágico', slot: 'hair', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 2, emoji: '💙', primaryColor: '#1d4ed8', secondaryColor: '#93c5fd', shapeVariant: 1 },
  { id: 'hair_pink', name: 'Pelo Rosa', slot: 'hair', gender: 'girl', unlockedAtFloor: 6, unlockedAtRoom: 3, emoji: '🩷', primaryColor: '#ec4899', secondaryColor: '#fda4af', shapeVariant: 1 },
  { id: 'hair_purple', name: 'Pelo Morado', slot: 'hair', gender: 'unisex', unlockedAtFloor: 8, unlockedAtRoom: 2, emoji: '💜', primaryColor: '#7c3aed', secondaryColor: '#c4b5fd', shapeVariant: 1 },
  { id: 'hair_green', name: 'Pelo Verde Esmeralda', slot: 'hair', gender: 'unisex', unlockedAtFloor: 9, unlockedAtRoom: 1, emoji: '💚', primaryColor: '#065f46', secondaryColor: '#6ee7b7', shapeVariant: 1 },
  { id: 'hair_rainbow', name: 'Pelo Arcoíris', slot: 'hair', gender: 'unisex', unlockedAtFloor: 11, unlockedAtRoom: 1, emoji: '🌈', primaryColor: '#f59e0b', secondaryColor: '#ec4899', shapeVariant: 2 },

  // ── GLASSES (5) ─────────────────────────────────────────────
  { id: 'glasses_round', name: 'Gafas Redondas', slot: 'glasses', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 1, emoji: '👓', primaryColor: '#1e293b', secondaryColor: '#94a3b8', shapeVariant: 1 },
  { id: 'glasses_heart', name: 'Gafas Corazón', slot: 'glasses', gender: 'girl', unlockedAtFloor: 3, unlockedAtRoom: 2, emoji: '🩷', primaryColor: '#ec4899', secondaryColor: '#fda4af', shapeVariant: 2 },
  { id: 'glasses_star', name: 'Gafas Estrella', slot: 'glasses', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 1, emoji: '⭐', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 3 },
  { id: 'glasses_sun', name: 'Gafas de Sol', slot: 'glasses', gender: 'unisex', unlockedAtFloor: 7, unlockedAtRoom: 2, emoji: '😎', primaryColor: '#0f172a', secondaryColor: '#475569', shapeVariant: 4 },
  { id: 'glasses_mago', name: 'Gafas de Mago', slot: 'glasses', gender: 'unisex', unlockedAtFloor: 10, unlockedAtRoom: 1, emoji: '🔮', primaryColor: '#7c3aed', secondaryColor: '#c4b5fd', shapeVariant: 1 },

  // ── HATS (6) ────────────────────────────────────────────────
  { id: 'hat_knit', name: 'Gorro de Punto', slot: 'hat', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 2, emoji: '🧢', primaryColor: '#dc2626', secondaryColor: '#fca5a5', shapeVariant: 1 },
  { id: 'hat_mini_mago', name: 'Sombrero Mago Pequeño', slot: 'hat', gender: 'unisex', unlockedAtFloor: 2, unlockedAtRoom: 3, emoji: '🎩', primaryColor: '#1e1b4b', secondaryColor: '#7c3aed', shapeVariant: 2 },
  { id: 'hat_beret', name: 'Boina', slot: 'hat', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 2, emoji: '🎭', primaryColor: '#065f46', secondaryColor: '#6ee7b7', shapeVariant: 3 },
  { id: 'hat_crown', name: 'Corona', slot: 'hat', gender: 'unisex', unlockedAtFloor: 6, unlockedAtRoom: 1, emoji: '👑', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 4 },
  { id: 'hat_cat_ears', name: 'Orejas de Gato', slot: 'hat', gender: 'girl', unlockedAtFloor: 8, unlockedAtRoom: 3, emoji: '🐱', primaryColor: '#1e293b', secondaryColor: '#94a3b8', shapeVariant: 1 },
  { id: 'hat_flowers', name: 'Diadema de Flores', slot: 'hat', gender: 'girl', unlockedAtFloor: 11, unlockedAtRoom: 2, emoji: '🌸', primaryColor: '#ec4899', secondaryColor: '#fde68a', shapeVariant: 2 },

  // ── WINGS (4) ───────────────────────────────────────────────
  { id: 'wings_fairy', name: 'Alas de Hada', slot: 'wings', gender: 'girl', unlockedAtFloor: 2, unlockedAtRoom: 1, emoji: '🧚', primaryColor: '#a5f3fc', secondaryColor: '#e0f2fe', shapeVariant: 1 },
  { id: 'wings_bat', name: 'Alas de Murciélago', slot: 'wings', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 3, emoji: '🦇', primaryColor: '#1e1b4b', secondaryColor: '#4c1d95', shapeVariant: 2 },
  { id: 'wings_butterfly', name: 'Alas de Mariposa', slot: 'wings', gender: 'girl', unlockedAtFloor: 7, unlockedAtRoom: 1, emoji: '🦋', primaryColor: '#f59e0b', secondaryColor: '#ec4899', shapeVariant: 3 },
  { id: 'wings_angel', name: 'Alas de Ángel', slot: 'wings', gender: 'unisex', unlockedAtFloor: 9, unlockedAtRoom: 2, emoji: '😇', primaryColor: '#ffffff', secondaryColor: '#fde68a', shapeVariant: 4 },

  // ── ACCESSORIES (9) ─────────────────────────────────────────
  { id: 'acc_space_bag', name: 'Mochila Espacial', slot: 'accessory', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 3, emoji: '🎒', primaryColor: '#1e3a5f', secondaryColor: '#60a5fa', shapeVariant: 1 },
  { id: 'acc_star_bag', name: 'Mochila de Estrellas', slot: 'accessory', gender: 'girl', unlockedAtFloor: 3, unlockedAtRoom: 1, emoji: '⭐', primaryColor: '#7c3aed', secondaryColor: '#fde68a', shapeVariant: 2 },
  { id: 'acc_wand', name: 'Varita Decorativa', slot: 'accessory', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 3, emoji: '🪄', primaryColor: '#1e1b4b', secondaryColor: '#f59e0b', shapeVariant: 3 },
  { id: 'acc_book', name: 'Libro Flotante', slot: 'accessory', gender: 'unisex', unlockedAtFloor: 6, unlockedAtRoom: 2, emoji: '📚', primaryColor: '#7f1d1d', secondaryColor: '#fde68a', shapeVariant: 4 },
  { id: 'acc_shield', name: 'Escudo Mágico', slot: 'accessory', gender: 'boy', unlockedAtFloor: 7, unlockedAtRoom: 3, emoji: '🛡️', primaryColor: '#1e3a8a', secondaryColor: '#f59e0b', shapeVariant: 1 },
  { id: 'acc_scarf', name: 'Bufanda de Rayas', slot: 'accessory', gender: 'unisex', unlockedAtFloor: 8, unlockedAtRoom: 1, emoji: '🧣', primaryColor: '#dc2626', secondaryColor: '#fde68a', shapeVariant: 2 },
  { id: 'acc_star_necklace', name: 'Collar de Estrellas', slot: 'accessory', gender: 'girl', unlockedAtFloor: 9, unlockedAtRoom: 3, emoji: '⭐', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 3 },
  { id: 'acc_bracelet', name: 'Pulsera Mágica', slot: 'accessory', gender: 'girl', unlockedAtFloor: 10, unlockedAtRoom: 2, emoji: '✨', primaryColor: '#7c3aed', secondaryColor: '#c4b5fd', shapeVariant: 4 },
  { id: 'acc_lantern', name: 'Linterna Mágica', slot: 'accessory', gender: 'unisex', unlockedAtFloor: 11, unlockedAtRoom: 3, emoji: '🔦', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 1 },

  // ── OUTFITS (12 floors × top+bottom+shoes) ──────────────────
  // Floor 1 — Aprendiz Clásico
  { id: 'top_1', name: 'Sudadera Azul', slot: 'top', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 4, emoji: '👕', primaryColor: '#1d4ed8', secondaryColor: '#93c5fd', shapeVariant: 1 },
  { id: 'bottom_1', name: 'Vaqueros Clásicos', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 4, emoji: '👖', primaryColor: '#1e40af', secondaryColor: '#93c5fd', shapeVariant: 1 },
  { id: 'shoes_1', name: 'Zapatillas Blancas', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 1, unlockedAtRoom: 4, emoji: '👟', primaryColor: '#ffffff', secondaryColor: '#94a3b8', shapeVariant: 1 },
  // Floor 2 — Lector Mágico
  { id: 'top_2', name: 'Jersey de Biblioteca', slot: 'top', gender: 'unisex', unlockedAtFloor: 2, unlockedAtRoom: 4, emoji: '🧶', primaryColor: '#78350f', secondaryColor: '#d97706', shapeVariant: 2 },
  { id: 'bottom_2', name: 'Pantalón Marrón Clásico', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 2, unlockedAtRoom: 4, emoji: '🟫', primaryColor: '#451a03', secondaryColor: '#78350f', shapeVariant: 2 },
  { id: 'shoes_2', name: 'Mocasines', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 2, unlockedAtRoom: 4, emoji: '🥿', primaryColor: '#292524', secondaryColor: '#78350f', shapeVariant: 2 },
  // Floor 3 — Científico Loco
  { id: 'top_3', name: 'Bata de Laboratorio', slot: 'top', gender: 'unisex', unlockedAtFloor: 3, unlockedAtRoom: 4, emoji: '🥼', primaryColor: '#ffffff', secondaryColor: '#a7f3d0', shapeVariant: 3 },
  { id: 'bottom_3', name: 'Leggings Verdes', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 3, unlockedAtRoom: 4, emoji: '💚', primaryColor: '#064e3b', secondaryColor: '#6ee7b7', shapeVariant: 3 },
  { id: 'shoes_3', name: 'Botas de Goma', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 3, unlockedAtRoom: 4, emoji: '👢', primaryColor: '#10b981', secondaryColor: '#6ee7b7', shapeVariant: 3 },
  // Floor 4 — Explorador del Jardín
  { id: 'top_4', name: 'Chaleco Verde', slot: 'top', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 4, emoji: '🦺', primaryColor: '#166534', secondaryColor: '#86efac', shapeVariant: 4 },
  { id: 'bottom_4', name: 'Shorts Exploradores', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 4, emoji: '🩳', primaryColor: '#92400e', secondaryColor: '#d97706', shapeVariant: 4 },
  { id: 'shoes_4', name: 'Sandalias', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 4, unlockedAtRoom: 4, emoji: '👡', primaryColor: '#b45309', secondaryColor: '#fde68a', shapeVariant: 4 },
  // Floor 5 — Artista Misterioso
  { id: 'top_5', name: 'Camiseta Marco Dorado', slot: 'top', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 4, emoji: '🖼️', primaryColor: '#0f172a', secondaryColor: '#f59e0b', shapeVariant: 1 },
  { id: 'bottom_5', name: 'Pantalón Elegante Negro', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 4, emoji: '🖤', primaryColor: '#1e293b', secondaryColor: '#475569', shapeVariant: 1 },
  { id: 'shoes_5', name: 'Zapatos Charol', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 5, unlockedAtRoom: 4, emoji: '👞', primaryColor: '#0f172a', secondaryColor: '#475569', shapeVariant: 1 },
  // Floor 6 — Hechicero del Aula
  { id: 'top_6', name: 'Uniforme Mágico Estrellado', slot: 'top', gender: 'unisex', unlockedAtFloor: 6, unlockedAtRoom: 4, emoji: '⭐', primaryColor: '#1e1b4b', secondaryColor: '#f59e0b', shapeVariant: 2 },
  { id: 'bottom_6', name: 'Falda/Pantalón de Hechicero', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 6, unlockedAtRoom: 4, emoji: '🌟', primaryColor: '#0f172a', secondaryColor: '#1e293b', shapeVariant: 2 },
  { id: 'shoes_6', name: 'Zapatos con Hebilla', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 6, unlockedAtRoom: 4, emoji: '👠', primaryColor: '#0f172a', secondaryColor: '#f59e0b', shapeVariant: 2 },
  // Floor 7 — Mecánico del Tiempo
  { id: 'top_7', name: 'Mono de Engranajes Dorado', slot: 'top', gender: 'unisex', unlockedAtFloor: 7, unlockedAtRoom: 4, emoji: '⚙️', primaryColor: '#d97706', secondaryColor: '#fde68a', shapeVariant: 3 },
  { id: 'bottom_7', name: 'Pantalón con Herramientas', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 7, unlockedAtRoom: 4, emoji: '🔧', primaryColor: '#78350f', secondaryColor: '#d97706', shapeVariant: 3 },
  { id: 'shoes_7', name: 'Botas de Hierro', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 7, unlockedAtRoom: 4, emoji: '🦾', primaryColor: '#374151', secondaryColor: '#9ca3af', shapeVariant: 3 },
  // Floor 8 — Sabio de la Cripta
  { id: 'top_8', name: 'Túnica Oscura con Runas', slot: 'top', gender: 'unisex', unlockedAtFloor: 8, unlockedAtRoom: 4, emoji: '📜', primaryColor: '#1e1b4b', secondaryColor: '#7c3aed', shapeVariant: 4 },
  { id: 'bottom_8', name: 'Pantalón de la Cripta', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 8, unlockedAtRoom: 4, emoji: '🔮', primaryColor: '#0f172a', secondaryColor: '#4c1d95', shapeVariant: 4 },
  { id: 'shoes_8', name: 'Botas Puntiagudas', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 8, unlockedAtRoom: 4, emoji: '🦂', primaryColor: '#0f172a', secondaryColor: '#7c3aed', shapeVariant: 4 },
  // Floor 9 — Astrónomo
  { id: 'top_9', name: 'Traje Azul Galaxia', slot: 'top', gender: 'unisex', unlockedAtFloor: 9, unlockedAtRoom: 4, emoji: '🌌', primaryColor: '#0c1445', secondaryColor: '#60a5fa', shapeVariant: 1 },
  { id: 'bottom_9', name: 'Pantalón Estelar', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 9, unlockedAtRoom: 4, emoji: '🪐', primaryColor: '#020617', secondaryColor: '#1e3a5f', shapeVariant: 1 },
  { id: 'shoes_9', name: 'Zapatillas Luminosas', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 9, unlockedAtRoom: 4, emoji: '✨', primaryColor: '#1e3a5f', secondaryColor: '#60a5fa', shapeVariant: 1 },
  // Floor 10 — Consejero Real
  { id: 'top_10', name: 'Capa Roja con Ribetes', slot: 'top', gender: 'unisex', unlockedAtFloor: 10, unlockedAtRoom: 4, emoji: '🦸', primaryColor: '#991b1b', secondaryColor: '#f59e0b', shapeVariant: 2 },
  { id: 'bottom_10', name: 'Pantalón Real', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 10, unlockedAtRoom: 4, emoji: '👑', primaryColor: '#1e293b', secondaryColor: '#475569', shapeVariant: 2 },
  { id: 'shoes_10', name: 'Zapatos Charol Dorado', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 10, unlockedAtRoom: 4, emoji: '👞', primaryColor: '#78350f', secondaryColor: '#fde68a', shapeVariant: 2 },
  // Floor 11 — Jinete de Nubes
  { id: 'top_11', name: 'Chaqueta Vaporosa Blanca', slot: 'top', gender: 'unisex', unlockedAtFloor: 11, unlockedAtRoom: 4, emoji: '☁️', primaryColor: '#f0f9ff', secondaryColor: '#bae6fd', shapeVariant: 3 },
  { id: 'bottom_11', name: 'Pantalón Celeste Nube', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 11, unlockedAtRoom: 4, emoji: '🌤️', primaryColor: '#bfdbfe', secondaryColor: '#ede9fe', shapeVariant: 3 },
  { id: 'shoes_11', name: 'Zapatillas con Nubes', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 11, unlockedAtRoom: 4, emoji: '🌈', primaryColor: '#ffffff', secondaryColor: '#bae6fd', shapeVariant: 3 },
  // Floor 12 — Mago Supremo
  { id: 'top_12', name: 'Túnica Dorada con Runas', slot: 'top', gender: 'unisex', unlockedAtFloor: 12, unlockedAtRoom: 4, emoji: '🪄', primaryColor: '#f59e0b', secondaryColor: '#fde68a', shapeVariant: 4 },
  { id: 'bottom_12', name: 'Pantalón Mago Supremo', slot: 'bottom', gender: 'unisex', unlockedAtFloor: 12, unlockedAtRoom: 4, emoji: '⚡', primaryColor: '#0f172a', secondaryColor: '#7c3aed', shapeVariant: 4 },
  { id: 'shoes_12', name: 'Botas Mágicas con Estrellas', slot: 'shoes', gender: 'unisex', unlockedAtFloor: 12, unlockedAtRoom: 4, emoji: '🌠', primaryColor: '#0f172a', secondaryColor: '#f59e0b', shapeVariant: 4 },
]

export const getSkinsBySlot = (slot) => SKINS.filter((s) => s.slot === slot)
export const getSkinById = (id) => SKINS.find((s) => s.id === id)
export const getOutfitForFloor = (floor) => SKINS.filter((s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === 4)
export const getAccessoryForFloorRoom = (floor, room) =>
  SKINS.find((s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === room && s.unlockedAtRoom < 4)
