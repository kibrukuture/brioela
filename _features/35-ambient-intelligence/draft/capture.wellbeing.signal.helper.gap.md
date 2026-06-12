# Draft: capture.wellbeing.signal.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/capture.wellbeing.signal.helper.ts`

**Gap (feature 35):** Transcript event → `wellbeing_signal` row with food context lookback. Never solicited.

**Source:** `brioela-specs/17-behavioral-food-pattern-detection.md`, `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`

---

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { WellbeingSignalType } from '@/agents/brain/_schemas/wellbeing.signal.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export type CaptureWellbeingSignalInput = {
  userId: string
  sourceSessionId: string
  signalType: WellbeingSignalType
  transcriptSnippet: string
}

export async function captureWellbeingSignal(
  database: BrainDatabase,
  input: CaptureWellbeingSignalInput,
): Promise<{ signalId: string }> {
  const now = readCurrentEpochMs()
  const signalId = createId()

  // TODO(05): load scan/receipt/recipe ids from last 12–48h via memory_event
  const foodContextJson = JSON.stringify({
    lookbackHours: 24,
    scanEventIds: [] as string[],
    receiptEventIds: [] as string[],
    recipeIds: [] as string[],
  })

  // TODO: insert into wellbeing_signal
  // Do NOT surface or create intervention candidate here — weekly pass only

  return { signalId }
}
```

Called from **29**/**20** transcript processors when organic wellbeing language detected.
