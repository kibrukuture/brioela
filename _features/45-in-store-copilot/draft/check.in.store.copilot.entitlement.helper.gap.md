# Draft: check.in.store.copilot.entitlement.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/check.in.store.copilot.entitlement.helper.ts`

**Gap:** No tier gate for co-pilot session start (G32/G33).

**Source:** `_features/43-pricing-tiers/draft/check.usage.limit.helper.gap.md`, spec 45

---

```typescript
import type { Env } from '@/types/env'
import { checkUsageLimit } from './check.usage.limit.helper'
import { loadUserEntitlement } from './load.user.entitlement.helper'

export type InStoreCopilotEntitlementResult = {
  allowed: boolean
  reason?: 'tier_too_low' | 'monthly_cap_reached'
  minimumTier: 'culina'
}

export async function checkInStoreCopilotEntitlement(
  env: Env,
  userId: string,
): Promise<InStoreCopilotEntitlementResult> {
  const entitlement = await loadUserEntitlement(env, userId)
  const usage = checkUsageLimit(entitlement, 'in_store_copilot')

  if (!usage.allowed) {
    return {
      allowed: false,
      reason:
        entitlement.tier === 'sapor' || entitlement.tier === 'luma'
          ? 'tier_too_low'
          : 'monthly_cap_reached',
      minimumTier: 'culina',
    }
  }

  return { allowed: true, minimumTier: 'culina' }
}
```
