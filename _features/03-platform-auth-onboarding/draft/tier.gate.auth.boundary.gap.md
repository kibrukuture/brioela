# Gap snapshot: tier read at auth/profile boundary

Target: `mobile/features/pricing/hooks/use-entitlement.ts` (new) + `shared/constants/tiers/tiers.constant.ts` (new)

**Status:** Not in repo. Spec: `build-guide/25-pricing-tiers/04-access-checks-and-tools.md`; `brioela-specs/19-pricing-and-tiers.md`; **43** G1–G7.

**Evidence:** `user.schema.ts` has `paymentStatus` / `subscriptionTier` (billing period enum) — no `brioela_plan_tier`. `rg checkTierAccess` — zero. Pricing overview: tier gating starts **after** onboarding, not at auth — but profile/session must expose tier for inline upgrade prompts.

```typescript
import { useUser } from '@/network/users/use-user'
import type { BrioelaTier } from '@brioela/shared/constants/tiers/tiers.constant'

export function useEntitlement() {
  const { data: user } = useUser()
  // G1: column missing today — default Sapor until 43 ships
  const tier: BrioelaTier = user?.brioelaPlanTier ?? 'sapor'
  return { tier }
}
```

**Auth boundary rule (19-pricing):** Scanning never gated. Sign-up prompt deferred until save/contribute/voice — tier checks apply at those action gates, not at `AppGate` boot.
