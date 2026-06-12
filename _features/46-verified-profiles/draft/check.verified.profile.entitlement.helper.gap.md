# Draft: check.verified.profile.entitlement.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/check.verified.profile.entitlement.helper.ts`

Source: `build-guide/23-verified-profiles/06-analytics-and-revenue.md`, `_features/43-pricing-tiers/spec.md`

Thin wrapper over **43** `checkTierAccess`.

---

```typescript
import { checkTierAccess } from '@/agents/brain/_helpers/pricing/check.tier.access.helper'
import type { TierAccessResult } from '@/shared/validator/pricing/user.entitlement.schema'

export type VerifiedProfileEntitlementAction =
  | 'verified_profile'
  | 'verified_business'
  | 'practitioner_multi_client'

export async function checkVerifiedProfileEntitlement(
  userId: string,
  action: VerifiedProfileEntitlementAction,
): Promise<TierAccessResult> {
  return checkTierAccess(userId, action)
}

export async function requireSignetForVerifiedTools(
  userId: string,
  action: VerifiedProfileEntitlementAction,
): Promise<void> {
  const result = await checkVerifiedProfileEntitlement(userId, action)
  if (!result.allowed) {
    throw new Error(`Signet required: ${action}`)
  }
}
```
