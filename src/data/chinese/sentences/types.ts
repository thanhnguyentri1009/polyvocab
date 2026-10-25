import type { SentenceComponentType } from '../../sentences/components'

export interface ChineseSentenceComponent {
  text: string
  pinyin: string
  meaning: string
  vi: string
  type: SentenceComponentType
}

export interface ChineseSentence {
  id: string
  zh: string
  pinyin: string
  meaning: string
  vi: string
  components: ChineseSentenceComponent[]
}
