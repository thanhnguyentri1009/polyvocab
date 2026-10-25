import type { HskLevel } from '../types'
import type { ChineseSentence } from './types'
import { STARTER_SENTENCES } from './starter'
import { HSK1_SENTENCES } from './hsk1'
import { HSK2_SENTENCES } from './hsk2'
import { HSK3_SENTENCES } from './hsk3'
import { HSK4_SENTENCES } from './hsk4'
import { HSK5_SENTENCES } from './hsk5'
import { HSK6_SENTENCES } from './hsk6'

export type { ChineseSentence, ChineseSentenceComponent } from './types'

export const CHINESE_SENTENCES: Record<HskLevel, ChineseSentence[]> = {
  STARTER: STARTER_SENTENCES,
  HSK1: HSK1_SENTENCES,
  HSK2: HSK2_SENTENCES,
  HSK3: HSK3_SENTENCES,
  HSK4: HSK4_SENTENCES,
  HSK5: HSK5_SENTENCES,
  HSK6: HSK6_SENTENCES,
}
