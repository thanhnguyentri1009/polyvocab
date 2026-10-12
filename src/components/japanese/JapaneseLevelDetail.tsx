import { useTranslation } from 'react-i18next'
import { japaneseSpeechText, speak } from '../../utils/speech'
import type { JapaneseWord } from '../../data/japanese/types'
import type { LevelInfo } from '../../data/english/vocabulary/topics'
import LevelOverview from '../ui/LevelOverview'

interface JapaneseLevelDetailProps {
  level: LevelInfo
  pool: JapaneseWord[]
  learnedWords: string[]
  batchSize: number
  onChangeBatchSize: (size: number) => void
  onContinue: () => void
  onReview: (selectedKeys?: string[]) => void
  onBack: () => void
}

const getKey = (w: JapaneseWord) => w.id
const matches = (w: JapaneseWord, q: string) =>
  w.jp.toLowerCase().includes(q) ||
  w.reading.toLowerCase().includes(q) ||
  w.romaji.toLowerCase().includes(q) ||
  w.meaning.toLowerCase().includes(q) ||
  w.vi.toLowerCase().includes(q)
const onSpeak = (w: JapaneseWord) => speak(japaneseSpeechText(w), 'ja-JP')

export default function JapaneseLevelDetail({ level, pool, learnedWords, ...rest }: JapaneseLevelDetailProps) {
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
        key: w.id,
        primary: w.jp,
        reading: w.reading !== w.jp ? w.reading : undefined,
        meaning: isVietnamese && w.vi ? w.vi : w.meaning,
        lang: 'ja',
      })}
      i18nPrefix="japanese."
      {...rest}
    />
  )
}
