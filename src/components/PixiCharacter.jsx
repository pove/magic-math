import { useEffect, useRef, useCallback } from 'react'
import { Application, Graphics, Container, FillGradient, ColorMatrixFilter } from 'pixi.js'
import { getSkinById } from '../data/skins'

const SKIN_LIGHT = 0xfddba8
const SKIN_MID   = 0xf9c584
const SKIN_DARK  = 0xe8a96b

function hexNum(str) {
  if (!str) return 0xffffff
  return parseInt(str.replace('#', ''), 16)
}
function darkenNum(hex, amt = 0.26) {
  const r = Math.max(0, ((hex >> 16) & 0xff) - Math.round(255 * amt))
  const g = Math.max(0, ((hex >> 8)  & 0xff) - Math.round(255 * amt))
  const b = Math.max(0,  (hex        & 0xff) - Math.round(255 * amt))
  return (r << 16) | (g << 8) | b
}
function lg(x0, y0, x1, y1, c1, c2) {
  const g = new FillGradient(x0, y0, x1, y1)
  g.addColorStop(0, c1); g.addColorStop(1, c2)
  return g
}

// ── WINGS ────────────────────────────────────────────────────────────────────
function drawWings(g, skin) {
  if (!skin) return
  const c1 = hexNum(skin.primaryColor)
  const c2 = hexNum(skin.secondaryColor)
  const v  = skin.shapeVariant
  if (v === 1) {
    g.ellipse(32, 185, 26, 48); g.fill({ color: c1, alpha: 0.85 })
    g.ellipse(168, 185, 26, 48); g.fill({ color: c1, alpha: 0.85 })
    g.ellipse(32, 185, 15, 31); g.fill({ color: c2, alpha: 0.5 })
    g.ellipse(168, 185, 15, 31); g.fill({ color: c2, alpha: 0.5 })
  } else if (v === 2) {
    g.moveTo(58,188).bezierCurveTo(18,148,13,202,53,222).lineTo(58,188); g.fill({ color: c1, alpha: 0.9 })
    g.moveTo(142,188).bezierCurveTo(182,148,187,202,147,222).lineTo(142,188); g.fill({ color: c1, alpha: 0.9 })
    g.moveTo(58,188).bezierCurveTo(28,162,24,205,52,222).lineTo(58,188); g.fill({ color: c2, alpha: 0.35 })
    g.moveTo(142,188).bezierCurveTo(172,162,176,205,148,222).lineTo(142,188); g.fill({ color: c2, alpha: 0.35 })
  } else if (v === 3) {
    g.ellipse(32, 185, 31, 53); g.fill({ color: c1, alpha: 0.85 })
    g.ellipse(168, 185, 31, 53); g.fill({ color: c1, alpha: 0.85 })
    g.ellipse(32, 202, 21, 33); g.fill({ color: c2, alpha: 0.75 })
    g.ellipse(168, 202, 21, 33); g.fill({ color: c2, alpha: 0.75 })
  } else {
    g.ellipse(32, 187, 29, 44); g.fill({ color: c1, alpha: 0.9 })
    g.ellipse(168, 187, 29, 44); g.fill({ color: c1, alpha: 0.9 })
    g.moveTo(36,163).lineTo(55,190).lineTo(36,217).closePath(); g.fill({ color: c2, alpha: 0.6 })
    g.moveTo(164,163).lineTo(145,190).lineTo(164,217).closePath(); g.fill({ color: c2, alpha: 0.6 })
  }
}

// ── SHOES ────────────────────────────────────────────────────────────────────
function drawShoes(g, skin) {
  const c1  = skin ? hexNum(skin.primaryColor)   : 0xffffff
  const c2  = skin ? hexNum(skin.secondaryColor) : 0x94a3b8
  const c1d = darkenNum(c1)
  const v   = skin?.shapeVariant || 1
  const gL  = lg(72, 305, 72, 328, c1, c1d)
  const gR  = lg(128, 305, 128, 328, c1, c1d)
  g.ellipse(72,323,23,11);  g.fill({ color: c1d })
  g.ellipse(128,323,23,11); g.fill({ color: c1d })
  if (v === 2) {
    g.roundRect(54,305,36,20,7); g.fill(gL)
    g.roundRect(110,305,36,20,7); g.fill(gR)
    g.roundRect(57,308,30,6,3); g.fill({ color: c2, alpha: 0.5 })
    g.roundRect(113,308,30,6,3); g.fill({ color: c2, alpha: 0.5 })
  } else if (v === 3) {
    g.roundRect(54,302,36,24,5); g.fill(gL)
    g.roundRect(110,302,36,24,5); g.fill(gR)
  } else if (v === 4) {
    g.roundRect(53,305,38,19,9); g.fill(gL)
    g.roundRect(109,305,38,19,9); g.fill(gR)
    g.ellipse(72,311,3.5,3.5); g.fill({ color: c2, alpha: 0.7 })
    g.ellipse(128,311,3.5,3.5); g.fill({ color: c2, alpha: 0.7 })
  } else {
    g.roundRect(54,308,36,17,9); g.fill(gL)
    g.roundRect(110,308,36,17,9); g.fill(gR)
  }
}

