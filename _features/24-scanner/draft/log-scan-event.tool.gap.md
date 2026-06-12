# Gap snapshot: log-scan-event.ts (Brain DO)

Target: `tools/product-scan/log-scan-event.ts`

**Status:** Not in repo. From `build-guide/07-scanner/01-barcode-decode.md` + `implementable-specs/01-memory-event.md`.

---

```typescript
import type { DrizzleDB } from '@/types/db'
import { memoryEvents } from '@/agents/brain/_schemas/memory.event.schema'

export type LogScanEventInput = {
  scanEventId: string
  productId: string
  productName: string
  verdict: 'green' | 'yellow' | 'red'
  geoHash: string | null
  capturedAt: number
}

export async function logScanEvent(
  db: DrizzleDB,
  userId: string,
  input: LogScanEventInput,
): Promise<void> {
  await db.insert(memoryEvents).values({
    id: crypto.randomUUID(),
    userId,
    kind: 'product_scanned',
    entityKind: 'product',
    entityId: input.productId,
    payloadJson: JSON.stringify({
      scanEventId: input.scanEventId,
      productName: input.productName,
      verdict: input.verdict,
      geoHash: input.geoHash,
      capturedAt: input.capturedAt,
    }),
    createdAt: Date.now(),
  })
}
```

**Consumers:** **32** illness detective food window; **12** behavior pattern detection; recall uses Supabase `scan_events` not this table.
