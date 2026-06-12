# Draft: on.scan.craving.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/craving-decoder/on.scan.craving.context.helper.ts`

**Gap:** No scan hook for craving-context signature (late-night comfort repeat).

**Source:** `brioela-specs/52-craving-decoder.md` In Scope, spec **17** stress-eating

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { memoryEvent } from '@/agents/brain/_schemas'
import { and, desc, eq, gte } from 'drizzle-orm'

const COMFORT_CATEGORIES = new Set(['chocolate', 'chips', 'candy', 'ice_cream', 'cookies', 'soda'])

export type ScanCravingContextInput = {
  userId: string
  productId: string
  productCategory: string
  localHour: number
  userEngagedScanScreen: boolean
  nowMs?: number
}

export type ScanCravingContext = {
  isCravingContext: boolean
  repeatComfortScanThisWeek: number
  isLateNight: boolean
}

export async function evaluateScanCravingContext(
  db: BrainSqlite,
  input: ScanCravingContextInput,
): Promise<ScanCravingContext> {
  const nowMs = input.nowMs ?? Date.now()
  const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000
  const isLateNight = input.localHour >= 22 || input.localHour < 5
  const isComfort = COMFORT_CATEGORIES.has(input.productCategory.toLowerCase())

  if (!input.userEngagedScanScreen || !isComfort) {
    return { isCravingContext: false, repeatComfortScanThisWeek: 0, isLateNight }
  }

  const scans = await db
    .select({ id: memoryEvent.id, payloadJson: memoryEvent.payloadJson })
    .from(memoryEvent)
    .where(
      and(
        eq(memoryEvent.userId, input.userId),
        eq(memoryEvent.kind, 'product_scanned'),
        gte(memoryEvent.capturedAt, weekAgo),
      ),
    )
    .orderBy(desc(memoryEvent.capturedAt))
    .limit(50)

  let comfortCount = 0
  for (const scan of scans) {
    const payload = JSON.parse(scan.payloadJson) as { category?: string }
    if (payload.category && COMFORT_CATEGORIES.has(payload.category.toLowerCase())) {
      comfortCount += 1
    }
  }

  const isCravingContext = isLateNight && comfortCount >= 2

  return {
    isCravingContext,
    repeatComfortScanThisWeek: comfortCount,
    isLateNight,
  }
}
```

**Trigger rule:** Context alone does not run decode — user must ask or engage craving-shaped question on scan UI.
