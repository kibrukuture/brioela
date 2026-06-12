# Draft: log.receipt.memory.event.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/log.receipt.memory.event.helper.ts`

**Source:** `implementable-specs/01-memory-event.md`, `_features/05-brain-memory-tools/spec.md`

---

```typescript
import type { BrainDb } from '@/agents/brain/_types/brain.db'
import { appendMemoryEvent } from '@/agents/brain/_rpc/append.memory.event.rpc'

export async function logReceiptIngestedMemoryEvent(input: {
  db: BrainDb
  userId: string
  receiptId: string
  merchantName: string | null
  total: number
  currency: string
  lineCount: number
  matchedLineCount: number
  capturedAt: number
  geoHash: string | null
  sessionId: string | null
}): Promise<void> {
  await appendMemoryEvent(input.db, {
    userId: input.userId,
    kind: 'receipt_ingested',
    payload: {
      receipt_id: input.receiptId,
      merchant_name: input.merchantName,
      total: input.total,
      currency: input.currency,
      line_count: input.lineCount,
      matched_line_count: input.matchedLineCount,
    },
    capturedAt: input.capturedAt,
    source: 'receipt',
    sessionId: input.sessionId,
    entityKind: 'receipt',
    entityId: input.receiptId,
    geoHash: input.geoHash,
  })
}
```

**Path:** System `appendMemoryEvent` RPC — not LLM `log_memory_event` tool.
