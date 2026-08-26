import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { generateQuestion } from '../engine/mathEngine'
import { getNormalRoomCount } from '../engine/floorConfig'
import { FLOOR_INTRO, ROOM_INTRO, ROOM_LEAVE } from '../engine/roomAnimations'
import { SKINS } from '../data/skins'
import useViewport from '../hooks/useViewport'
import FloorBackground from '../components/FloorBackground'
import SceneBackground from '../components/SceneBackground'
import Particles from '../components/Particles'
import { sfx } from '../engine/sfx'
import Character from '../components/PixiCharacter'
import QuestionCard from '../components/QuestionCard'
import AnswerPanel from '../components/AnswerPanel'
import HeartsBar from '../components/HeartsBar'
import TimerBar from '../components/TimerBar'
import VisualAid from '../components/VisualAid'
import ProgressBar from '../components/ProgressBar'
import RewardModal from '../components/RewardModal'

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
  // The wizard is the emotional anchor of the game, so it stays on screen at
  // every size — it just shrinks, and moves above the question in portrait.
  const characterSize = isShort ? 86 : isCompact ? 96 : 110

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
  const totalQuestions = isBoss ? QUESTIONS_BOSS : QUESTIONS_NORMAL
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
          setAnswered(newAnswered)
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

  // Plays the "character flies off happily" beat, then swaps rooms once it's off-screen.
  const advanceAndGo = useCallback((path, state) => {
    setLeaving(true)
    sfx.whoosh()
    setParticles({ type: 'magic', key: Date.now() + 1 })
    setTimeout(() => {
      if (!isPractice) advanceRoom(activeProfile.id)
      navigate(path, state ? { state } : undefined)
    }, ROOM_LEAVE.navigateDelayMs)
  }, [isPractice, activeProfile, advanceRoom, navigate])

  const finishRoom = useCallback(() => {
    if (isPractice) {
      // No se toca el progreso real: ni planta actual, ni vidas, ni disfraces.
      if (isBoss) {
        navigate('/castle')
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
      newlyUnlocked.forEach((item) => unlockSkin(activeProfile.id, item.id))
      advanceRoom(activeProfile.id)
      if (floor >= 12) {
        navigate('/victory-game')
      } else {
        navigate('/victory-floor', { state: { newSkinIds: newlyUnlocked.map((i) => i.id) } })
      }
    } else if (room >= normalRooms) {
      advanceAndGo('/boss')
    } else {
      advanceAndGo('/room')
    }
  }, [isPractice, isBoss, floor, room, normalRooms, bossRoom, practiceLives, activeProfile, unlockSkin, advanceRoom, navigate, advanceAndGo])

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

  const roomLabel = isBoss ? 'Examen del Jefe' : `Habitación ${room} de ${normalRooms}`

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
            {isBoss ? '¡Entrando al Examen del Jefe!' : `Entrando en la Habitación ${room}`}
          </div>
        </motion.div>

        {/*
          NOTE: this layout div itself is never faded — only specific pieces
          inside it are (via contentFadeProps below). The character's own
          entrance motion must NOT sit inside an opacity:0 ancestor, or it
          plays invisibly and appears to "pop in" together with the question.
        */}
        <div className="h-full flex flex-col p-2 sm:p-3 gap-2 sm:gap-3">
          {/* Header - fades in with the question, once the character has landed */}
          <motion.div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap" {...contentFadeProps}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate('/castle')}
                className="text-white/50 hover:text-white/90 text-xl leading-none transition-colors"
                title="Volver al castillo"
              >🏰</button>
              <div className="min-w-0">
                <div className="font-title text-amber-400 text-base sm:text-lg flex items-center gap-2">
                  Planta {floor}
                  {isPractice && (
                    <span className="text-[10px] sm:text-xs font-body bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      🔁 <span className="hidden sm:inline">Modo </span>práctica
                    </span>
                  )}
                </div>
                <div className="font-body text-white/70 text-xs sm:text-sm truncate">{roomLabel}</div>
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
          <div className="flex-1 flex flex-col landscape:flex-row gap-2 landscape:gap-4 items-center justify-center min-h-0 overflow-y-auto">
            {/* Character - animates independently of the question/answers fade */}
            <div className="flex flex-col items-center justify-center shrink-0 landscape:w-28">
              <motion.div
                initial={
                  isNewFloor
                    ? { opacity: 0, y: 140, scale: 0.55 }
                    : { opacity: 0, x: -120, scale: 0.7, rotate: -12 }
                }
                animate={
                  leaving
                    ? { opacity: 0, y: -220, x: 170, rotate: 24, scale: 0.5 }
                    : { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }
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
                <Character
                  gender={activeProfile.gender}
                  equippedSkins={activeProfile.equippedSkins}
                  animationState={animState}
                  size={characterSize}
                />
              </motion.div>
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
