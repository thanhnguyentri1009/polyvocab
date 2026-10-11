import { useTranslation } from 'react-i18next'
import {
  DIFFICULTY_COLORS,
  SENTENCE_CATEGORIES,
  SENTENCE_DIFFICULTIES,
  type SentenceCategory,
  type SentenceDifficulty,
} from '../../data/sentences/categories'

interface SentenceCategorySelectProps {
  lang: 'zh' | 'jp'
  onSelect: (category: SentenceCategory, difficulty: SentenceDifficulty) => void
}

const DIFFICULTY_ICONS: Record<SentenceDifficulty, string> = {
  starter: '🌱',
  basic: '📗',
  advanced: '📘',
}

export default function SentenceCategorySelect({ lang, onSelect }: SentenceCategorySelectProps) {
  const { t, i18n } = useTranslation()
  const isVi = i18n.language.startsWith('vi')
  const accentColor = lang === 'zh' ? '#c0392b' : '#2980b9'
  const ns = lang === 'zh' ? 'chinese' : 'japanese'

  // Basic keeps the track's own accent; starter and advanced use their difficulty colour.
  const colorFor = (difficulty: SentenceDifficulty) =>
    difficulty === 'basic' ? accentColor : DIFFICULTY_COLORS[difficulty]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#222', margin: 0 }}>
          {t(`${ns}.sentences.title`)}
        </h2>
        <p style={{ fontSize: 14, color: '#888', marginTop: 4, marginBottom: 0 }}>
          {t(`${ns}.sentences.subtitle`)}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SENTENCE_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            style={{
              background: '#fff',
              border: '1px solid #e8e6e0',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderBottom: '1px solid #f0ede7',
              }}
            >
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>
                {isVi ? cat.labelVi : cat.labelEn}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {SENTENCE_DIFFICULTIES.map((difficulty, i) => {
                const color = colorFor(difficulty)
                return (
                  <button
                    key={difficulty}
                    type="button"
                    onClick={() => onSelect(cat.key, difficulty)}
                    style={{
                      flex: 1,
                      padding: '11px 8px',
                      border: 'none',
                      borderRight: i < SENTENCE_DIFFICULTIES.length - 1 ? '1px solid #f0ede7' : 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      color,
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = color + '0d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 14 }}>{DIFFICULTY_ICONS[difficulty]}</span>
                    {t(`${ns}.sentences.${difficulty}`)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
