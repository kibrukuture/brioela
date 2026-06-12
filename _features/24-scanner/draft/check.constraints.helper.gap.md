# Gap snapshot: check.constraints.helper.ts

Target: `backend/src/api/scan/_helpers/check.constraints.helper.ts`

**Status:** Not in repo. From `build-guide/07-scanner/03-constraint-check.md`.

---

```typescript
import type { Env } from '@/types/env'
import type { ResolvedProductFactSnapshot } from '@brioela/shared/validator/product'
import type { ConstraintCheckResult } from '@/tools/product-scan/check-constraint'

export async function checkConstraints(
  product: ResolvedProductFactSnapshot,
  userId: string,
  env: Env,
): Promise<ConstraintCheckResult> {
  const brainId = env.BRAIN.idFromName(userId)
  const brain = env.BRAIN.get(brainId)

  const response = await brain.fetch(
    new Request('https://internal/check-constraints', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product }),
    }),
  )

  if (!response.ok) {
    console.error('Constraint check failed:', response.status)
    return {
      level: 'guardrails_unavailable',
      matches: [],
      medicationFoodInteractions: [],
      communityHealthAssociations: [],
    }
  }

  return response.json() as Promise<ConstraintCheckResult>
}
```

**Degraded rule:** Never return `clear` on failure — UI shows personal checks unavailable.

**Owner:** **07** implements matching inside Brain; **24** owns this RPC wrapper.
