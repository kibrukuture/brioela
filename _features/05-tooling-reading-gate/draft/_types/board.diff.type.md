# Draft: _types/board.diff.type.ts

Target: `tools/brioela-reading-gate/_types/board.diff.type.ts`

```typescript
import type { BoardViolation } from './board.violation.type'

export type BoardDiff = {
  added: BoardViolation[]
  fixed: BoardViolation[]
  kept: BoardViolation[]
}
```
