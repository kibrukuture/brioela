# Draft: _types/gate.board.type.ts

Target: `tools/brioela-reading-gate/_types/gate.board.type.ts`

```typescript
import type { BoardViolation } from './board.violation.type'

export type GateBoard = {
  violations: BoardViolation[]
  checkedAtMs: number
  elapsedMs: number
}
```
