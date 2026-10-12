import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useHotkeys } from '../../hooks/useHotkeys'
import { KeyHint, QuizOption, QuizPrompt, QuizResult, SessionBar, optionState } from '../ui/Session'
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

interface ChineseReviewProps {
  words: ChineseWord[]
  pool: ChineseWord[]
  accent?: string
  onBack: () => void
}

// Practice mode: reshuffles the learned words into a fresh question order
// every round and never persists score, mistakes, or position anywhere.
export default function ChineseReview({ words, pool, onBack }: ChineseReviewProps) {
  const { t, i18n } = useTranslation()
  const isVietnamese = i18n.language.startsWith('vi')
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const choose = (option: ChineseWord) => {
    if (selected || flashWrong || wrongOptions.has(option.id)) return
    if (option.id === question.word.id) {
      speak(chineseSpeechText(option), 'zh-CN')
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
    }, 900)
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

  // 1–4 picks the matching option.
  useHotkeys(
    Object.fromEntries(
      (question?.options ?? []).map((option, i) => [String(i + 1), () => choose(option)]),
    ),
    !finished,
  )

  if (questions.length === 0) {
    return (
      <div className="session">
        <SessionBar current={0} total={0} onExit={onBack} exitLabel={t('chinese.review.levelOverviewBack')} />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="session">
        <QuizResult
          score={score}
          total={questions.length}
          title={t('chinese.review.scored', { score, total: questions.length })}
          subtitle={
            score === questions.length ? t('chinese.review.perfect') : t('chinese.review.tryAgainMessage')
          }
          actions={
            <>
              <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={restart}>
                {t('chinese.review.reviewAgain')}
              </Button>
              <Button size="large" onClick={onBack}>
                {t('chinese.review.levelOverview')}
              </Button>
            </>
          }
          missedTitle={t('chinese.review.wordsMissed', { count: missedWords.length })}
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
        exitLabel={t('chinese.review.levelOverviewBack')}
      />

      <QuizPrompt label={t('chinese.review.prompt')}>{isVietnamese ? question.word.vi : question.word.meaning}</QuizPrompt>

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
              main={option.zh}
              sub={option.pinyin}
              lang="zh-CN"
            />
          )
        })}
      </div>

      <KeyHint>
        <kbd>1</kbd>–<kbd>4</kbd> {t('hotkeys.answer')}
      </KeyHint>
    </div>
  )
}
