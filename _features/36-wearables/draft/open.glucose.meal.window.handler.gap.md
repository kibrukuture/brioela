# Draft: open.glucose.meal.window.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/open.glucose.meal.window.handler.ts`

**Gap:** Called from scan pipeline when CGM connection active. Opens 2-hour window.

**Source:** `build-guide/20-wearables/04-cgm-food-response.md`

---

```typescript
import { randomUUID } from 'node:crypto'
import type { BrainSqlite } from '@/agents/brain/types'
import { readActiveGlucoseConnection } from '@/agents/brain/_repositories/read.active.glucose.connection.repository'
import { writeGlucoseMealWindow } from '@/agents/brain/_repositories/write.glucose.meal.window.repository'

const WINDOW_MS = 2 * 60 * 60 * 1000

type OpenInput = {
  userId: string
  scanEventId: string
  productId: string | null
  openedAt?: number
}

type OpenResult =
  | { opened: false; reason: 'no_cgm_connection' | 'window_already_open' }
  | { opened: true; windowId: string; closesAt: number }

export async function openGlucoseMealWindow(
  db: BrainSqlite,
  input: OpenInput,
): Promise<OpenResult> {
  const connection = await readActiveGlucoseConnection(db, { userId: input.userId })
  if (!connection) {
    return { opened: false, reason: 'no_cgm_connection' }
  }

  const openedAt = input.openedAt ?? Date.now()
  const windowId = randomUUID()
  const closesAt = openedAt + WINDOW_MS

  const inserted = await writeGlucoseMealWindow(db, {
    windowId,
    userId: input.userId,
    scanEventId: input.scanEventId,
    productId: input.productId,
    connectionId: connection.connectionId,
    status: 'open',
    derivedJson: JSON.stringify({ readingCount: 0, attributionFlags: [], evidenceWindowIds: [] }),
    confidence: 0,
    openedAt,
    closesAt,
    capturedAt: openedAt,
    createdAt: openedAt,
    updatedAt: openedAt,
  })

  if (!inserted) {
    return { opened: false, reason: 'window_already_open' }
  }

  return { opened: true, windowId, closesAt }
}
```

**Consumer:** `on.product.scan.open.glucose.window.helper.ts` — wired from **24** scan completion path.
