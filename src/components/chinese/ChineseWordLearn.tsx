import { useTranslation } from 'react-i18next'
import type { ChineseWord } from '../../data/chinese/types'
import { chineseSpeechText, speak } from '../../utils/speech'
import FlashcardDeck from '../ui/FlashcardDeck'
import { ListenButton } from '../ui/Session'

interface ChineseWordLearnProps {
  words: ChineseWord[]
  accent?: string
  initialIndex?: number
  onIndexChange?: (index: number) => void
  onFinish: () => void
  onBack: () => void
}

const speakWord = (w: ChineseWord) => speak(chineseSpeechText(w), 'zh-CN')

export default function ChineseWordLearn({
  words,
  initialIndex,
  onIndexChange,
  onFinish,
  onBack,
}: ChineseWordLearnProps) {
  const { t, i18n } = useTranslation()
  const isVietnamese = i18n.language.startsWith('vi')
  return (
    <FlashcardDeck
      words={words}
      initialIndex={initialIndex}
      onIndexChange={onIndexChange}
      onFinish={onFinish}
      onBack={onBack}
      i18nPrefix="chinese."
      speakWord={speakWord}
      renderFront={(word, play) => (
        <>
          <h2 className="flashcard-word" lang="zh-CN">
            {word.zh}
          </h2>
          <div className="flashcard-reading">{word.pinyin}</div>
          <ListenButton onClick={play} label={t('chinese.wordLearn.listen')} />
          {word.example && (
            <div className="flashcard-example-block">
              <div className="flashcard-example-sentence" lang="zh-CN">{word.example.sentence}</div>
              <div className="flashcard-example-reading">{word.example.pinyin}</div>
              <div className="flashcard-example-translation">
                {isVietnamese ? word.example.vi : word.example.meaning}
              </div>
            </div>
          )}
        </>
      )}
      renderBack={(word) => (
        <>
          <h2 className="flashcard-meaning">{isVietnamese ? word.vi : word.meaning}</h2>
          <div className="flashcard-meta">
            <strong style={{ color: 'var(--ink)' }} lang="zh-CN">
              {word.zh}
            </strong>
            <span>{word.pinyin}</span>
          </div>
          {word.example && (
            <div className="flashcard-example-block">
              <div className="flashcard-example-sentence" lang="zh-CN">{word.example.sentence}</div>
              <div className="flashcard-example-reading">{word.example.pinyin}</div>
              <div className="flashcard-example-translation">
                {isVietnamese ? word.example.vi : word.example.meaning}
              </div>
            </div>
          )}
        </>
      )}
    />
  )
}
