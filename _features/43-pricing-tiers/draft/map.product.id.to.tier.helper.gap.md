# Draft: map.product.id.to.tier.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/map.product.id.to.tier.helper.ts`

**Gap:** Stripe/Superwall webhooks store `subscriptionProductId` but never map to `BrioelaTier` or Mesa addon.

**Source:** `backend/src/core/webhooks/superwall/services/subscription-created.service.ts`, `04-access-checks-and-tools.md`

---

```typescript
import { BrioelaAddon, BrioelaTier } from '@brioela/shared/constants/tiers/tiers.constant'

export type ProductMapping = {
  tier: BrioelaTier
  addons: BrioelaAddon[]
}

/**
 * Env-configured SKU map — populate from Stripe Dashboard + Superwall product ids.
 * Example keys only; real ids come from deployment secrets / wrangler vars.
 */
const PRODUCT_ID_MAP: Record<string, ProductMapping> = {
  'brioela_luma_monthly': { tier: BrioelaTier.LUMA, addons: [] },
  'brioela_luma_yearly': { tier: BrioelaTier.LUMA, addons: [] },
  'brioela_culina_monthly': { tier: BrioelaTier.CULINA, addons: [] },
  'brioela_viva_monthly': { tier: BrioelaTier.VIVA, addons: [BrioelaAddon.MESA] },
  'brioela_signet_monthly': { tier: BrioelaTier.SIGNET, addons: [] },
  'brioela_mesa_addon_monthly': { tier: BrioelaTier.LUMA, addons: [BrioelaAddon.MESA] },
}

export function mapProductIdToEntitlement(productId: string): ProductMapping | null {
  return PRODUCT_ID_MAP[productId] ?? null
}

/** When user buys Mesa addon on existing Culina sub, merge addons without downgrading tier */
export function mergeAddonEntitlement(
  current: ProductMapping,
  incoming: ProductMapping,
): ProductMapping {
  const tierRank = (t: BrioelaTier) =>
    ['sapor', 'luma', 'culina', 'viva', 'signet'].indexOf(t)

  const tier =
    tierRank(incoming.tier) > tierRank(current.tier) ? incoming.tier : current.tier
  const addons = [...new Set([...current.addons, ...incoming.addons])]
  return { tier, addons }
}
```
