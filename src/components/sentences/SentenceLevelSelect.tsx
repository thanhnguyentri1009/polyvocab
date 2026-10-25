import { ArrowRightOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { LevelInfo } from '../../data/english/vocabulary/topics'
import { partCount } from '../../data/sentences/parts'
import PageHeader from '../PageHeader'

interface SentenceLevelSelectProps {
  ns: 'chinese' | 'japanese'
  levels: LevelInfo[]
  sentences: Record<string, unknown[]>
  onSelect: (levelKey: string) => void
}

export default function SentenceLevelSelect({ ns, levels, sentences, onSelect }: SentenceLevelSelectProps) {
  const { t } = useTranslation()
  return (
    <div className="page page-wide">
      <PageHeader
        eyebrow={t('eyebrow.levels')}
        title={t(`${ns}.sentences.title`)}
        subtitle={t(`${ns}.sentences.subtitle`)}
      />
      <div className="choice-grid">
        {levels.map((level) => {
          const total = sentences[level.key]?.length ?? 0
          return (
            <button key={level.key} type="button" className="choice" onClick={() => onSelect(level.key)}>
              <ArrowRightOutlined className="choice-arrow" />
              <span className={level.title.length <= 7 ? 'choice-code' : 'choice-title'}>{level.title}</span>
              <span className="choice-sub">{level.subtitle}</span>
              <span className="choice-meta">
                {t(`${ns}.sentences.levelCount`, { count: total, parts: partCount(total) })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
