import type { LexiconWord } from '../../_types'

export const globalGrammarLexicon: LexiconWord[] = [
  { word: 'at', kind: 'grammar', scopes: ['global'], meaning: 'Time relation word in timestamp identifiers.' },
  { word: 'default', kind: 'grammar', scopes: ['global'], meaning: 'Language-level default export or default branch.' },
  { word: 'for', kind: 'grammar', scopes: ['global'], meaning: 'Relation word naming a target use.' },
  { word: 'from', kind: 'grammar', scopes: ['global'], meaning: 'Source relation word in imported identifiers.' },
  { word: 'grammar', kind: 'domain', scopes: ['global'], meaning: 'Controlled lexicon category for relation words.' },
  { word: 'inside', kind: 'grammar', scopes: ['global'], meaning: 'Path or AST containment relationship.' },
  { word: 'nearby', kind: 'grammar', scopes: ['global'], meaning: 'Adjacent or parent-scope proximity relationship.' },
  { word: 'null', kind: 'grammar', scopes: ['global'], meaning: 'Intentional empty value.' },
  { word: 'to', kind: 'grammar', scopes: ['global'], meaning: 'Destination relation word in mapper names.' },
  { word: 'with', kind: 'grammar', scopes: ['global'], meaning: 'Association relation word in helper names.' },
]
