# Gap snapshot: check.conditions.helper.ts

Target: `backend/src/api/scan/_helpers/check.conditions.helper.ts`

**Status:** Not in repo. **23** owns evaluation body; **24** orchestrates at resolve time. Cross-ref: `_features/23-medical-conditions/draft/check.product.conditions.helper.gap.md`.

---

```typescript
import type { Env } from '@/types/env'
import type { ConditionFlagResult } from '@brioela/shared/validator/scan'
import type { ResolvedProductFactSnapshot } from '@brioela/shared/validator/product'

export type ScanConditionEvaluation = {
  scanEventId: string
  userId: string
  conditionFlags: ConditionFlagResult[]
}

export async function checkConditions(
  product: ResolvedProductFactSnapshot,
  userId: string,
  scanEventId: string,
  env: Env,
): Promise<ScanConditionEvaluation> {
  const brainId = env.BRAIN.idFromName(userId)
  const brain = env.BRAIN.get(brainId)

  const response = await brain.fetch(
    new Request('https://internal/check-product-conditions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product, scanEventId }),
    }),
  )

  if (!response.ok) {
    return { scanEventId, userId, conditionFlags: [] }
  }

  return response.json() as Promise<ScanConditionEvaluation>
}
```

**MVP stub:** Return `{ conditionFlags: [] }` until **23** ships — do not block barcode path.

**Low confidence:** When `product.approvedForSafetyDecisions === false`, **23** returns uncertainty flags for hard conditions.
