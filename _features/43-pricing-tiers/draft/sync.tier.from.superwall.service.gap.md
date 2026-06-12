# Draft: sync.tier.from.superwall.service.ts (gap — file does not exist)

Target: `backend/src/core/webhooks/superwall/services/sync.tier.from.superwall.service.ts`

**Gap:** Superwall `subscription-created` updates payment fields only — no `brioela_plan_tier`, no Brain mirror RPC.

**Source:** `subscription-created.service.ts` (partial), `04-access-checks-and-tools.md`

---

```typescript
import type { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types'
import drizzle, { eq } from '@brioela/shared/drizzle'
import { users } from '@brioela/shared/drizzle/schema/user.schema'
import { mapProductIdToEntitlement } from '@/agents/brain/_helpers/pricing/map.product.id.to.tier.helper'
import { syncEntitlementToBrain } from '@/agents/brain/_helpers/pricing/sync.entitlement.to.brain.helper'

export async function syncTierFromSuperwall(
  event: SuperwallEventData,
  db: ReturnType<typeof drizzle>,
): Promise<{ processed: boolean; reason?: string }> {
  const { originalAppUserId, productId, periodType, expirationAt } = event

  if (!originalAppUserId || !productId) {
    return { processed: false, reason: 'missing_user_or_product' }
  }

  const mapping = mapProductIdToEntitlement(productId)
  if (!mapping) {
    console.warn(`[Superwall] Unknown productId for tier mapping: ${productId}`)
    return { processed: false, reason: 'unknown_product' }
  }

  const paymentStatus = periodType === 'TRIAL' ? 'trialing' : 'active'

  await db
    .update(users)
    .set({
      // TODO(**01** migration): brioela_plan_tier, brioela_addons columns
      // brioelaPlanTier: mapping.tier,
      // brioelaAddons: mapping.addons,
      paymentStatus,
      subscriptionProductId: productId,
      subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, originalAppUserId))

  await syncEntitlementToBrain(originalAppUserId, {
    tier: mapping.tier,
    addons: mapping.addons,
    billingStatus: paymentStatus,
    currentPeriodEndsAt: expirationAt ?? null,
  })

  return { processed: true }
}
```