// ── BOTTOM ───────────────────────────────────────────────────────────────────
function drawBottom(g, skin, gender) {
  const c1  = skin ? hexNum(skin.primaryColor)   : (gender === 'girl' ? 0x4b5563 : 0x1e40af)
  const c2  = skin ? hexNum(skin.secondaryColor) : 0x93c5fd
  const c1d = darkenNum(c1, 0.22)
  const isSkirt = gender === 'girl' && (!skin || skin.shapeVariant <= 2)
  const grd = lg(100, 230, 100, 322, c1, c1d)
  if (isSkirt) {
    g.moveTo(68,232).lineTo(56,322).lineTo(94,322).lineTo(100,272).lineTo(106,322).lineTo(144,322).lineTo(132,232).closePath()
    g.fill(grd)
    g.moveTo(68,232).lineTo(132,232).lineTo(135,243).bezierCurveTo(100,258,65,243,65,243).closePath()
    g.fill({ color: c2, alpha: 0.4 })
    g.moveTo(68,268).bezierCurveTo(100,278,132,268,132,268)
    g.stroke({ color: c2, width: 1.5, alpha: 0.35 })
  } else {
    g.roundRect(67,230,66,92,6); g.fill(grd)
    g.moveTo(100,230).lineTo(100,322); g.stroke({ color: c2, width: 2, alpha: 0.28 })
    g.roundRect(67,230,10,92,4); g.fill({ color: c2, alpha: 0.07 })
  }
}

// ── TOP ──────────────────────────────────────────────────────────────────────
function drawTop(g, skin, gender) {
  const c1  = skin ? hexNum(skin.primaryColor)   : (gender === 'boy' ? 0x1d4ed8 : 0xec4899)
  const c2  = skin ? hexNum(skin.secondaryColor) : 0x93c5fd
  const c1d = darkenNum(c1, 0.22)
  const v   = skin?.shapeVariant || 1
  const grd = lg(100, 167, 100, 232, c1, c1d)
  const gSL = lg(57, 197, 57, 233, c1, c1d)
  const gSR = lg(143,197,143,233, c1, c1d)

  const torso = (fill) => {
    g.moveTo(60,178).bezierCurveTo(50,183,48,232,48,232)
    g.lineTo(152,232).bezierCurveTo(150,183,140,178,140,178)
    g.lineTo(120,167).lineTo(80,167).closePath(); g.fill(fill)
  }

  if (v === 2) {
    torso(grd)
    g.moveTo(80,167).quadraticCurveTo(100,178,120,167); g.stroke({ color: c2, width: 3 })
    g.roundRect(48,197,18,36,7); g.fill(gSL)
    g.roundRect(134,197,18,36,7); g.fill(gSR)
  } else if (v === 3) {
    torso(0xffffff)
    g.roundRect(48,197,18,36,7); g.fill({ color: 0xffffff })
    g.roundRect(134,197,18,36,7); g.fill({ color: 0xffffff })
    torso({ color: c1, alpha: 0.22 })
    g.ellipse(100,197,4.5,4.5); g.fill({ color: c2 })
    g.ellipse(100,213,4.5,4.5); g.fill({ color: c2 })
  } else if (v === 4) {
    torso(grd)
    g.moveTo(80,167).lineTo(100,232).lineTo(120,167).closePath(); g.fill({ color: c2, alpha: 0.4 })
    g.roundRect(48,197,18,36,7); g.fill(gSL)
    g.roundRect(134,197,18,36,7); g.fill(gSR)
  } else {
    torso(grd)
    g.roundRect(48,197,18,36,7); g.fill(gSL)
    g.roundRect(134,197,18,36,7); g.fill(gSR)
    g.moveTo(82,167).quadraticCurveTo(100,175,118,167); g.stroke({ color: c2, width: 2.5, alpha: 0.5 })
  }
  torso({ color: 0xffffff, alpha: 0.07 })
}

