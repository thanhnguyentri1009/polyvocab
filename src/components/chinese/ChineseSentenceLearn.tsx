import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChineseSentence } from '../../data/chinese/sentences'
import { COMPONENT_COLORS, COMPONENT_LABEL_EN, COMPONENT_LABEL_VI, DIFFICULTY_COLORS, SENTENCE_CATEGORIES, type SentenceCategory, type SentenceDifficulty } from '../../data/sentences/categories'
import { speak } from '../../utils/speech'

interface ChineseSentenceLearnProps {
  sentences: ChineseSentence[]
  category: SentenceCategory
  difficulty: SentenceDifficulty
  onBack: () => void
}

export default function ChineseSentenceLearn({
  sentences,
  category,
  difficulty,
  onBack,
}: ChineseSentenceLearnProps) {
  const { t, i18n } = useTranslation()
  const isVi = i18n.language.startsWith('vi')
  const [index, setIndex] = useState(0)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const sentence = sentences[index]
  const catInfo = SENTENCE_CATEGORIES.find(c => c.key === category)
  const diffColor = DIFFICULTY_COLORS[difficulty]
  const diffLabel = t(`chinese.sentences.${difficulty}`)

  const handlePrev = () => {
    setIndex(i => Math.max(0, i - 1))
    setShowBreakdown(false)
  }

  const handleNext = () => {
    setIndex(i => Math.min(sentences.length - 1, i + 1))
    setShowBreakdown(false)
  }

  const handleSpeak = () => {
    speak(sentence.zh, 'zh-CN')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: '#888',
            padding: '4px 0',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← {t('chinese.sentences.backToCategories')}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>
          {index + 1} / {sentences.length}
        </span>
      </div>

      {/* Category + difficulty badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>{catInfo?.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>
          {isVi ? catInfo?.labelVi : catInfo?.labelEn}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: diffColor,
            background: diffColor + '18',
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          {diffLabel}
        </span>
      </div>

      {/* Sentence card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e8e6e0',
          borderRadius: 16,
          padding: '24px 20px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h2
            lang="zh-CN"
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#222',
              margin: 0,
              lineHeight: 1.5,
              fontFamily: 'serif',
              flex: 1,
            }}
          >
            {sentence.zh}
          </h2>
          <button
            type="button"
            onClick={handleSpeak}
            aria-label="Listen"
            style={{
              background: 'none',
              border: '1px solid #e0ddd7',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 16,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            🔊
          </button>
        </div>

        <div style={{ fontSize: 14, color: '#888', fontStyle: 'italic', marginTop: 8 }}>
          {sentence.pinyin}
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ede7' }}>
          <div style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>
            {isVi ? sentence.vi : sentence.meaning}
          </div>
          {isVi && (
            <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
              {sentence.meaning}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown toggle */}
      <button
        type="button"
        onClick={() => setShowBreakdown(v => !v)}
        style={{
          width: '100%',
          background: showBreakdown ? '#f7f5f0' : '#fff',
          border: '1px solid #e8e6e0',
          borderRadius: 12,
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#555',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span>📖 {t('chinese.sentences.breakdownTitle')}</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>{showBreakdown ? '▲' : '▼'}</span>
      </button>

      {showBreakdown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {sentence.components.map((comp, i) => {
            const color = COMPONENT_COLORS[comp.type]
            const typeLabel = isVi ? COMPONENT_LABEL_VI[comp.type] : COMPONENT_LABEL_EN[comp.type]
            return (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: `1px solid ${color}33`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 52, textAlign: 'center' }}>
                  <div
                    lang="zh-CN"
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#222',
                      fontFamily: 'serif',
                      lineHeight: 1.3,
                    }}
                  >
                    {comp.text}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
                    {comp.pinyin}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>
                    {isVi ? comp.vi : comp.meaning}
                  </div>
                  {isVi && (
                    <div style={{ fontSize: 12, color: '#aaa' }}>{comp.meaning}</div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color,
                    background: color + '18',
                    borderRadius: 6,
                    padding: '2px 7px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {typeLabel}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          style={{
            flex: 1,
            padding: '12px',
            background: index === 0 ? '#f7f5f0' : '#fff',
            border: '1px solid #e8e6e0',
            borderRadius: 10,
            cursor: index === 0 ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: index === 0 ? '#ccc' : '#555',
            fontFamily: 'inherit',
          }}
        >
          ← {t('chinese.sentences.prev')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={index === sentences.length - 1}
          style={{
            flex: 1,
            padding: '12px',
            background: index === sentences.length - 1 ? '#f7f5f0' : '#c0392b',
            border: index === sentences.length - 1 ? '1px solid #e8e6e0' : 'none',
            borderRadius: 10,
            cursor: index === sentences.length - 1 ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: index === sentences.length - 1 ? '#ccc' : '#fff',
            fontFamily: 'inherit',
          }}
        >
          {t('chinese.sentences.next')} →
        </button>
      </div>
    </div>
  )
}
