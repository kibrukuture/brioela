# Draft: gate.state.store.ts

Target: `tools/brioela-reading-gate/gate.state.store.ts`

```typescript
import type { GateBoard } from './_types'

let previousBoard: GateBoard | null = null
const verdictRuns: number[] = []
const watchStreams = new Set<ReadableStreamDefaultController<Uint8Array>>()

export function readPreviousBoard(): GateBoard | null {
  return previousBoard
}

export function writeBoardState(board: GateBoard): void {
  previousBoard = board
  verdictRuns.push(board.violations.length)
  if (verdictRuns.length > 12) verdictRuns.shift()
}

export function listVerdictRuns(): number[] {
  return [...verdictRuns]
}

export function addWatchStream(stream: ReadableStreamDefaultController<Uint8Array>): void {
  watchStreams.add(stream)
}

export function deleteWatchStream(stream: ReadableStreamDefaultController<Uint8Array>): void {
  watchStreams.delete(stream)
}

export function writeWatchText(text: string): void {
  const bytes = new TextEncoder().encode(text)
  for (const stream of watchStreams) {
    try {
      stream.enqueue(bytes)
    } catch (error) {
      watchStreams.delete(stream)
      if (!(error instanceof Error)) throw error
    }
  }
}
```
