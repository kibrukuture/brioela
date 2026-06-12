# Draft: check.kids.mode.entitlement.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kids.mode/check.kids.mode.entitlement.helper.ts`

**Gap:** No thin wrapper around **43** `checkTierAccess('kids_mode')`.

**Source:** `build-guide/21-kids-mode/05-safety-and-tier-boundary.md`, `_features/43-pricing-tiers/spec.md`

---

```typescript
import { checkTierAccess } from '@/agents/brain/_helpers/pricing/check.tier.access.helper'
import type { TierAccessResult } from '@/shared/validator/pricing/user.entitlement.schema'

export type KidsModeEntitlementResult = TierAccessResult & {
	featureAction: 'kids_mode'
}

export async function checkKidsModeEntitlement(userId: string): Promise<KidsModeEntitlementResult> {
	const result = await checkTierAccess(userId, 'kids_mode')
	return { ...result, featureAction: 'kids_mode' }
}
```
