import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../context/GameContext'
import { generateQuestion } from '../engine/mathEngine'
import { SKINS } from '../data/skins'
import FloorBackground from '../components/FloorBackground'
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

function generateNewQuestion(ageMode, floor, room, currentMode, lastQuestion) {
  let q
  let attempts = 0
  do {
    q = generateQuestion(ageMode, floor, room, currentMode)
    attempts++
  } while (q.questionText === lastQuestion && attempts < 10)
  return q
}

export default function RoomScreen() {
  const { activeProfile, loseLife, resetFloor, advanceRoom, unlockSkin, updateProfile } = useGame()
  const navigate = useNavigate()

  const floor = activeProfile?.currentFloor || 1
  const room = activeProfile?.currentRoom || 1
  const isBoss = room === 4
  const totalQuestions = isBoss ? QUESTIONS_BOSS : QUESTIONS_NORMAL

  const lastQuestionRef = useRef('')
  const [question, setQuestion] = useState(() =>
    generateNewQuestion(activeProfile?.ageMode, floor, room, activeProfile?.currentMode, '')
  )
  const [answered, setAnswered] = useState(0)
  const [animState, setAnimState] = useState('idle')
  const [disabled, setDisabled] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [rewardSkinId, setRewardSkinId] = useState(null)
  const [timerKey, setTimerKey] = useState(0)
  const [showReturnMsg] = useState(() => RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)])

  const nextQuestion = useCallback(() => {
    const q = generateNewQuestion(activeProfile?.ageMode, floor, room, activeProfile?.currentMode, lastQuestionRef.current)
    lastQuestionRef.current = q.questionText
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
      updateProfile(activeProfile.id, { score: (activeProfile.score || 0) + 10 })

      setTimeout(() => {
        setAnimState('idle')
        const newAnswered = answered + 1
        if (newAnswered >= totalQuestions) {
          // Room complete
          const accessory = SKINS.find(
            (s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === room && room < 4
          )
          if (accessory && !activeProfile.unlockedSkins.includes(accessory.id)) {
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
      setTimeout(() => {
        setAnimState('idle')
        loseLife(activeProfile.id)
        if ((activeProfile.lives - 1) <= 0) {
          navigate('/defeat')
        } else {
          setDisabled(false)
          setFeedback(null)
          setTimerKey((k) => k + 1)
        }
      }, 700)
    }
  }, [disabled, question, answered, totalQuestions, activeProfile, floor, room, loseLife, unlockSkin, nextQuestion, navigate, updateProfile])

  const finishRoom = useCallback(() => {
    if (isBoss) {
      const outfitItems = SKINS.filter((s) => s.unlockedAtFloor === floor && s.unlockedAtRoom === 4)
      const newlyUnlocked = outfitItems.filter((item) => !activeProfile.unlockedSkins.includes(item.id))
      newlyUnlocked.forEach((item) => unlockSkin(activeProfile.id, item.id))
      advanceRoom(activeProfile.id)
      if (floor >= 12) {
        navigate('/victory-game')
      } else {
        navigate('/victory-floor', { state: { newSkinIds: newlyUnlocked.map((i) => i.id) } })
      }
    } else {
      advanceRoom(activeProfile.id)
      if (room >= 3) {
        navigate('/boss')
      } else {
        navigate('/room')
      }
    }
  }, [isBoss, floor, room, activeProfile, unlockSkin, advanceRoom, navigate])

  const handleTimeUp = useCallback(() => {
    if (disabled) return
    setDisabled(true)
    setAnimState('wrongAnswer')
    setFeedback('wrong')
    setTimeout(() => {
      setAnimState('idle')
      loseLife(activeProfile.id)
      if ((activeProfile.lives - 1) <= 0) {
        navigate('/defeat')
      } else {
        setDisabled(false)
        setFeedback(null)
        setTimerKey((k) => k + 1)
      }
    }, 700)
  }, [disabled, activeProfile, loseLife, navigate])

  if (!activeProfile) return null

  const roomLabel = isBoss ? 'Examen del Jefe' : `Habitación ${room} de 3`

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FloorBackground floor={floor}>
        <div className="h-full flex flex-col p-3 gap-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/castle')}
                className="text-white/50 hover:text-white/90 text-xl leading-none transition-colors"
                title="Volver al castillo"
              >🏰</button>
              <div>
                <div className="font-title text-amber-400 text-lg">Planta {floor}</div>
                <div className="font-body text-white/70 text-sm">{roomLabel}</div>
              </div>
            </div>
            <HeartsBar lives={activeProfile.lives} />
            <ProgressBar current={answered} total={totalQuestions} />
          </div>

          {/* Timer */}
          {question.timeLimit && (
            <TimerBar key={timerKey} timeLimit={question.timeLimit} onTimeUp={handleTimeUp} active={!disabled || feedback === null} />
          )}

          {/* Main area */}
          <div className="flex-1 flex gap-4 items-center min-h-0">
            {/* Character */}
            <div className="hidden sm:flex flex-col items-center justify-center w-28 shrink-0">
              <Character
                gender={activeProfile.gender}
                equippedSkins={activeProfile.equippedSkins}
                animationState={animState}
                size={110}
              />
            </div>

            {/* Question + answers */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <QuestionCard questionText={question.questionText} ageMode={activeProfile.ageMode} />

              {question.visualAid && (
                <div className="flex justify-center">
                  <VisualAid type={question.visualAid.type} count={question.visualAid.count} a={question.visualAid.a} b={question.visualAid.b} />
                </div>
              )}

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    className={`text-center font-title text-3xl ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}
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
                disabled={disabled}
                ageMode={activeProfile.ageMode}
              />
            </div>
          </div>
        </div>
      </FloorBackground>

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
