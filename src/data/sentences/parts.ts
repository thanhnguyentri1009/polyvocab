// Each sentence level is split into fixed-size parts, the way vocabulary is
// learned in batches.
export const SENTENCES_PER_PART = 10

export function partCount(total: number) {
  return Math.ceil(total / SENTENCES_PER_PART)
}

// `part` is 1-based, matching the URL segment.
export function sentencesInPart<T>(list: T[], part: number): T[] {
  return list.slice((part - 1) * SENTENCES_PER_PART, part * SENTENCES_PER_PART)
}