// ── HAIR BACK ────────────────────────────────────────────────────────────────
function drawHairBack(g, skin, gender) {
  if (gender !== 'girl') return
  const c1  = skin ? hexNum(skin.primaryColor)   : 0x5d3a1a
  const c2  = skin ? hexNum(skin.secondaryColor) : 0x7b4f2e
  const grd = lg(100, 50, 100, 186, c1, darkenNum(c1, 0.2))
  g.moveTo(42,108).bezierCurveTo(32,148,36,186,52,175).bezierCurveTo(48,150,54,124,54,108).closePath(); g.fill(grd)
  g.moveTo(158,108).bezierCurveTo(168,148,164,186,148,175).bezierCurveTo(152,150,146,124,146,108).closePath(); g.fill(grd)
  g.ellipse(44,170,15,15); g.fill(grd)
  g.ellipse(156,170,15,15); g.fill(grd)
  g.ellipse(44,170,8,8);   g.fill({ color: c2, alpha: 0.55 })
  g.ellipse(156,170,8,8);  g.fill({ color: c2, alpha: 0.55 })
}

// ── BODY BASE ────────────────────────────────────────────────────────────────
function drawBody(g, gender, eyeScaleY = 1, mouthOpen = 0) {
  // ground shadow
  g.ellipse(100,343,48,7); g.fill({ color: 0x000000, alpha: 0.13 })

  // neck
  g.roundRect(87,158,26,24,5); g.fill({ color: SKIN_MID })

  // head base
  g.ellipse(100,108,58,63); g.fill({ color: SKIN_MID })
  // light highlight — upper-left to simulate radial gradient
  g.ellipse(82,88,36,30); g.fill({ color: SKIN_LIGHT, alpha: 0.65 })
  // edge darkening
  g.ellipse(100,108,58,63); g.fill({ color: SKIN_DARK, alpha: 0.08 })

  // ears
  g.ellipse(42,112,9,12);  g.fill({ color: SKIN_MID })
  g.ellipse(158,112,9,12); g.fill({ color: SKIN_MID })
  g.ellipse(42,114,5,7);   g.fill({ color: SKIN_DARK, alpha: 0.3 })
  g.ellipse(158,114,5,7);  g.fill({ color: SKIN_DARK, alpha: 0.3 })

  // eye whites
  g.ellipse(78, 103,15,16*eyeScaleY); g.fill({ color: 0xffffff })
  g.ellipse(122,103,15,16*eyeScaleY); g.fill({ color: 0xffffff })
  g.ellipse(78, 97, 14,7);  g.fill({ color: 0xcbd5e1, alpha: 0.4 })
  g.ellipse(122,97, 14,7);  g.fill({ color: 0xcbd5e1, alpha: 0.4 })

  // iris
  const ih = 10 * eyeScaleY
  g.ellipse(81, 106,10,ih);  g.fill({ color: 0x4a5568 })
  g.ellipse(119,106,10,ih);  g.fill({ color: 0x4a5568 })
  // pupil
  g.ellipse(81, 106,5.5,5.5*eyeScaleY); g.fill({ color: 0x0f172a })
  g.ellipse(119,106,5.5,5.5*eyeScaleY); g.fill({ color: 0x0f172a })
  // highlights
  g.ellipse(85, 101,4.5,4.5); g.fill({ color: 0xffffff, alpha: 0.92 })
  g.ellipse(123,101,4.5,4.5); g.fill({ color: 0xffffff, alpha: 0.92 })
  g.ellipse(78, 109,2,2);     g.fill({ color: 0xffffff, alpha: 0.5 })
  g.ellipse(116,109,2,2);     g.fill({ color: 0xffffff, alpha: 0.5 })

  // eyebrows
  if (gender === 'girl') {
    g.moveTo(66,88).quadraticCurveTo(78,83,88,87);   g.stroke({ color: 0x5d3a1a, width: 2.5 })
    g.moveTo(112,87).quadraticCurveTo(122,83,134,88); g.stroke({ color: 0x5d3a1a, width: 2.5 })
    ;[[68,90,66,86],[73,87,72,83],[78,85,78,81],[83,86,84,82],[88,89,90,85],
      [112,89,110,85],[117,87,116,83],[122,85,122,81],[127,86,128,82],[132,89,134,85]
    ].forEach(([x1,y1,x2,y2]) => { g.moveTo(x1,y1).lineTo(x2,y2); g.stroke({ color: 0x1e293b, width: 1.5 }) })
  } else {
    g.moveTo(66,88).quadraticCurveTo(78,82,88,86);    g.stroke({ color: 0x3d2008, width: 3.5 })
    g.moveTo(112,86).quadraticCurveTo(122,82,134,88); g.stroke({ color: 0x3d2008, width: 3.5 })
  }

  // nose
  g.ellipse(96, 122,3,2.5); g.fill({ color: SKIN_DARK, alpha: 0.65 })
  g.ellipse(104,122,3,2.5); g.fill({ color: SKIN_DARK, alpha: 0.65 })

  // mouth
  if (mouthOpen >= 0) {
    const my = 135 + mouthOpen * 4
    if (mouthOpen > 0.3) {
      g.moveTo(87,my+2).bezierCurveTo(94,148,106,148,113,my+2).closePath(); g.fill({ color: 0x7f1d1d, alpha: 0.7 })
      g.moveTo(87,my+2).bezierCurveTo(94,143,106,143,113,my+2).closePath(); g.fill({ color: 0xffffff, alpha: 0.9 })
    }
    g.moveTo(83,my).bezierCurveTo(91,150+mouthOpen*3,109,150+mouthOpen*3,117,my)
    g.stroke({ color: 0xc2705a, width: 3.5 })
  } else {
    g.moveTo(83,142).bezierCurveTo(91,132,109,132,117,142); g.stroke({ color: 0xc2705a, width: 3.5 })
  }

  // cheeks
  g.ellipse(62, 126,13,9); g.fill({ color: 0xf9a8a8, alpha: 0.38 })
  g.ellipse(138,126,13,9); g.fill({ color: 0xf9a8a8, alpha: 0.38 })

  // arms
  g.moveTo(58,180).bezierCurveTo(38,207,36,244,36,244).lineTo(54,246).bezierCurveTo(54,217,66,192,66,192).closePath()
  g.fill({ color: SKIN_LIGHT })
  g.moveTo(142,180).bezierCurveTo(162,207,164,244,164,244).lineTo(146,246).bezierCurveTo(146,217,134,192,134,192).closePath()
  g.fill({ color: SKIN_LIGHT })

  // hands
  g.ellipse(36, 250,14,11); g.fill({ color: SKIN_MID })
  g.ellipse(164,250,14,11); g.fill({ color: SKIN_MID })
  ;[[27,246,5.5,4.5],[36,242,5.5,4.5],[45,246,5.5,4.5],
    [155,246,5.5,4.5],[164,242,5.5,4.5],[173,246,5.5,4.5]
  ].forEach(([cx,cy,rx,ry]) => { g.ellipse(cx,cy,rx,ry); g.fill({ color: SKIN_MID }) })
}

