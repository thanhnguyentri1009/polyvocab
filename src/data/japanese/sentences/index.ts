import type { JlptLevel } from '../types'
import type { JapaneseSentence } from './types'
import { STARTER_SENTENCES } from './starter'
import { N5_SENTENCES } from './n5'
import { N4_SENTENCES } from './n4'
import { N3_SENTENCES } from './n3'
import { N2_SENTENCES } from './n2'
import { N1_SENTENCES } from './n1'

export type { JapaneseSentence, JapaneseSentenceComponent } from './types'

export const JAPANESE_SENTENCES: Record<JlptLevel, JapaneseSentence[]> = {
  STARTER: STARTER_SENTENCES,
  N5: N5_SENTENCES,
  N4: N4_SENTENCES,
  N3: N3_SENTENCES,
  N2: N2_SENTENCES,
  N1: N1_SENTENCES,
}
