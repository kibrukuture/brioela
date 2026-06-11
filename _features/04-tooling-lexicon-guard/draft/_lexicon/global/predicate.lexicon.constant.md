# Draft: _lexicon/global/predicate.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/global/predicate.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const globalPredicateLexicon: LexiconWord[] = [
  { word: 'active', kind: 'predicate', scopes: ['global'], meaning: 'A state that is currently in force.' },
  { word: 'has', kind: 'predicate', scopes: ['global'], meaning: 'Owns or contains a value.' },
  { word: 'initial', kind: 'predicate', scopes: ['global'], meaning: 'Starting state required by a runtime lifecycle.' },
  { word: 'is', kind: 'predicate', scopes: ['global'], meaning: 'Boolean identity or state check.' },
  { word: 'own', kind: 'predicate', scopes: ['global'], meaning: 'Directly held by an object, not inherited.' },
  { word: 'pending', kind: 'predicate', scopes: ['global'], meaning: 'Waiting to be processed.' },
  { word: 'predicate', kind: 'domain', scopes: ['global'], meaning: 'Boolean meaning word.' },
  { word: 'ready', kind: 'predicate', scopes: ['global'], meaning: 'Initialized and available for runtime use.' },
]
```
