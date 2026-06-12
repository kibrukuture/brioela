# Draft: check.usage.limit.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/check.usage.limit.helper.ts`

**Gap:** Monthly voice session cap (30 Culina), Sapor recipe save cap (3) — spec 19 — not enforced.

**Source:** `brioela-specs/19-pricing-and-tiers.md`, `tiers.constant.ts`

---

```typescript
import {
  BrioelaTier,
  CULINA_VOICE_SESSIONS_PER_MONTH,
  SAPOR_RECIPE_SAVE_LIMIT,
} from '@brioela/shared/constants/tiers/tiers.constant'
import type { FeatureAction } from '@brioela/shared/constants/tiers/tier.entitlement.matrix.constant'
import type { UserEntitlement } from '@brioela/shared/validator/pricing'

type UsageCheckResult = { allowed: boolean }

export function checkUsageLimit(
  entitlement: UserEntitlement,
  action: FeatureAction,
): UsageCheckResult {
  switch (action) {
    case 'recipe_import_unlimited':
      if (entitlement.tier === BrioelaTier.SAPOR) {
        return { allowed: entitlement.recipeSaveCount < SAPOR_RECIPE_SAVE_LIMIT }
      }
      return { allowed: true }

    case 'voice_cooking_session':
    case 'in_store_copilot':
      if (entitlement.tier === BrioelaTier.CULINA) {
        return {
          allowed:
            entitlement.voiceSessionsUsedThisPeriod < CULINA_VOICE_SESSIONS_PER_MONTH,
        }
      }
      if (entitlement.tier === BrioelaTier.VIVA || entitlement.tier === BrioelaTier.SIGNET) {
        return { allowed: true }
      }
      return { allowed: false }

    default:
      return { allowed: true }
  }
}
```
