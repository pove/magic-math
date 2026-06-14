function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateWrongOptions(correct, count, min, max) {
  const wrongs = new Set()
  let attempts = 0
  while (wrongs.size < count && attempts < 200) {
    attempts++
    const delta = rnd(-5, 5)
    const candidate = correct + delta
    if (candidate !== correct && candidate >= min && candidate <= max) {
      wrongs.add(candidate)
    }
  }
  // Fill remaining with random if needed
  while (wrongs.size < count) {
    const candidate = rnd(min, Math.min(max, correct + 10))
    if (candidate !== correct) wrongs.add(candidate)
  }
  return [...wrongs].slice(0, count)
}

function generateWrongOptionsStr(correct, pool) {
  const filtered = pool.filter((v) => v !== correct)
  return shuffle(filtered).slice(0, 5)
}

// ── YOUNG MODE ────────────────────────────────────────────────────────────────

function youngNormal(floor, room) {
  const isBoss = room === 4

  if (floor <= 2) {
    const a = rnd(0, isBoss ? 10 : 8)
    const b = rnd(0, 10 - a)
    const correct = a + b
    const wrongs = generateWrongOptions(correct, 3, 0, 20)
    return {
      questionText: `${a} + ${b} = ?`,
      options: shuffle([correct, ...wrongs]),
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: { type: 'fruits', count: a + b },
      timeLimit: null,
    }
  }

  if (floor === 3) {
    const b = rnd(0, isBoss ? 8 : 6)
    const a = rnd(b, 10)
    const correct = a - b
    const wrongs = generateWrongOptions(correct, 3, 0, 20)
    return {
      questionText: `${a} - ${b} = ?`,
      options: shuffle([correct, ...wrongs]),
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: { type: 'fruits', count: a },
      timeLimit: null,
    }
  }

  if (floor === 4) {
    const a = rnd(0, 15)
    const b = rnd(0, 20 - a)
    const correct = a + b
    const wrongs = generateWrongOptions(correct, 3, 0, 30)
    return {
      questionText: `${a} + ${b} = ?`,
      options: shuffle([correct, ...wrongs]),
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: { type: 'blocks', count: Math.min(a + b, 20) },
      timeLimit: null,
    }
  }

  if (floor === 5) {
    const b = rnd(0, 15)
    const a = rnd(b, 20)
    const correct = a - b
    const wrongs = generateWrongOptions(correct, 3, 0, 30)
    return {
      questionText: `${a} - ${b} = ?`,
      options: shuffle([correct, ...wrongs]),
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: { type: 'blocks', count: Math.min(a, 20) },
      timeLimit: null,
    }
  }

  if (floor === 6) {
    const ops = ['+', '-']
    const op = ops[rnd(0, 1)]
    let a, b, correct
    if (op === '+') {
      a = rnd(0, 15); b = rnd(0, 20 - a); correct = a + b
    } else {
      b = rnd(0, 15); a = rnd(b, 20); correct = a - b
    }
    const wrongs = generateWrongOptions(correct, 3, 0, 30)
    return {
      questionText: `${a} ${op} ${b} = ?`,
      options: shuffle([correct, ...wrongs]),
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: null,
      timeLimit: null,
    }
  }

  if (floor === 7) {
    const a = rnd(0, 20)
    const b = rnd(0, 20)
    let correct
    if (a > b) correct = 'Mayor que'
    else if (a < b) correct = 'Menor que'
    else correct = 'Igual a'
    const opts = shuffle(['Mayor que', 'Menor que', 'Igual a', rnd(0, 1) === 0 ? 'Mayor que' : 'Menor que'].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4))
    const pool = ['Mayor que', 'Menor que', 'Igual a']
    const finalOpts = shuffle([...new Set([correct, ...pool])]).slice(0, 4)
    return {
      questionText: `${a} __ ${b}`,
      options: finalOpts.includes(correct) ? finalOpts : [correct, ...finalOpts.slice(0, 3)],
      correctAnswer: correct,
      interfaceType: '4_options',
      visualAid: null,
      timeLimit: null,
    }
  }

  const max = floor <= 9 ? 30 : 50
  const interfaceType = floor <= 9 ? '6_options' : 'keyboard'
  const opChoice = rnd(0, 2)
  let a, b, correct, questionText
  if (opChoice === 0) {
    a = rnd(0, max - 5); b = rnd(0, max - a); correct = a + b; questionText = `${a} + ${b} = ?`
  } else if (opChoice === 1) {
    b = rnd(0, max - 5); a = rnd(b, max); correct = a - b; questionText = `${a} - ${b} = ?`
  } else {
    a = rnd(0, max); b = rnd(0, max)
    if (a > b) correct = 'Mayor que'
    else if (a < b) correct = 'Menor que'
    else correct = 'Igual a'
    questionText = `${a} __ ${b}`
    const pool2 = ['Mayor que', 'Menor que', 'Igual a']
    const opts2 = shuffle([...new Set([correct, ...pool2])])
    if (interfaceType === 'keyboard') {
      return { questionText, options: opts2.slice(0, 3), correctAnswer: correct, interfaceType: '4_options', visualAid: null, timeLimit: null }
    }
    return { questionText, options: opts2.slice(0, 3), correctAnswer: correct, interfaceType: '4_options', visualAid: null, timeLimit: null }
  }
  const wrongs = generateWrongOptions(correct, interfaceType === '6_options' ? 5 : 0, 0, max + 20)
  if (interfaceType === 'keyboard') {
    return { questionText, options: [], correctAnswer: correct, interfaceType: 'keyboard', visualAid: null, timeLimit: null }
  }
  return {
    questionText,
    options: shuffle([correct, ...wrongs]).slice(0, 6),
    correctAnswer: correct,
    interfaceType: '6_options',
    visualAid: null,
    timeLimit: null,
  }
}

