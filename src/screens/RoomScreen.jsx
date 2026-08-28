import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { generateQuestion, getMaxUniqueQuestions } from '../engine/mathEngine'
import { getNormalRoomCount } from '../engine/floorConfig'
import { FLOOR_INTRO, ROOM_INTRO, ROOM_LEAVE } from '../engine/roomAnimations'
import { SKINS } from '../data/skins'
import useViewport from '../hooks/useViewport'
import useCastleViewMode from '../hooks/useCastleViewMode'
import FloorBackground from '../components/FloorBackground'
import SceneBackground from '../components/SceneBackground'
import Particles from '../components/Particles'
import { sfx } from '../engine/sfx'
import Character from '../components/PixiCharacter'
import DirectorMago from '../components/DirectorMago'
import QuestionCard from '../components/QuestionCard'
import AnswerPanel from '../components/AnswerPanel'
import HeartsBar from '../components/HeartsBar'
import TimerBar from '../components/TimerBar'
import VisualAid from '../components/VisualAid'
import ProgressBar from '../components/ProgressBar'
import RewardModal from '../components/RewardModal'

// three.js + fiber/drei are only paid for by profiles that picked a 3D character.
const CharacterStage3D = lazy(() => import('../components/character3d/CharacterStage3D'))

const QUESTIONS_NORMAL = 5
const QUESTIONS_BOSS = 8

const RETURN_MESSAGES = [
  '¡Vamos, tú puedes!',
  '¡Esta vez sí lo consigues!',
  '¡Los magos no se rinden!',
  '¡Inténtalo de nuevo!',
  '¡La magia está de tu lado!',
]

function generateNewQuestion(ageMode, floor, room, currentMode, askedTexts) {
  let q
  let attempts = 0
  do {
    q = generateQuestion(ageMode, floor, room, currentMode)
    attempts++
  } while (askedTexts.has(q.questionText) && attempts < 30)
  return q
}

