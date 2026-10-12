import { useTranslation } from 'react-i18next'
import { englishSpeechText, speak } from '../../utils/speech'
import type { VocabularyWord } from '../../data/english/vocabulary'
import type { LevelInfo } from '../../data/english/vocabulary/topics'
import LevelOverview from '../ui/LevelOverview'

interface LevelDetailProps {
  level: LevelInfo
  pool: VocabularyWord[]
  learnedWords: string[]
  batchSize: number
  onChangeBatchSize: (size: number) => void
  onContinue: () => void
  onReview: (selectedKeys?: string[]) => void
  onBack: () => void
}

const getKey = (w: VocabularyWord) => w.en
const matches = (w: VocabularyWord, q: string) =>
  w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q)
const onSpeak = (w: VocabularyWord) => speak(englishSpeechText(w.en), 'en-US')

export default function LevelDetail({ level, pool, learnedWords, ...rest }: LevelDetailProps) {
  const { i18n } = useTranslation()
  const isVietnamese = i18n.language.startsWith('vi')
  return (
    <LevelOverview
      level={level}
      pool={pool}
      learnedKeys={learnedWords}
      getKey={getKey}
      matches={matches}
      onSpeak={onSpeak}
      describe={(w) => ({
        key: w.en,
        primary: w.en,
        reading: w.ipa,
        meaning: isVietnamese ? w.vi : w.definition,
        lang: 'en',
      })}
      i18nPrefix=""
      {...rest}
    />
  )
}
