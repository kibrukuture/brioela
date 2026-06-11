# Draft: _helpers/create.violation.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/create.violation.helper.ts`

```typescript
import type ts from 'typescript'
import { getNodeLocation } from './source.location.helper'
import type { LexiconViolation } from '../_types'

export function createViolation(input: {
  rule: string
  repoPath: string
  sourceFile: ts.SourceFile
  node: ts.Node
  message: string
  suggestion?: string
}): LexiconViolation {
  const location = getNodeLocation(input.sourceFile, input.node)

  return {
    rule: input.rule,
    path: input.repoPath,
    line: location.line,
    column: location.column,
    message: input.message,
    suggestion: input.suggestion,
  }
}
```