export default function RoomScreen() {
  const { activeProfile, loseLife, resetFloor, advanceRoom, unlockSkin, updateProfile } = useGame()
  const navigate = useNavigate()
  const location = useLocation()
  const { isCompact, isShort } = useViewport()
  const { mode: castleViewMode } = useCastleViewMode()

  // Repasar una planta ya superada desde el castillo entra en "modo práctica":
  // se puede jugar esa planta sin tocar el progreso real (vidas, planta actual,
  // puntuación ni disfraces ya desbloqueados).
  const isPractice = !!location.state?.practiceFloor
  const [practiceLives, setPracticeLives] = useState(() => location.state?.practiceLives ?? 3)

  const floor = isPractice ? location.state.practiceFloor : (activeProfile?.currentFloor || 1)
  const room = isPractice ? (location.state.practiceRoom || 1) : (activeProfile?.currentRoom || 1)
  const normalRooms = getNormalRoomCount(floor)
  const bossRoom = normalRooms + 1
  const isBoss = room === bossRoom
  // The wizard is the emotional anchor of the game, so it stays on screen at
  // every size — it just shrinks, and moves above the question in portrait.
  // The boss room also shows the exam-giving mago next to it, which needs
  // more vertical room than a solo character, so both shrink further there
  // to leave space for the answer panel (worst case: the tall numeric
  // keyboard) below on short/narrow phones.
  const characterSize = isBoss
    ? (isShort ? 62 : isCompact ? 68 : 110)
    : (isShort ? 86 : isCompact ? 96 : 110)
  const magoSize = isShort ? 68 : isCompact ? 74 : 155
  // Mirrors the castle's own 2D/3D toggle — switching the castle back to 2D
  // should show the 2D sprite in rooms too, even if a 3D character is saved.
  const is3D = castleViewMode === '3d'
  // A 3D scene (camera margin, floor, perspective falloff) reads much smaller
  // than a flat 2D sprite at the same pixel box — needs a noticeably bigger
  // box to be legible at all. These sizes were measured against the actual
  // layout's leftover space at each breakpoint (see RoomScreen's character
  // column vs. question column split) rather than picked by eye, so the
  // character fills most of its column instead of floating in empty space.
  const character3dSize = isBoss
    ? (isShort ? 140 : isCompact ? 175 : 260)
    : (isShort ? 195 : isCompact ? 235 : 340)
  // No pedir más preguntas de las que hay combinaciones únicas posibles (p.ej. la
  // planta 1 solo repasa la tabla del 2 hasta ×5 → como mucho 5 preguntas, sin repetir).
  const maxUnique = getMaxUniqueQuestions(activeProfile?.ageMode, floor, room, activeProfile?.currentMode)
  const totalQuestions = Math.min(isBoss ? QUESTIONS_BOSS : QUESTIONS_NORMAL, maxUnique)
  const lives = isPractice ? practiceLives : (activeProfile?.lives ?? 3)
  // First room of a floor gets the big "arriving at a new floor" flourish;
  // any other room gets a quicker "walking into the next room" settle.
  const isNewFloor = room === 1
  const introCfg = isNewFloor ? FLOOR_INTRO : ROOM_INTRO
  const titleTotalMs = introCfg.titleFadeMs * 2 + introCfg.titleHoldMs
  // Sequential beats: title fades out → character flies in → question fades in.
  const charDelayMs = introCfg.titleDelayMs + titleTotalMs
  const contentDelayMs = charDelayMs + introCfg.charDurationMs
  const contentFadeProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: introCfg.contentFadeMs / 1000, delay: contentDelayMs / 1000 },
  }

  const askedQuestionsRef = useRef(new Set())
  const [question, setQuestion] = useState(() => {
    const q = generateNewQuestion(activeProfile?.ageMode, floor, room, activeProfile?.currentMode, askedQuestionsRef.current)
    askedQuestionsRef.current.add(q.questionText)
    return q
  })
  const [answered, setAnswered] = useState(0)
  const [animState, setAnimState] = useState('idle')
  const [disabled, setDisabled] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [rewardSkinId, setRewardSkinId] = useState(null)
  const [timerKey, setTimerKey] = useState(0)
  const [particles, setParticles] = useState(null)
  const [showReturnMsg] = useState(() => RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)])
  // entering: the character is still flying/walking in — inputs stay disabled
  // leaving: the character is flying off happily before we navigate away
  const [entering, setEntering] = useState(true)
  const [leaving, setLeaving] = useState(false)

  // Room entrance choreography: play the arrival chime when the "Entrando
  // en..." title pops in, and re-enable input once the question has faded in.
  useEffect(() => {
    const titleTimer = setTimeout(() => sfx.magic(), introCfg.titleDelayMs)
    const readyTimer = setTimeout(() => setEntering(false), contentDelayMs + introCfg.contentFadeMs)
    return () => { clearTimeout(titleTimer); clearTimeout(readyTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextQuestion = useCallback(() => {
    const q = generateNewQuestion(activeProfile?.ageMode, floor, room, activeProfile?.currentMode, askedQuestionsRef.current)
    askedQuestionsRef.current.add(q.questionText)
    setQuestion(q)
    setDisabled(false)
    setFeedback(null)
    setTimerKey((k) => k + 1)
  }, [activeProfile, floor, room])

  const handleAnswer = useCallback((answer) => {
    if (disabled) return
    setDisabled(true)
    const correct = String(answer).trim() === String(question.correctAnswer).trim()

    if (correct) {
      setAnimState('correctAnswer')
      setFeedback('correct')
      setParticles({ type: 'correct', key: Date.now() })
      sfx.correct()
      if (!isPractice) updateProfile(activeProfile.id, { score: (activeProfile.score || 0) + 10 })

      setTimeout(() => {
        setAnimState('idle')
        const newAnswered = answered + 1
        setAnswered(newAnswered)
        if (newAnswered >= totalQuestions) {
          // Room complete
          const accessory = SKINS.find(
            (s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === room && room !== bossRoom
          )
          if (!isPractice && accessory && !activeProfile.unlockedSkins.includes(accessory.id)) {
            unlockSkin(activeProfile.id, accessory.id)
            setRewardSkinId(accessory.id)
          } else {
            finishRoom()
          }
        } else {
          nextQuestion()
        }
      }, 600)
    } else {
      setAnimState('wrongAnswer')
      setFeedback('wrong')
      setParticles({ type: 'wrong', key: Date.now() })
      sfx.wrong()
      setTimeout(() => {
        setAnimState('idle')
        if (isPractice) {
          const remaining = practiceLives - 1
          setPracticeLives(remaining)
          if (remaining <= 0) {
            navigate('/castle')
          } else {
            setDisabled(false)
            setFeedback(null)
            setTimerKey((k) => k + 1)
          }
        } else {
          loseLife(activeProfile.id)
          if ((activeProfile.lives - 1) <= 0) {
            navigate('/defeat')
          } else {
            setDisabled(false)
            setFeedback(null)
            setTimerKey((k) => k + 1)
          }
        }
      }, 700)
    }
  }, [disabled, question, answered, totalQuestions, activeProfile, floor, room, bossRoom, isPractice, practiceLives, loseLife, unlockSkin, nextQuestion, navigate, updateProfile])

  // Plays the "character flies off happily" beat, then runs the given action
  // once it's off-screen — so the finished-room state (e.g. a 100% progress
  // bar) is visible for a beat before the screen actually changes.
  const leaveThen = useCallback((action) => {
    setLeaving(true)
    sfx.whoosh()
    setParticles({ type: 'magic', key: Date.now() + 1 })
    setTimeout(action, ROOM_LEAVE.navigateDelayMs)
  }, [])

  const advanceAndGo = useCallback((path, state) => {
    leaveThen(() => {
      if (!isPractice) advanceRoom(activeProfile.id)
      navigate(path, state ? { state } : undefined)
    })
  }, [leaveThen, isPractice, activeProfile, advanceRoom, navigate])

  const finishRoom = useCallback(() => {
    if (isPractice) {
      // No se toca el progreso real: ni planta actual, ni vidas, ni disfraces.
      if (isBoss) {
        leaveThen(() => navigate('/castle'))
      } else if (room >= normalRooms) {
        advanceAndGo('/boss', { practiceFloor: floor, practiceRoom: bossRoom, practiceLives })
      } else {
        advanceAndGo('/room', { practiceFloor: floor, practiceRoom: room + 1, practiceLives })
      }
      return
    }
    if (isBoss) {
      const outfitItems = SKINS.filter((s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === bossRoom)
      const newlyUnlocked = outfitItems.filter((item) => !activeProfile.unlockedSkins.includes(item.id))
      leaveThen(() => {
        newlyUnlocked.forEach((item) => unlockSkin(activeProfile.id, item.id))
        advanceRoom(activeProfile.id)
        if (floor >= 12) {
          navigate('/victory-game')
        } else {
          navigate('/victory-floor', { state: { newSkinIds: newlyUnlocked.map((i) => i.id) } })
        }
      })
    } else if (room >= normalRooms) {
      advanceAndGo('/boss')
    } else {
      advanceAndGo('/room')
    }
  }, [isPractice, isBoss, floor, room, normalRooms, bossRoom, practiceLives, activeProfile, unlockSkin, advanceRoom, navigate, advanceAndGo, leaveThen])

  const handleTimeUp = useCallback(() => {
    if (disabled) return
    setDisabled(true)
    setAnimState('wrongAnswer')
    setFeedback('wrong')
    setParticles({ type: 'wrong', key: Date.now() })
    sfx.wrong()
    setTimeout(() => {
      setAnimState('idle')
      if (isPractice) {
        const remaining = practiceLives - 1
        setPracticeLives(remaining)
        if (remaining <= 0) {
          navigate('/castle')
        } else {
          setDisabled(false)
          setFeedback(null)
          setTimerKey((k) => k + 1)
        }
      } else {
        loseLife(activeProfile.id)
        if ((activeProfile.lives - 1) <= 0) {
          navigate('/defeat')
        } else {
          setDisabled(false)
          setFeedback(null)
          setTimerKey((k) => k + 1)
        }
      }
    }, 700)
  }, [disabled, isPractice, practiceLives, activeProfile, loseLife, navigate])

  if (!activeProfile) return null

  const roomLabel = isBoss ? 'Examen del Mago' : `Habitación ${room} de ${normalRooms}`
  const magoState = animState === 'correctAnswer' ? 'applaud' : animState === 'wrongAnswer' ? 'sad' : 'idle'

  return (
    <div className="h-dvh w-full overflow-hidden">
      <SceneBackground floor={floor} room={room} introLevel={isNewFloor ? 'floor' : 'room'}>
        {/* "Entrando en..." title card, then it fades out before the question shows */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: titleTotalMs / 1000,
            delay: introCfg.titleDelayMs / 1000,
            times: [
              0,
              introCfg.titleFadeMs / titleTotalMs,
              (introCfg.titleFadeMs + introCfg.titleHoldMs) / titleTotalMs,
              1,
            ],
          }}
        >
          <div
            className="font-title text-amber-300 text-2xl sm:text-4xl text-center px-5 py-4 sm:px-8 sm:py-5 rounded-3xl bg-black/50 backdrop-blur-sm border-2 border-amber-400/40 shadow-2xl"
            style={{ textShadow: '0 3px 14px rgba(0,0,0,0.7)' }}
          >
            {isBoss ? '¡Entrando al Examen del Mago!' : `Entrando en la Habitación ${room}`}
          </div>
        </motion.div>

        {/*
          NOTE: this layout div itself is never faded — only specific pieces
          inside it are (via contentFadeProps below). The character's own
          entrance motion must NOT sit inside an opacity:0 ancestor, or it
          plays invisibly and appears to "pop in" together with the question.
        */}
        <div className="h-full flex flex-col p-2 sm:p-3 short:p-1 gap-2 sm:gap-3 short:gap-1">
          {/* Header - fades in with the question, once the character has landed */}
          <motion.div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap" {...contentFadeProps}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate('/castle')}
                className="text-white/50 hover:text-white/90 text-xl leading-none transition-colors"
                title="Volver al castillo"
              >🏰</button>
              <div className="min-w-0">
                <div className="font-title text-amber-400 text-base sm:text-lg short:text-sm flex items-center gap-2">
                  Planta {floor}
                  {isPractice && (
                    <span className="text-[10px] sm:text-xs font-body bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      🔁 <span className="hidden sm:inline">Modo </span>práctica
                    </span>
                  )}
                </div>
                <div className="font-body text-white/70 text-xs sm:text-sm short:text-[11px] truncate">{roomLabel}</div>
              </div>
            </div>
            <HeartsBar lives={lives} />
            <ProgressBar current={answered} total={totalQuestions} />
          </motion.div>

          {/* Timer */}
          {question.timeLimit && (
            <motion.div {...contentFadeProps}>
              <TimerBar key={timerKey} timeLimit={question.timeLimit} onTimeUp={handleTimeUp} active={!entering && !leaving && (!disabled || feedback === null)} />
            </motion.div>
          )}

          {/*
            Main area. Landscape keeps the original two-column split; portrait
            stacks the character above the question, where there is vertical
            room to spare and no width to give away.
          */}
          <div className="flex-1 flex flex-col landscape:flex-row gap-2 landscape:gap-4 short:landscape:gap-2 items-center justify-center min-h-0 overflow-y-auto overflow-x-hidden">
            {/* Character (+ the wizard, in the boss exam) - animates independently of the question/answers fade */}
            {/* flex-wrap: on the narrowest phones, the 3D character (with a
                companion) plus the boss exam's wizard can be wider than the
                screen — wrapping the wizard onto its own line beats clipping
                either of them off-screen. */}
            <div className="flex flex-wrap items-end justify-center shrink-0 gap-1 sm:gap-2 w-full landscape:w-auto">
              <motion.div
                // The 3D character's box is measured by react-three-fiber via
                // getBoundingClientRect, which (unlike layout width/height)
                // DOES include CSS transforms — animating scale/rotate here
                // would get baked into the canvas's pixel size at whatever
                // mid-animation value it happened to be measured at. Drop
                // those two for the 3D case and keep only transform
                // properties (opacity/x/y) that don't affect the box size.
                initial={
                  isNewFloor
                    ? { opacity: 0, y: 140, ...(is3D ? {} : { scale: 0.55 }) }
                    : { opacity: 0, x: -120, ...(is3D ? {} : { scale: 0.7, rotate: -12 }) }
                }
                animate={
                  leaving
                    ? { opacity: 0, y: -220, x: 170, ...(is3D ? {} : { rotate: 24, scale: 0.5 }) }
                    : { opacity: 1, y: 0, x: 0, ...(is3D ? {} : { scale: 1, rotate: 0 }) }
                }
                transition={
                  leaving
                    ? { duration: ROOM_LEAVE.charDurationMs / 1000, ease: 'easeIn' }
                    : {
                        duration: introCfg.charDurationMs / 1000,
                        delay: charDelayMs / 1000,
                        ease: [0.34, 1.56, 0.64, 1],
                      }
                }
              >
                {is3D ? (
                  <Suspense fallback={<div style={{ width: character3dSize, height: character3dSize }} />}>
                    <CharacterStage3D profile={activeProfile} size={character3dSize} />
                  </Suspense>
                ) : (
                  <Character
                    gender={activeProfile.gender}
                    equippedSkins={activeProfile.equippedSkins}
                    animationState={animState}
                    size={characterSize}
                  />
                )}
              </motion.div>

              {isBoss && (
                <motion.div
                  initial={{ opacity: 0, x: 100, scale: 0.7, rotate: 8 }}
                  animate={
                    leaving
                      ? { opacity: 0, scale: 0.6 }
                      : { opacity: 1, x: 0, scale: 1, rotate: 0 }
                  }
                  transition={
                    leaving
                      ? { duration: ROOM_LEAVE.charDurationMs / 1000, ease: 'easeIn' }
                      : {
                          duration: introCfg.charDurationMs / 1000,
                          delay: charDelayMs / 1000,
                          ease: [0.34, 1.56, 0.64, 1],
                        }
                  }
                >
                  <DirectorMago animationState={magoState} size={magoSize} />
                </motion.div>
              )}
            </div>

            {/* Question + answers */}
            <motion.div className="w-full landscape:flex-1 flex flex-col gap-3 sm:gap-4 min-w-0" {...contentFadeProps}>
              <QuestionCard questionText={question.questionText} ageMode={activeProfile.ageMode} />

              {question.visualAid && (
                <div className="flex justify-center">
                  <VisualAid type={question.visualAid.type} count={question.visualAid.count} a={question.visualAid.a} b={question.visualAid.b} />
                </div>
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    className={`text-center font-title text-xl sm:text-3xl ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  >
                    {feedback === 'correct' ? '¡CORRECTO! ✨' : '¡VUELVE A INTENTARLO! 💫'}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnswerPanel
                interfaceType={question.interfaceType}
                options={question.options}
                onAnswer={handleAnswer}
                disabled={disabled || entering || leaving}
                ageMode={activeProfile.ageMode}
              />
            </motion.div>
          </div>
        </div>
      </SceneBackground>

      <Particles key={particles?.key || 'none'} trigger={particles} type={particles?.type} />

      {/* Reward modal for accessories */}
      {rewardSkinId && (
        <RewardModal
          skinId={rewardSkinId}
          onClose={() => { setRewardSkinId(null); finishRoom() }}
          isOutfit={false}
        />
      )}
    </div>
  )
}
