export type SentenceCategory =
  | 'daily_life'
  | 'nature'
  | 'food'
  | 'work'
  | 'travel'
  | 'family'

export type SentenceDifficulty = 'starter' | 'basic' | 'advanced'

export const SENTENCE_DIFFICULTIES: SentenceDifficulty[] = ['starter', 'basic', 'advanced']

export const DIFFICULTY_COLORS: Record<SentenceDifficulty, string> = {
  starter: '#d48a1c',
  basic: '#4caf7d',
  advanced: '#7c5cbf',
}

export type SentenceComponentType =
  | 'subject'
  | 'verb'
  | 'object'
  | 'time'
  | 'place'
  | 'particle'
  | 'adjective'
  | 'adverb'
  | 'other'

export interface SentenceCategoryInfo {
  key: SentenceCategory
  icon: string
  labelEn: string
  labelVi: string
}

export const SENTENCE_CATEGORIES: SentenceCategoryInfo[] = [
  { key: 'daily_life', icon: '🏠', labelEn: 'Daily Life', labelVi: 'Cuộc sống hàng ngày' },
  { key: 'nature', icon: '🌿', labelEn: 'Nature', labelVi: 'Thiên nhiên' },
  { key: 'food', icon: '🍜', labelEn: 'Food & Drink', labelVi: 'Ẩm thực' },
  { key: 'work', icon: '💼', labelEn: 'Work & Study', labelVi: 'Công việc & Học tập' },
  { key: 'travel', icon: '✈️', labelEn: 'Travel', labelVi: 'Du lịch' },
  { key: 'family', icon: '👨‍👩‍👧', labelEn: 'Family', labelVi: 'Gia đình' },
]

export const COMPONENT_COLORS: Record<SentenceComponentType, string> = {
  subject: '#5b8ecf',
  verb: '#e05a5a',
  object: '#4caf7d',
  time: '#e8a838',
  place: '#3daaaa',
  particle: '#999999',
  adjective: '#9c5bd0',
  adverb: '#5b78cf',
  other: '#888888',
}

export const COMPONENT_LABEL_EN: Record<SentenceComponentType, string> = {
  subject: 'Subject',
  verb: 'Verb',
  object: 'Object',
  time: 'Time',
  place: 'Place',
  particle: 'Particle',
  adjective: 'Adjective',
  adverb: 'Adverb',
  other: 'Other',
}

export const COMPONENT_LABEL_VI: Record<SentenceComponentType, string> = {
  subject: 'Chủ ngữ',
  verb: 'Động từ',
  object: 'Tân ngữ',
  time: 'Thời gian',
  place: 'Địa điểm',
  particle: 'Trợ từ',
  adjective: 'Tính từ',
  adverb: 'Trạng từ',
  other: 'Khác',
}
