import { backendLexicon, globalLexicon, productLexicon, toolsLexicon } from '../_lexicon'
import type { LexiconWord } from '../_types'

export type LoadedLexicon = {
  words: Map<string, LexiconWord>
}

export function loadLexicon(scopes: string[]): LoadedLexicon {
  const scopeSet = new Set(scopes)
  const words = new Map<string, LexiconWord>()

  for (const entry of [...globalLexicon, ...backendLexicon, ...productLexicon, ...toolsLexicon]) {
    if (!entry.scopes.some((scope) => scopeSet.has(scope))) continue
    words.set(entry.word, entry)
  }

  return { words }
}
