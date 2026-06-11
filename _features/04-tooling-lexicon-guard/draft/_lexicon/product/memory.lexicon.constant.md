# Draft: _lexicon/product/memory.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/product/memory.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const productMemoryLexicon: LexiconWord[] = [
  { word: 'captured', kind: 'domain', scopes: ['product'], meaning: 'Time when a user event actually happened, which may differ from storage ingestion time.' },
  { word: 'ingested', kind: 'domain', scopes: ['product'], meaning: 'Time when an event was written into Brain storage.' },
]
```
