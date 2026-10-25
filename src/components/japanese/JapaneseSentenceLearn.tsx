import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { JapaneseSentence } from '../../data/japanese/sentences'
import { COMPONENT_COLORS, COMPONENT_LABEL_EN, COMPONENT_LABEL_VI } from '../../data/sentences/components'
import { speak } from '../../utils/speech'

interface JapaneseSentenceLearnProps {
  sentences: JapaneseSentence[]
  levelTitle: string
  part: number
  onBack: () => void
  // Present when a following part exists; offered on the last sentence.
  onNextPart?: () => void
}

export default function JapaneseSentenceLearn({
  sentences,
  levelTitle,
  part,
  onBack,
  onNextPart,
}: JapaneseSentenceLearnProps) {
  const { t, i18n } = useTranslation()
  const isVi = i18n.language.startsWith('vi')
  const [index, setIndex] = useState(0)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showRomaji, setShowRomaji] = useState(false)

  const sentence = sentences[index]
  const isLast = index === sentences.length - 1
  const canAdvance = !isLast || !!onNextPart

  const handlePrev = () => {
    setIndex(i => Math.max(0, i - 1))
    setShowBreakdown(false)
  }

  const handleNext = () => {
    if (isLast) {
      onNextPart?.()
      return
    }
    setIndex(i => Math.min(sentences.length - 1, i + 1))
    setShowBreakdown(false)
  }

  const handleSpeak = () => {
    speak(sentence.jp, 'ja-JP')
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
          ← {t('japanese.sentences.backToParts')}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>
          {index + 1} / {sentences.length}
        </span>
      </div>

      {/* Level + part badge */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 16 }}>
        {levelTitle} · {t('japanese.sentences.part', { n: part })}
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
          <div style={{ flex: 1 }}>
            <h2
              lang="ja"
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#222',
                margin: 0,
                lineHeight: 1.6,
                flex: 1,
              }}
            >
              {sentence.jp}
            </h2>
            <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
              {sentence.reading}
            </div>
          </div>
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

        {/* Romaji toggle */}
        <button
          type="button"
          onClick={() => setShowRomaji(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: showRomaji ? '#2980b9' : '#bbb',
            fontFamily: 'inherit',
            padding: '4px 0',
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {showRomaji ? '▼' : '▶'} Romaji
        </button>
        {showRomaji && (
          <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 2 }}>
            {sentence.romaji}
          </div>
        )}

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
        <span>📖 {t('japanese.sentences.breakdownTitle')}</span>
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
                    lang="ja"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#222',
                      lineHeight: 1.4,
                    }}
                  >
                    {comp.text}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    {comp.reading}
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
          ← {t('japanese.sentences.prev')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance}
          style={{
            flex: 1,
            padding: '12px',
            background: !canAdvance ? '#f7f5f0' : '#2980b9',
            border: !canAdvance ? '1px solid #e8e6e0' : 'none',
            borderRadius: 10,
            cursor: !canAdvance ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: !canAdvance ? '#ccc' : '#fff',
            fontFamily: 'inherit',
          }}
        >
          {isLast && onNextPart ? t('japanese.sentences.nextPart') : t('japanese.sentences.next')} →
        </button>
      </div>
    </div>
  )
}
