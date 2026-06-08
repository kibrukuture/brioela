import type { LexiconWord } from '../../_types'

export const globalTimeLexicon: LexiconWord[] = [
  { word: 'time', kind: 'domain', scopes: ['global'], meaning: 'Temporal concept used for timestamps and clocks.' },
  { word: 'checked', kind: 'domain', scopes: ['global'], meaning: 'Time or value after a validation check ran.' },
  { word: 'created', kind: 'domain', scopes: ['global'], meaning: 'Creation time for an owned record.' },
  { word: 'now', kind: 'domain', scopes: ['global'], meaning: 'Current point in time.' },
]
