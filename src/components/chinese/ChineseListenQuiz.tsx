import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useHotkeys } from '../../hooks/useHotkeys'
import { KeyHint, QuizOption, QuizResult, SessionBar, optionState } from '../ui/Session'
import type { ChineseWord } from '../../data/chinese/types'
import { chineseSpeechText, speak } from '../../utils/speech'

interface Question {
  word: ChineseWord
  options: ChineseWord[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(words: ChineseWord[], pool: ChineseWord[]): Question[] {
  return shuffle(words).map((word) => {
    const distractors = shuffle(pool.filter((w) => w.id !== word.id)).slice(0, 3)
    const options = shuffle([word, ...distractors])
    return { word, options }
  })
}

interface ChineseListenQuizProps {
  words: ChineseWord[]
  pool: ChineseWord[]
  accent?: string
  onBack: () => void
}

export default function ChineseListenQuiz({ words, pool, onBack }: ChineseListenQuizProps) {
  const { t, i18n } = useTranslation()
  const isVietnamese = i18n.language.startsWith('vi')
  const [round, setRound] = useState(0)
  const questions = useMemo(() => buildQuestions(words, pool), [words, pool, round])
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<ChineseWord | null>(null)
  const [wrongOptions, setWrongOptions] = useState<Set<string>>(new Set())
  const [flashWrong, setFlashWrong] = useState<string | null>(null)
  const [erred, setErred] = useState(false)
  const [score, setScore] = useState(0)
  const [missedWords, setMissedWords] = useState<ChineseWord[]>([])
  const [finished, setFinished] = useState(false)

  const question = questions[step]
  const isLast = step === questions.length - 1

  const playAudio = () => {
    if (!question) return
    speak(chineseSpeechText(question.word), 'zh-CN')
  }

  // Auto-play when the question changes
  useEffect(() => {
    if (!question) return
    speak(chineseSpeechText(question.word), 'zh-CN')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, round])

  const choose = (option: ChineseWord) => {
    if (selected || flashWrong || wrongOptions.has(option.id)) return
    if (option.id === question.word.id) {
      setSelected(option)
      if (!erred) setScore((s) => s + 1)
    } else {
      setErred(true)
      setFlashWrong(option.id)
      setWrongOptions((prev) => new Set(prev).add(option.id))
    }
  }

  useEffect(() => {
    if (!flashWrong) return
    const timer = setTimeout(() => setFlashWrong(null), 700)
    return () => clearTimeout(timer)
  }, [flashWrong])

  useEffect(() => {
    if (!selected) return
    const timer = setTimeout(() => {
      setWrongOptions(new Set())
      setErred(false)
      if (erred) setMissedWords((prev) => [...prev, question.word])
      if (isLast) {
        setFinished(true)
      } else {
        setSelected(null)
        setStep((s) => s + 1)
      }
    }, 1100)
    return () => clearTimeout(timer)
  }, [selected, isLast, erred, question])

  const restart = () => {
    setRound((r) => r + 1)
    setStep(0)
    setSelected(null)
    setWrongOptions(new Set())
    setFlashWrong(null)
    setErred(false)
    setScore(0)
    setMissedWords([])
    setFinished(false)
  }

  useHotkeys(
    {
      ' ': playAudio,
      ...Object.fromEntries(
        (question?.options ?? []).map((option, i) => [String(i + 1), () => choose(option)]),
      ),
    },
    !finished,
  )

  if (questions.length === 0) {
    return (
      <div className="session">
        <SessionBar current={0} total={0} onExit={onBack} exitLabel={t('chinese.listenQuiz.back')} />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="session">
        <QuizResult
          score={score}
          total={questions.length}
          title={t('chinese.listenQuiz.scored', { score, total: questions.length })}
          subtitle={
            score === questions.length
              ? t('chinese.listenQuiz.perfect')
              : t('chinese.listenQuiz.tryAgain')
          }
          actions={
            <>
              <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={restart}>
                {t('chinese.listenQuiz.again')}
              </Button>
              <Button size="large" onClick={onBack}>
                {t('chinese.listenQuiz.back')}
              </Button>
            </>
          }
          missedTitle={t('chinese.listenQuiz.missed', { count: missedWords.length })}
          missed={missedWords.map((word) => ({
            key: word.id,
            primary: word.zh,
            secondary: isVietnamese ? word.vi : word.meaning,
            lang: 'zh-CN',
          }))}
        />
      </div>
    )
  }

  return (
    <div className="session">
      <SessionBar
        current={step + 1}
        total={questions.length}
        onExit={onBack}
        exitLabel={t('chinese.listenQuiz.back')}
      />

      <div className="quiz-prompt">
        <span className="quiz-prompt-label">{t('chinese.listenQuiz.prompt')}</span>
        <div className="listen-quiz-prompt">
          <button
            type="button"
            className="listen-quiz-play-btn"
            onClick={playAudio}
            aria-label={t('chinese.listenQuiz.replay')}
            title={t('chinese.listenQuiz.replay')}
          >
            <SoundOutlined />
          </button>
          {selected && (
            <div className="listen-quiz-reveal" lang="zh-CN">
              <span className="listen-quiz-zh">{question.word.zh}</span>
              <span className="listen-quiz-pinyin">{question.word.pinyin}</span>
            </div>
          )}
        </div>
      </div>

      <div className="quiz-options">
        {question.options.map((option, optionIndex) => {
          const isFlashingWrong = flashWrong === option.id
          const isPermanentlyWrong = !isFlashingWrong && wrongOptions.has(option.id)
          return (
            <QuizOption
              key={option.id}
              index={optionIndex}
              state={optionState({
                isCorrect: option.id === question.word.id,
                answered: Boolean(selected),
                flashing: isFlashingWrong,
                eliminated: isPermanentlyWrong,
              })}
              disabled={Boolean(selected) || isFlashingWrong || isPermanentlyWrong}
              onClick={() => choose(option)}
              main={isVietnamese ? option.vi : option.meaning}
            />
          )
        })}
      </div>

      <KeyHint>
        <kbd>Space</kbd> {t('chinese.listenQuiz.replayHint')} · <kbd>1</kbd>–<kbd>4</kbd> {t('hotkeys.answer')}
      </KeyHint>
    </div>
  )
}
