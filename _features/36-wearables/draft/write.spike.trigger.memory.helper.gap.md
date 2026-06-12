# Draft: write.spike.trigger.memory.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/write.spike.trigger.memory.helper.ts`

**Source:** `build-guide/20-wearables/04-cgm-food-response.md` — 3+ high-confidence windows

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { readHighConfidenceWindowsForProduct } from '@/agents/brain/_repositories/read.glucose.meal.windows.repository'
import { mergeUserMemory } from '@/agents/brain/_repositories/merge.user.memory.repository'

const MIN_WINDOWS = 3
const MIN_CONFIDENCE = 0.6

type SpikeTriggerValue = {
  entityKind: 'product' | 'ingredient' | 'recipe' | 'category'
  entityId: string | null
  entityName: string
  evidenceWindowIds: string[]
  averagePeakDeltaMgdl: number
  averageAuc: number
  confidence: number
  lastObservedAt: number
  source: 'wearable'
}

export async function evaluateAndWriteSpikeTrigger(
  db: BrainSqlite,
  input: {
    userId: string
    productId: string
    productName: string
  },
): Promise<{ written: boolean; reason?: string }> {
  const windows = await readHighConfidenceWindowsForProduct(db, {
    userId: input.userId,
    productId: input.productId,
    minConfidence: MIN_CONFIDENCE,
    limit: 20,
  })

  if (windows.length < MIN_WINDOWS) {
    return { written: false, reason: 'insufficient_windows' }
  }

  const peakDeltas = windows
    .map((w) => (w.peakMgdl != null && w.baselineMgdl != null ? w.peakMgdl - w.baselineMgdl : null))
    .filter((v): v is number => v != null)

  const aucs = windows.map((w) => w.auc).filter((v): v is number => v != null)

  if (peakDeltas.length < MIN_WINDOWS) {
    return { written: false, reason: 'insufficient_peak_data' }
  }

  const averagePeakDeltaMgdl =
    peakDeltas.reduce((sum, v) => sum + v, 0) / peakDeltas.length
  const averageAuc = aucs.length > 0 ? aucs.reduce((sum, v) => sum + v, 0) / aucs.length : 0
  const confidence = Math.min(
    0.95,
    windows.reduce((sum, w) => sum + w.confidence, 0) / windows.length,
  )

  const value: SpikeTriggerValue = {
    entityKind: 'product',
    entityId: input.productId,
    entityName: input.productName,
    evidenceWindowIds: windows.map((w) => w.windowId),
    averagePeakDeltaMgdl,
    averageAuc,
    confidence,
    lastObservedAt: Math.max(...windows.map((w) => w.capturedAt)),
    source: 'wearable',
  }

  await mergeUserMemory(db, {
    userId: input.userId,
    namespace: 'health.glucose',
    key: 'spike_triggers',
    value: {
      triggers: {
        [input.productId]: value,
      },
    },
    confidence,
    source: 'wearable',
  })

  return { written: true }
}
```
