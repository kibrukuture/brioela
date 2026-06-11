# Draft: _lexicon/backend.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/backend.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../_types'
import { backendCloudflareLexicon, backendDatabaseLexicon, backendExecutableLexicon } from './backend'

export const backendLexicon: LexiconWord[] = [...backendCloudflareLexicon, ...backendDatabaseLexicon, ...backendExecutableLexicon]
```
