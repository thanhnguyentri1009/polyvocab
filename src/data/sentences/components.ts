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
