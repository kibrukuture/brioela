# Draft: _policies/lexicon.guard.policy.ts

Target: `tools/brioela-lexicon-guard/_policies/lexicon.guard.policy.ts`

```typescript
import type ts from 'typescript'
import type { LexiconViolation } from '../_types'

export type LexiconPolicyContext = {
  repoPath: string
  sourceFile: ts.SourceFile
}

export type LexiconPolicy = (context: LexiconPolicyContext) => LexiconViolation[]
```
