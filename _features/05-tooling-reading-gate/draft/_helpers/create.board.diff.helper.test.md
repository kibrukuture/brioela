# Draft: _helpers/create.board.diff.helper.test.ts

Target: `tools/brioela-reading-gate/_helpers/create.board.diff.helper.test.ts`

```typescript
import { describe, expect, test } from 'bun:test'
import { createBoardDiff } from './create.board.diff.helper'
import type { BoardViolation, GateBoard } from '../_types'

function buildViolation(rule: string, path: string): BoardViolation {
  return { guard: 'lexicon', rule, path, line: 1, column: 1, text: `broke ${rule}`, suggestion: null }
}

function buildBoard(violations: BoardViolation[]): GateBoard {
  return { violations, checkedAtMs: 1_000, elapsedMs: 5 }
}

describe('createBoardDiff', () => {
  test('first board: everything is new', () => {
    const board = buildBoard([buildViolation('ban-any', 'a.ts')])
    const diff = createBoardDiff(null, board)
    expect(diff.added).toHaveLength(1)
    expect(diff.fixed).toHaveLength(0)
  })

  test('attributes added, fixed, and kept', () => {
    const first = buildBoard([buildViolation('ban-any', 'a.ts'), buildViolation('ban-in-operator', 'b.ts')])
    const second = buildBoard([buildViolation('ban-in-operator', 'b.ts'), buildViolation('folder-kebab-case', 'c')])
    const diff = createBoardDiff(first, second)
    expect(diff.added.map((violation) => violation.rule)).toEqual(['folder-kebab-case'])
    expect(diff.fixed.map((violation) => violation.rule)).toEqual(['ban-any'])
    expect(diff.kept.map((violation) => violation.rule)).toEqual(['ban-in-operator'])
  })
})
```
