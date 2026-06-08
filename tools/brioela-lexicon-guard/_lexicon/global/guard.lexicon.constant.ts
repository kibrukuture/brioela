import type { LexiconWord } from '../../_types'

export const globalGuardLexicon: LexiconWord[] = [
  { word: 'allowed', kind: 'predicate', scopes: ['global'], meaning: 'Permitted by a guard or policy.' },
  { word: 'baseline', kind: 'domain', scopes: ['global'], meaning: 'Recorded existing guard debt that must not expand.' },
  { word: 'bypass', kind: 'domain', scopes: ['global'], meaning: 'Code path that avoids an approved boundary.' },
  { word: 'clean', kind: 'predicate', scopes: ['global'], meaning: 'Having no guard violations.' },
  { word: 'empty', kind: 'predicate', scopes: ['global'], meaning: 'Having no items.' },
  { word: 'exists', kind: 'predicate', scopes: ['global'], meaning: 'Present in storage or runtime.' },
  { word: 'expected', kind: 'predicate', scopes: ['global'], meaning: 'Required by a generated check.' },
  { word: 'guard', kind: 'domain', scopes: ['global'], meaning: 'Hard gate that blocks illegal code or names.' },
  { word: 'invalid', kind: 'predicate', scopes: ['global'], meaning: 'Rejected by a validator or guard.' },
  { word: 'lexicon', kind: 'domain', scopes: ['global'], meaning: 'Controlled vocabulary for Brioela identifiers.' },
  { word: 'policy', kind: 'role', scopes: ['global'], meaning: 'One enforceable guard rule.' },
  { word: 'policies', kind: 'role', scopes: ['global'], meaning: 'Many enforceable guard rules.' },
  { word: 'stale', kind: 'predicate', scopes: ['global'], meaning: 'Out of sync with generated source of truth.' },
  { word: 'valid', kind: 'predicate', scopes: ['global'], meaning: 'Accepted by a parser or policy.' },
  { word: 'violation', kind: 'domain', scopes: ['global'], meaning: 'Specific guard failure.' },
  { word: 'violations', kind: 'domain', scopes: ['global'], meaning: 'Many specific guard failures.' },
]