// ── HAIR FRONT ───────────────────────────────────────────────────────────────
// NOTE: drawn into a masked container — only y < 91 is visible
function drawHairFront(g, skin, gender) {
  const c1  = skin ? hexNum(skin.primaryColor)   : 0x5d3a1a
  const c2  = skin ? hexNum(skin.secondaryColor) : 0x7b4f2e
  const grd = lg(100, 40, 100, 91, c1, darkenNum(c1, 0.15))
  if (gender === 'girl') {
    g.ellipse(100,86,60,44); g.fill(grd)
    g.ellipse(100,63,57,20); g.fill(grd)
    g.ellipse(85,68,18,8);   g.fill({ color: 0xffffff, alpha: 0.12 })
  } else {
    g.ellipse(100,84,58,38); g.fill(grd)
    g.ellipse(100,62,56,18); g.fill(grd)
    g.moveTo(58,80).bezierCurveTo(50,68,54,57,70,63).lineTo(65,80).closePath(); g.fill(grd)
    g.moveTo(142,80).bezierCurveTo(150,68,146,57,130,63).lineTo(135,80).closePath(); g.fill(grd)
    g.moveTo(86,60).quadraticCurveTo(93,50,100,56);  g.stroke({ color: c2, width: 2.5, alpha: 0.5 })
    g.moveTo(100,56).quadraticCurveTo(107,50,114,60); g.stroke({ color: c2, width: 2,   alpha: 0.38 })
    g.ellipse(90,68,20,7); g.fill({ color: 0xffffff, alpha: 0.09 })
  }
}

