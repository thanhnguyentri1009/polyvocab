import type { SentenceComponentType } from '../../sentences/components'

export interface JapaneseSentenceComponent {
  text: string
  reading: string
  meaning: string
  vi: string
  type: SentenceComponentType
}

export interface JapaneseSentence {
  id: string
  jp: string
  reading: string
  romaji: string
  meaning: string
  vi: string
  components: JapaneseSentenceComponent[]
}
