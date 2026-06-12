# Draft: check.tier.access.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/check.tier.access.helper.ts`

**Gap:** Canonical server-side entitlement check — referenced across **26**–**41** drafts, not implemented.

**Source:** `build-guide/25-pricing-tiers/04-access-checks-and-tools.md`

---

```typescript
import {
  BrioelaAddon,
  BrioelaTier,
  tierAtLeast,
} from '@brioela/shared/constants/tiers/tiers.constant'
import {
  TIER_ENTITLEMENT_MATRIX,
  type FeatureAction,
} from '@brioela/shared/constants/tiers/tier.entitlement.matrix.constant'
import type { TierAccessResult, UserEntitlement } from '@brioela/shared/validator/pricing'
import { checkUsageLimit } from './check.usage.limit.helper'

export class TierAccessDeniedError extends Error {
  readonly result: TierAccessResult

  constructor(result: TierAccessResult) {
    super(`Tier access denied: ${result.reason}`)
    this.name = 'TierAccessDeniedError'
    this.result = result
  }
}

export function checkTierAccess(
  entitlement: UserEntitlement,
  action: FeatureAction,
): TierAccessResult {
  if (entitlement.billingStatus === 'expired' || entitlement.billingStatus === 'past_due') {
    // past_due: block new gated sessions per 06-trust-and-billing-copy
    if (action !== 'meal_plan_preview') {
      return {
        allowed: false,
        requiredTier: null,
        requiredAddon: null,
        reason: 'billing_inactive',
        upgradeTarget: null,
      }
    }
  }

  const rule = TIER_ENTITLEMENT_MATRIX[action]
  if (rule.inherits) {
    return checkTierAccess(entitlement, rule.inherits)
  }

  const tierOk = tierAtLeast(entitlement.tier, rule.minimumTier)
  const addonOk =
    rule.addonAlternative !== undefined &&
    entitlement.addons.includes(rule.addonAlternative)

  if (!tierOk && !addonOk) {
    return {
      allowed: false,
      requiredTier: rule.minimumTier,
      requiredAddon: rule.requiredAddon ?? rule.addonAlternative ?? null,
      reason: 'requires_upgrade',
      upgradeTarget: rule.addonAlternative ?? rule.minimumTier,
    }
  }

  const usage = checkUsageLimit(entitlement, action)
  if (!usage.allowed) {
    return {
      allowed: false,
      requiredTier: rule.minimumTier,
      requiredAddon: null,
      reason: 'usage_limit_reached',
      upgradeTarget: BrioelaTier.VIVA,
    }
  }

  return {
    allowed: true,
    requiredTier: null,
    requiredAddon: null,
    reason: 'allowed',
    upgradeTarget: null,
  }
}

export function assertTierAccess(
  entitlement: UserEntitlement,
  action: FeatureAction,
): void {
  const result = checkTierAccess(entitlement, action)
  if (!result.allowed) {
    throw new TierAccessDeniedError(result)
  }
}
```