// ── HAT ──────────────────────────────────────────────────────────────────────
function drawHat(g, skin) {
  if (!skin) return
  const c1  = hexNum(skin.primaryColor)
  const c2  = hexNum(skin.secondaryColor)
  const c1d = darkenNum(c1, 0.2)
  const v   = skin.shapeVariant
  const grd = lg(100, 22, 100, 88, c1, c1d)
  if (v === 1) {
    g.roundRect(60,46,80,38,9); g.fill(grd)
    g.roundRect(50,82,100,12,6); g.fill({ color: c2 })
    g.moveTo(70,46).quadraticCurveTo(100,30,130,46).closePath(); g.fill(grd)
    g.ellipse(100,58,26,8); g.fill({ color: 0xffffff, alpha: 0.1 })
  } else if (v === 2) {
    g.roundRect(72,26,56,47,5); g.fill(grd)
    g.roundRect(55,70,90,11,5);  g.fill({ color: c2 })
    g.ellipse(100,50,7,7);      g.fill({ color: c2, alpha: 0.8 })
    g.roundRect(72,26,56,10,4);  g.fill({ color: 0xffffff, alpha: 0.1 })
  } else if (v === 3) {
    g.ellipse(100,64,52,19); g.fill(grd)
    g.ellipse(100,50,36,28); g.fill(grd)
    g.ellipse(100,45,24,11);  g.fill({ color: 0xffffff, alpha: 0.1 })
  } else {
    g.moveTo(62,76).lineTo(74,36).quadraticCurveTo(100,22,126,36).lineTo(138,76).closePath(); g.fill(grd)
    g.roundRect(52,74,96,12,6); g.fill({ color: c2 })
    g.ellipse(100,36,7,7);      g.fill({ color: c2 })
    g.ellipse(100,52,17,6);     g.fill({ color: 0xffffff, alpha: 0.1 })
  }
}

// ── GLASSES ──────────────────────────────────────────────────────────────────
function drawGlasses(g, skin) {
  if (!skin) return
  const c1 = hexNum(skin.primaryColor)
  const c2 = hexNum(skin.secondaryColor)
  const v  = skin.shapeVariant
  if (v === 1) {
    g.ellipse(79, 105,15,15); g.fill({ color: c2, alpha: 0.18 }); g.stroke({ color: c1, width: 3 })
    g.ellipse(121,105,15,15); g.fill({ color: c2, alpha: 0.18 }); g.stroke({ color: c1, width: 3 })
    g.moveTo(94,105).lineTo(106,105);   g.stroke({ color: c1, width: 2.5 })
    g.moveTo(64,103).lineTo(56,100);    g.stroke({ color: c1, width: 2.5 })
    g.moveTo(136,103).lineTo(144,100);  g.stroke({ color: c1, width: 2.5 })
  } else if (v === 2) {
    g.moveTo(79,117).bezierCurveTo(65,117,62,103,65,98).bezierCurveTo(65,91,74,89,79,95).bezierCurveTo(84,89,93,91,93,98).bezierCurveTo(96,103,93,117,79,117).closePath()
    g.fill({ color: c2, alpha: 0.18 }); g.stroke({ color: c1, width: 3 })
    g.moveTo(121,117).bezierCurveTo(107,117,104,103,107,98).bezierCurveTo(107,91,116,89,121,95).bezierCurveTo(126,89,135,91,135,98).bezierCurveTo(138,103,135,117,121,117).closePath()
    g.fill({ color: c2, alpha: 0.18 }); g.stroke({ color: c1, width: 3 })
    g.moveTo(93,107).lineTo(107,107); g.stroke({ color: c1, width: 2.5 })
    g.moveTo(65,103).lineTo(56,100);  g.stroke({ color: c1, width: 2.5 })
    g.moveTo(135,103).lineTo(144,100); g.stroke({ color: c1, width: 2.5 })
  } else if (v === 3) {
    // 5-pointed star frames
    g.star(79,  103, 5, 14, 6); g.fill({ color: c2, alpha: 0.25 }); g.stroke({ color: c1, width: 2.5 })
    g.star(121, 103, 5, 14, 6); g.fill({ color: c2, alpha: 0.25 }); g.stroke({ color: c1, width: 2.5 })
    g.moveTo(93, 103).lineTo(107, 103); g.stroke({ color: c1, width: 2.5 })
    g.moveTo(65, 103).lineTo(57,  100); g.stroke({ color: c1, width: 2.5 })
    g.moveTo(135,103).lineTo(143, 100); g.stroke({ color: c1, width: 2.5 })
  } else {
    g.roundRect(64,97,30,24,6);  g.fill({ color: c2, alpha: 0.22 }); g.stroke({ color: c1, width: 2.5 })
    g.roundRect(106,97,30,24,6); g.fill({ color: c2, alpha: 0.22 }); g.stroke({ color: c1, width: 2.5 })
    g.moveTo(94,109).lineTo(106,109); g.stroke({ color: c1, width: 2.5 })
  }
}

