# Gap snapshot: classify.match.confidence.helper.ts

Target: `backend/src/jobs/recall/_helpers/classify.match.confidence.helper.ts`

**Status:** Not in repo. From `build-guide/15-recall-alerts/02-recall-matching.md`, spec 26 edge cases.

---

```typescript
import type { MatchConfidence } from '@shared/validator/recall/recall.alert.schema'
import type { RecallEntry } from '@shared/drizzle/schema/recall.schema'

const PROBABLE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export type ClassifyMatchInput = {
  recall: Pick<RecallEntry, 'lotNumbersJson' | 'issuedAt' | 'expiresAt'>
  scannedAt: Date
  scannedLot: string | null
}

export function classifyMatchConfidence(input: ClassifyMatchInput): MatchConfidence {
  const { recall, scannedAt, scannedLot } = input
  const lots = recall.lotNumbersJson ?? []
  const allLotsRecalled = lots.length === 0
  const withinDateWindow = isWithinAffectedDateRange(scannedAt, recall.issuedAt, recall.expiresAt)
  const withinProbableWindow = Date.now() - scannedAt.getTime() <= PROBABLE_WINDOW_MS

  if (!withinProbableWindow && !withinDateWindow) {
    return 'informational'
  }

  if (scannedLot && lots.length > 0) {
    const lotInRecall = lots.some((l) => normalizeLot(l) === normalizeLot(scannedLot))
    if (!lotInRecall) {
      return 'informational'
    }
    if (withinDateWindow || withinProbableWindow) {
      return 'confirmed'
    }
  }

  if (allLotsRecalled || !scannedLot) {
    if (withinProbableWindow) {
      return 'probable'
    }
  }

  if (withinDateWindow && scannedLot && lots.length > 0) {
    return 'confirmed'
  }

  return 'informational'
}

function isWithinAffectedDateRange(
  scannedAt: Date,
  issuedAt: Date,
  expiresAt: Date | null,
): boolean {
  if (scannedAt < issuedAt) return false
  if (expiresAt && scannedAt > expiresAt) return false
  return true
}

function normalizeLot(lot: string): string {
  return lot.trim().toUpperCase()
}
```

**Copy rule:** Only `confirmed` may use "you have this" language in push body (**03-critical-notification.md**).
