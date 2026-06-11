# Draft: _lexicon/product/migration.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/product/migration.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const productMigrationLexicon: LexiconWord[] = [
  { word: 'phase', kind: 'domain', scopes: ['product'], meaning: 'Migration rollout stage such as expand, backfill, verify, or contract.' },
  { word: 'readiness', kind: 'domain', scopes: ['product'], meaning: 'Verified ability for a runtime area to safely proceed.' },
  { word: 'results', kind: 'domain', scopes: ['product'], meaning: 'Many recorded outcomes from a product verification or smoke run.' },
  { word: 'runs', kind: 'domain', scopes: ['product'], meaning: 'Many executions of a product operation such as a migration.' },
  { word: 'version', kind: 'domain', scopes: ['product'], meaning: 'One numbered product schema or skill history revision.' },
  { word: 'versions', kind: 'domain', scopes: ['product'], meaning: 'Many numbered product schema or skill history revisions.' },
]
```