function youngPro(floor, room) {
  const base = youngNormal(floor, room)
  // Extend to 3-term operations on addition/subtraction questions
  if (typeof base.correctAnswer === 'number' && base.questionText.includes('=')) {
    const parts = base.questionText.replace(' = ?', '').split(' ')
    if (parts.length >= 3) {
      const c = rnd(1, 5)
      const newOp = rnd(0, 1) === 0 ? '+' : '-'
      let newCorrect = base.correctAnswer
      if (newOp === '+') newCorrect += c
      else newCorrect = Math.max(0, newCorrect - c)
      const newText = `${base.questionText.replace(' = ?', '')} ${newOp} ${c} = ?`
      const interfaceType = floor <= 8 ? '6_options' : 'keyboard'
      const wrongs = generateWrongOptions(newCorrect, interfaceType === '6_options' ? 5 : 0, 0, 120)
      return {
        questionText: newText,
        options: interfaceType === 'keyboard' ? [] : shuffle([newCorrect, ...wrongs]).slice(0, 6),
        correctAnswer: newCorrect,
        interfaceType,
        visualAid: null,
        timeLimit: null,
      }
    }
  }
  return { ...base, interfaceType: floor <= 8 ? '6_options' : 'keyboard', options: floor <= 8 ? base.options : [], visualAid: null }
}

// ── OLDER MODE ────────────────────────────────────────────────────────────────

const TABLE_BY_FLOOR = { 1: [1,2,3], 2: [1,2,3,4], 3: [1,2,3,4,5], 4: [1,2,3,4,5,6], 5: [1,2,3,4,5,6,7], 6: [1,2,3,4,5,6,7,8], 7: [1,2,3,4,5,6,7,8,9], 8: [1,2,3,4,5,6,7,8,9,10], 9: [1,2,3,4,5,6,7,8,9,10,11], 10: [1,2,3,4,5,6,7,8,9,10,11,12], 11: [1,2,3,4,5,6,7,8,9,10,11,12], 12: [1,2,3,4,5,6,7,8,9,10,11,12] }

function olderNormal(floor, room) {
  const tables = TABLE_BY_FLOOR[floor] || [1,2,3]
  const table = tables[rnd(0, tables.length - 1)]
  const multiplier = rnd(1, 12)
  const useDiv = floor === 12 && rnd(0, 1) === 1
  const interfaceType = floor <= 3 ? '4_options' : floor <= 8 ? '6_options' : 'keyboard'

  if (useDiv) {
    const dividend = table * multiplier
    const correct = table
    const questionText = `${dividend} ÷ ${multiplier} = ?`
    const wrongs = generateWrongOptions(correct, interfaceType === '4_options' ? 3 : 5, 1, 12)
    return {
      questionText,
      options: interfaceType === 'keyboard' ? [] : shuffle([correct, ...wrongs]).slice(0, interfaceType === '4_options' ? 4 : 6),
      correctAnswer: correct,
      interfaceType,
      visualAid: null,
      timeLimit: null,
    }
  }

  const correct = table * multiplier
  const questionText = `${table} × ${multiplier} = ?`
  const wrongs = generateWrongOptions(correct, interfaceType === '4_options' ? 3 : 5, 1, 144)
  return {
    questionText,
    options: interfaceType === 'keyboard' ? [] : shuffle([correct, ...wrongs]).slice(0, interfaceType === '4_options' ? 4 : 6),
    correctAnswer: correct,
    interfaceType,
    visualAid: null,
    timeLimit: null,
  }
}

function olderPro(floor) {
  const tables = TABLE_BY_FLOOR[floor] || [1,2,3]
  const t1 = tables[rnd(0, tables.length - 1)]
  const m1 = rnd(1, 12)
  const c = rnd(1, 10)
  const op2 = rnd(0, 1) === 0 ? '+' : '-'
  const product = t1 * m1
  const correct = op2 === '+' ? product + c : Math.max(0, product - c)
  return {
    questionText: `${t1} × ${m1} ${op2} ${c} = ?`,
    options: [],
    correctAnswer: correct,
    interfaceType: 'keyboard',
    visualAid: null,
    timeLimit: null,
  }
}

function olderSuperPro(floor) {
  const tables = TABLE_BY_FLOOR[floor] || [1,2,3]
  const t1 = tables[rnd(0, tables.length - 1)]
  const m1 = rnd(1, 12)
  const t2 = tables[rnd(0, tables.length - 1)]
  const m2 = rnd(1, 6)
  const op = rnd(0, 1) === 0 ? '+' : '-'
  const p1 = t1 * m1
  const p2 = t2 * m2
  const correct = op === '+' ? p1 + p2 : Math.max(0, p1 - p2)
  return {
    questionText: `${t1} × ${m1} ${op} ${t2} × ${m2} = ?`,
    options: [],
    correctAnswer: correct,
    interfaceType: 'keyboard',
    visualAid: null,
    timeLimit: null,
  }
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export function generateQuestion(ageMode, floor, room, currentMode) {
  let q

  if (ageMode === 'young') {
    if (currentMode === 'normal') {
      q = youngNormal(floor, room)
    } else {
      // pro / super-chachi
      q = youngPro(floor, room)
    }
  } else {
    // older
    if (currentMode === 'normal') {
      q = olderNormal(floor, room)
    } else if (currentMode === 'pro') {
      q = olderPro(floor)
    } else {
      // super-pro / super-chachi
      q = olderSuperPro(floor)
    }
  }

  if (currentMode === 'super-chachi') {
    q = { ...q, timeLimit: 30 }
  }

  return q
}
