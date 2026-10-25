import { ArrowRightOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { LevelInfo } from '../../data/english/vocabulary/topics'
import { partCount, SENTENCES_PER_PART } from '../../data/sentences/parts'
import PageHeader from '../PageHeader'

interface SentencePartSelectProps {
  ns: 'chinese' | 'japanese'
  level: LevelInfo
  total: number
  onSelect: (part: number) => void
  onBack: () => void
}

export default function SentencePartSelect({ ns, level, total, onSelect, onBack }: SentencePartSelectProps) {
  const { t } = useTranslation()
  const parts = Array.from({ length: partCount(total) }, (_, i) => i + 1)
  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow={level.subtitle}
        title={`${level.title} — ${t(`${ns}.sentences.title`)}`}
        subtitle={t(`${ns}.sentences.levelCount`, { count: total, parts: parts.length })}
        backLabel={t(`${ns}.sentences.allLevels`)}
        onBack={onBack}
      />
      <div className="choice-grid">
        {parts.map((part) => {
          const from = (part - 1) * SENTENCES_PER_PART + 1
          const to = Math.min(part * SENTENCES_PER_PART, total)
          return (
            <button key={part} type="button" className="choice" onClick={() => onSelect(part)}>
              <ArrowRightOutlined className="choice-arrow" />
              <span className="choice-mark">{t(`${ns}.sentences.partLabel`)}</span>
              <span className="choice-code">{part}</span>
              <span className="choice-meta">{t(`${ns}.sentences.partRange`, { from, to })}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