// ── ACCESSORY ────────────────────────────────────────────────────────────────
function drawAccessory(g, skin) {
  if (!skin || skin.slot !== 'accessory') return
  const c1 = hexNum(skin.primaryColor)
  const c2 = hexNum(skin.secondaryColor)
  const v  = skin.shapeVariant
  if (v === 1) {
    g.roundRect(130,185,28,36,5); g.fill({ color: c1 })
    g.roundRect(133,188,22,22,3); g.fill({ color: c2, alpha: 0.5 })
    g.moveTo(136,177).quadraticCurveTo(144,171,152,177); g.stroke({ color: c1, width: 3 })
  } else if (v === 2) {
    g.roundRect(130,185,28,36,5); g.fill({ color: c1 })
    g.ellipse(144,203,8,8);       g.fill({ color: c2, alpha: 0.8 })
    g.moveTo(136,177).quadraticCurveTo(144,171,152,177); g.stroke({ color: c1, width: 3 })
  } else if (v === 3) {
    g.roundRect(155,195,6,50,3); g.fill({ color: c2 })
    g.ellipse(158,192,8,8);      g.fill({ color: c1 })
    g.ellipse(158,192,4,4);      g.fill({ color: c2, alpha: 0.8 })
  } else {
    g.roundRect(128,190,22,28,3); g.fill({ color: c1 })
    g.roundRect(132,186,14,8,2);  g.fill({ color: c2 })
    g.roundRect(130,195,18,2,0);  g.fill({ color: c2, alpha: 0.4 })
    g.roundRect(130,202,18,2,0);  g.fill({ color: c2, alpha: 0.4 })
  }
}

