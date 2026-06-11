# Draft: _lexicon/tools.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/tools.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../_types'
import { toolsDaemonLexicon, toolsReadingGateLexicon } from './tools'

export const toolsLexicon: LexiconWord[] = [...toolsDaemonLexicon, ...toolsReadingGateLexicon]
```
