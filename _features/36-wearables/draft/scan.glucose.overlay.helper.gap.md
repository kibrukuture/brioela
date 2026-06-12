# Draft: build.glucose.verdict.overlay.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/product-scan/build.glucose.verdict.overlay.helper.ts`

**Consumer feature:** **24** scanner — additive overlay after allergy/safety verdict.

**Source:** `build-guide/20-wearables/05-feature-integration.md`, `04-cgm-food-response.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { readUserMemoryByKey } from '@/agents/brain/_repositories/read.user.memory.by.key.repository'

export type GlucoseVerdictOverlay = {
  kind: 'personal_glucose_high' | 'personal_glucose_flat' | 'no_personal_data'
  line: string
  confidence: number
  hideable: true
}

type OverlayInput = {
  userId: string
  productId: string
  userHiddenGlucoseOverlays: boolean
}

export async function buildGlucoseVerdictOverlay(
  db: BrainSqlite,
  input: OverlayInput,
): Promise<GlucoseVerdictOverlay | null> {
  if (input.userHiddenGlucoseOverlays) return null

  const memory = await readUserMemoryByKey(db, {
    userId: input.userId,
    namespace: 'health.glucose',
    key: 'spike_triggers',
  })
  if (!memory?.isActive) {
    return {
      kind: 'no_personal_data',
      line: 'No personal glucose data yet.',
      confidence: 1,
      hideable: true,
    }
  }

  const value = JSON.parse(memory.value) as {
    triggers?: Record<
      string,
      { averagePeakDeltaMgdl: number; confidence: number; entityName: string }
    >
  }
  const trigger = value.triggers?.[input.productId]
  if (!trigger || trigger.confidence < 0.6) {
    return {
      kind: 'no_personal_data',
      line: 'No personal glucose data yet.',
      confidence: 1,
      hideable: true,
    }
  }

  if (trigger.averagePeakDeltaMgdl >= 35) {
    return {
      kind: 'personal_glucose_high',
      line: 'Your past glucose response to this product has been high.',
      confidence: trigger.confidence,
      hideable: true,
    }
  }

  return {
    kind: 'personal_glucose_flat',
    line: 'This has been a flatter option for you than similar snacks.',
    confidence: trigger.confidence,
    hideable: true,
  }
}
```

**Blocked language:** no diagnosis, insulin, emergency alerts. Threshold constants product-tuned at implementation — not invented here beyond build-guide observational copy.
