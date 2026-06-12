# Draft: use.entitlement.hook.ts (gap — file does not exist)

Target: `mobile/features/pricing/hooks/use.entitlement.hook.ts`

**Gap:** Mobile has billing management links but no entitlement hint hook for gated features.

**Source:** `mobile/components/settings/billing-management.tsx`, `04-access-checks-and-tools.md`

---

```typescript
import { useUser } from '@/network/users/use-user'
import { BrioelaTier } from '@brioela/shared/constants/tiers/tiers.constant'
import type { FeatureAction } from '@brioela/shared/constants/tiers/tier.entitlement.matrix.constant'

type EntitlementHint = {
  tier: BrioelaTier
  can: (action: FeatureAction) => boolean
  isLoading: boolean
}

/**
 * Client hint only — server enforces on every API/tool path.
 * TODO: enrich useUser() with brioelaPlanTier from GET /api/entitlements/me
 */
export function useEntitlement(): EntitlementHint {
  const { data: user, isLoading } = useUser()

  const tier = (user?.brioelaPlanTier as BrioelaTier | undefined) ?? BrioelaTier.SAPOR

  return {
    tier,
    can: (_action: FeatureAction) => {
      // Delegate to shared matrix client-side for UI hints — mirror checkTierAccess
      return false // placeholder until API wired
    },
    isLoading,
  }
}
```
