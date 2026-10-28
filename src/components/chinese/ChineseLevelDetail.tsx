import { useTranslation } from 'react-i18next'
import { chineseSpeechText, speak } from '../../utils/speech'
import type { ChineseWord } from '../../data/chinese/types'
import type { LevelInfo } from '../../data/english/vocabulary/topics'
import LevelOverview from '../ui/LevelOverview'

interface ChineseLevelDetailProps {
  level: LevelInfo
  pool: ChineseWord[]
  learnedWords: string[]
  batchSize: number
  onChangeBatchSize: (size: number) => void
  onContinue: () => void
  onReview: (selectedKeys?: string[]) => void
  onListen: () => void
  onBack: () => void
}

const getKey = (w: ChineseWord) => w.id
const matches = (w: ChineseWord, q: string) =>
  w.zh.toLowerCase().includes(q) ||
  w.pinyin.toLowerCase().includes(q) ||
  w.meaning.toLowerCase().includes(q) ||
  w.vi.toLowerCase().includes(q)
const onSpeak = (w: ChineseWord) => speak(chineseSpeechText(w), 'zh-CN')

export default function ChineseLevelDetail({ level, pool, learnedWords, onListen, ...rest }: ChineseLevelDetailProps) {
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
      onListen={onListen}
      describe={(w) => ({
        key: w.id,
        primary: w.zh,
        reading: w.pinyin,
        meaning: isVietnamese ? w.vi : w.meaning,
        lang: 'zh-CN',
      })}
      i18nPrefix="chinese."
      {...rest}
    />
  )
}
