import type { LexiconWord } from '../../_types'

export const productJsonLexicon: LexiconWord[] = [
  { word: 'value', kind: 'domain', scopes: ['product'], meaning: 'JSON value — the recursive union of literals, arrays, and objects.' },
  { word: 'literal', kind: 'domain', scopes: ['product'], meaning: 'JSON literal primitive — string, number, boolean, or null.' },
]