// ── PARTICLES ────────────────────────────────────────────────────────────────
function createParticles(container, count = 12) {
  const colors = [0xf59e0b, 0xec4899, 0x60a5fa, 0x34d399, 0xfde68a]
  return Array.from({ length: count }, (_, i) => {
    const g = new Graphics()
    g.star(0, 0, 5, 6, 3); g.fill({ color: colors[i % colors.length] })
    g.x = 100; g.y = 150; g.alpha = 0
    container.addChild(g)
    return { g, angle: (i / count) * Math.PI * 2, speed: 1.5 + Math.random() * 1.5, life: 0 }
  })
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PixiCharacter({
  gender = 'boy',
  equippedSkins = {},
  animationState = 'idle',
  size = 200,
}) {
  const containerRef = useRef(null)
  const appRef       = useRef(null)
  const stateRef     = useRef({
    animState: animationState,
    t: 0,
    blinkTimer: 3 + Math.random() * 2.5,
    eyeScaleY: 1,
    mouthOpen: 0,
    offsetY: 0, offsetX: 0,
    scale: 1, rotation: 0,
    phaseT: 0,
    particles: [],
    particleContainer: null,
    rainbowActive: false,
  })
  const layersRef = useRef({})
  const scale = size / 200

  const redrawSkins = useCallback(() => {
    const L = layersRef.current
    if (!L.body) return
    const sr = stateRef.current
    L.wings?.clear();     drawWings(L.wings, getSkinById(equippedSkins.wings))
    L.shoes?.clear();     drawShoes(L.shoes, getSkinById(equippedSkins.shoes))
    L.bottom?.clear();    drawBottom(L.bottom, getSkinById(equippedSkins.bottom), gender)
    L.top?.clear();       drawTop(L.top, getSkinById(equippedSkins.top), gender)
    L.hairBack?.clear();  drawHairBack(L.hairBack, getSkinById(equippedSkins.hair), gender)
    L.body.clear();       drawBody(L.body, gender, sr.eyeScaleY, sr.mouthOpen)
    L.hairFront?.clear(); drawHairFront(L.hairFront, getSkinById(equippedSkins.hair), gender)
    L.hat?.clear();       drawHat(L.hat, getSkinById(equippedSkins.hat))
    L.glasses?.clear();   drawGlasses(L.glasses, getSkinById(equippedSkins.glasses))
    L.accessory?.clear(); drawAccessory(L.accessory, getSkinById(equippedSkins.accessory))
  }, [gender, equippedSkins])

  // Mount Pixi once
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed    = false
    let initComplete = false

    const app = new Application()
    appRef.current = app

    app.init({
      width: 200, height: 350,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (destroyed) {
        try { app.destroy({ removeView: true }, { children: true }) } catch (_) {}
        return
      }
      initComplete = true
      containerRef.current.appendChild(app.canvas)
      app.canvas.style.width  = `${200 * scale}px`
      app.canvas.style.height = `${350 * scale}px`

      // root container — whole character animates on this
      const root = new Container()
      root.pivot.set(100, 175)
      root.position.set(100, 175)
      app.stage.addChild(root)

      // ── build layers ──────────────────────────────────────────────
      const wings     = new Graphics(); root.addChild(wings)
      const shoes     = new Graphics(); root.addChild(shoes)
      const bottom    = new Graphics(); root.addChild(bottom)
      const top       = new Graphics(); root.addChild(top)
      const hairBack  = new Graphics(); root.addChild(hairBack)
      const body      = new Graphics(); root.addChild(body)

      // hair front — needs a clipping mask to match SVG clipPath (y < 91)
      const hairFrontCont = new Container(); root.addChild(hairFrontCont)
      const hairFront     = new Graphics();  hairFrontCont.addChild(hairFront)
      const hairMask      = new Graphics()
      hairMask.rect(0, 0, 200, 91); hairMask.fill({ color: 0xffffff })
      hairFrontCont.addChild(hairMask)
      hairFrontCont.mask = hairMask

      const hat       = new Graphics(); root.addChild(hat)
      const glasses   = new Graphics(); root.addChild(glasses)
      const accessory = new Graphics(); root.addChild(accessory)

      const particleCont = new Container(); root.addChild(particleCont)
      stateRef.current.particleContainer = particleCont

      layersRef.current = { wings, shoes, bottom, top, hairBack, body, hairFront, hat, glasses, accessory, root }

      // initial draw
      const sr = stateRef.current
      drawWings(wings,    getSkinById(equippedSkins.wings))
      drawShoes(shoes,    getSkinById(equippedSkins.shoes))
      drawBottom(bottom,  getSkinById(equippedSkins.bottom), gender)
      drawTop(top,        getSkinById(equippedSkins.top), gender)
      drawHairBack(hairBack, getSkinById(equippedSkins.hair), gender)
      drawBody(body, gender, sr.eyeScaleY, sr.mouthOpen)
      drawHairFront(hairFront, getSkinById(equippedSkins.hair), gender)
      drawHat(hat,        getSkinById(equippedSkins.hat))
      drawGlasses(glasses, getSkinById(equippedSkins.glasses))
      drawAccessory(accessory, getSkinById(equippedSkins.accessory))

      // ── ticker ────────────────────────────────────────────────────
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60
        const sr = stateRef.current
        sr.t += dt
        const anim = sr.animState

        if (anim === 'idle') {
          sr.offsetY  = Math.sin(sr.t * (Math.PI * 2 / 1.8)) * -6
          sr.offsetX  = 0; sr.scale = 1; sr.rotation = 0; sr.mouthOpen = 0
          sr.blinkTimer -= dt
          if (sr.blinkTimer <= 0) {
            sr.eyeScaleY  = 0.08
            setTimeout(() => { if (!destroyed) { sr.eyeScaleY = 1; sr.blinkTimer = 3 + Math.random() * 2.5 } }, 100)
          }

        } else if (anim === 'correctAnswer') {
          const pt = sr.phaseT; sr.phaseT += dt
          if (pt < 0.22) {
            sr.offsetY = -35 * (pt / 0.22); sr.scale = 1 + 0.12 * (pt / 0.22); sr.mouthOpen = 0.8
          } else if (pt < 0.45) {
            const p = (pt - 0.22) / 0.23
            sr.offsetY = -35 * (1 - p); sr.scale = 1 + 0.12 * (1 - p); sr.mouthOpen = 0.8
          } else if (pt < 0.55) {
            sr.offsetY = 0; sr.scale = 1; sr.mouthOpen = 0.5
          } else {
            if (sr.particles.length === 0) sr.particles = createParticles(particleCont, 14)
            if (!sr.particles.some(p => p.life < 1)) {
              sr.animState = 'idle'; sr.phaseT = 0
              sr.particles.forEach(p => p.g.destroy()); sr.particles = []
              particleCont.removeChildren(); sr.mouthOpen = 0
            }
          }
          sr.particles.forEach(p => {
            p.life += dt * 1.4; if (p.life > 1) { p.g.alpha = 0; return }
            const e = 1 - p.life * p.life
            p.g.x = 100 + Math.cos(p.angle) * p.speed * p.life * 55
            p.g.y = 150 + Math.sin(p.angle) * p.speed * p.life * 55 - p.life * 30
            p.g.alpha = e; p.g.scale.set(e * 1.2)
          })

        } else if (anim === 'wrongAnswer') {
          sr.phaseT += dt; const pt = sr.phaseT
          if (pt < 0.39) {
            const cycle = Math.floor(pt / 0.055)
            const amp   = [12,12,8,8,4,4,0][Math.min(cycle,6)]
            sr.offsetX = amp * (cycle % 2 === 0 ? -1 : 1)
            sr.eyeScaleY = 0.2; sr.mouthOpen = -0.5
          } else if (pt < 0.5) {
            sr.eyeScaleY = 1; sr.offsetX = 0; sr.mouthOpen = 0
          } else {
            sr.animState = 'idle'; sr.phaseT = 0
            sr.eyeScaleY = 1; sr.offsetX = 0; sr.mouthOpen = 0
          }

        } else if (anim === 'newSkin') {
          sr.phaseT += dt; const pt = sr.phaseT
          if (pt < 0.25) {
            const p = pt / 0.25; sr.rotation = Math.PI * p; sr.scale = 1 + 0.18 * p; sr.rainbowActive = true
          } else if (pt < 0.5) {
            const p = (pt - 0.25) / 0.25
            sr.rotation = Math.PI + Math.PI * p; sr.scale = 1.18 - 0.18 * p; sr.rainbowActive = p < 0.5
          } else {
            sr.rotation = 0; sr.scale = 1; sr.rainbowActive = false; sr.animState = 'idle'; sr.phaseT = 0
          }

        } else if (anim === 'sad') {
          sr.phaseT += dt; const pt = sr.phaseT; sr.mouthOpen = -1
          if (pt < 0.15) {
            // head droop handled via mouthOpen expression
          } else if (pt < 2.55) {
            sr.rotation = Math.sin((pt - 0.15) * Math.PI / 0.4) * 3 * (Math.PI / 180)
          } else if (pt < 2.75) {
            sr.rotation = 0
          } else {
            sr.animState = 'idle'; sr.phaseT = 0; sr.rotation = 0; sr.mouthOpen = 0
          }
        }

        // apply root transform
        const R = layersRef.current.root
        if (R) { R.x = 100 + sr.offsetX; R.y = 175 + sr.offsetY; R.scale.set(sr.scale); R.rotation = sr.rotation }

        // redraw face every frame (expression changes)
        const B = layersRef.current.body
        if (B) { B.clear(); drawBody(B, gender, Math.max(0.05, sr.eyeScaleY), sr.mouthOpen) }

        // rainbow hue sweep during newSkin
        const hueTargets = [wings, shoes, bottom, top, hairBack, hairFront, hat]
        if (sr.rainbowActive) {
          const cmf = new ColorMatrixFilter(); cmf.hue((sr.t * 360) % 360, false)
          hueTargets.forEach(l => { if (l) l.filters = [cmf] })
        } else {
          hueTargets.forEach(l => { if (l) l.filters = [] })
        }
      })
    })

    return () => {
      destroyed = true
      if (initComplete && appRef.current) {
        try { appRef.current.destroy({ removeView: true }, { children: true }) } catch (_) {}
        appRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync animation state
  useEffect(() => {
    const sr = stateRef.current
    sr.animState = animationState; sr.phaseT = 0
    if (animationState !== 'idle') {
      sr.particles.forEach(p => { try { p.g.destroy() } catch (_) {} })
      sr.particles = []
      stateRef.current.particleContainer?.removeChildren()
    }
    if (animationState === 'idle') {
      sr.offsetX = 0; sr.offsetY = 0; sr.scale = 1; sr.rotation = 0
      sr.mouthOpen = 0; sr.eyeScaleY = 1; sr.rainbowActive = false
    }
  }, [animationState])

  // Redraw skins when equipped items change
  useEffect(() => {
    if (!layersRef.current.body) return
    redrawSkins()
  }, [redrawSkins])

  return (
    <div
      ref={containerRef}
      style={{ display: 'inline-block', width: 200 * scale, height: 350 * scale }}
    />
  )
}
