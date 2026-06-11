# Draft: _lexicon/product.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/product.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../_types'
import {
  productBrainLexicon,
  productConstraintsLexicon,
  productFoodLexicon,
  productJsonLexicon,
  productMemoryLexicon,
  productMigrationLexicon,
  productSessionsLexicon,
  productSkillsLexicon,
} from './product'

export const productLexicon: LexiconWord[] = [
  ...productBrainLexicon,
  ...productConstraintsLexicon,
  ...productFoodLexicon,
  ...productJsonLexicon,
  ...productMemoryLexicon,
  ...productMigrationLexicon,
  ...productSessionsLexicon,
  ...productSkillsLexicon,
]
```
