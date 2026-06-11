# Draft: _types/board.violation.type.ts

Target: `tools/brioela-reading-gate/_types/board.violation.type.ts`

```typescript
export type BoardViolation = {
  guard: 'name' | 'type' | 'lexicon'
  rule: string
  path: string
  line: number
  column: number
  text: string
  suggestion: string | null
}
```
