# Draft: check.tonight.tier.gate.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/check.tonight.tier.gate.helper.ts`

**Gap (feature 54):** Luma+ gate for Tonight card.

**Source:** `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md`, spec **51** § Tier Placement

---

```typescript
import { BrioelaTier } from '@brioela/shared/constants/tiers'
import type { UserEntitlement } from '@brioela/shared/validator/tiers/user.entitlement.schema'

export type TonightTierGateResult =
  | { allowed: true }
  | { allowed: false; reason: 'tier_blocked'; minimumTier: typeof BrioelaTier.LUMA }

export function checkTonightTierGate(entitlement: UserEntitlement): TonightTierGateResult {
  const tierRank = ['sapor', 'luma', 'culina', 'viva', 'signet']
  const userRank = tierRank.indexOf(entitlement.tier)
  const lumaRank = tierRank.indexOf(BrioelaTier.LUMA)

  if (userRank < lumaRank) {
    return { allowed: false, reason: 'tier_blocked', minimumTier: BrioelaTier.LUMA }
  }

  return { allowed: true }
}
```

**Note:** Spec **51** "Core" = **43** `Luma`. Free/Sapor users see nothing — no teaser cards.
