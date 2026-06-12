# Gap index — 43-pricing-tiers

| Draft file | Target path | Status gaps |
|---|---|---|
| `tiers.constant.gap.md` | `shared/constants/tiers/tiers.constant.ts` | G4 |
| `tier.entitlement.matrix.constant.gap.md` | `shared/constants/tiers/tier.entitlement.matrix.constant.ts` | G3 |
| `legacy.tier.alias.constant.gap.md` | `shared/constants/tiers/legacy.tier.alias.constant.ts` | G27, C2, C6 |
| `user.entitlement.schema.gap.md` | `shared/validator/pricing/`, Brain `_schemas/user.entitlement.schema.ts` | G5 |
| `check.tier.access.helper.gap.md` | `_helpers/pricing/check.tier.access.helper.ts` | G2 |
| `check.usage.limit.helper.gap.md` | `_helpers/pricing/check.usage.limit.helper.ts` | G10, G11 |
| `map.product.id.to.tier.helper.gap.md` | `_helpers/pricing/map.product.id.to.tier.helper.ts` | G6, G7, G23 |
| `sync.tier.from.superwall.service.gap.md` | `core/webhooks/superwall/services/sync.tier.from.superwall.service.ts` | G7 |
| `check.tier.access.tool.gap.md` | `tools/pricing/check.tier.access.tool.ts` | G8 |
| `upgrade.prompt.eligibility.helper.gap.md` | `_helpers/pricing/upgrade.prompt.eligibility.helper.ts` | G12 |
| `session.credit.balance.schema.gap.md` | `_schemas/session.credit.balance.schema.ts` | G9 |
| `use.entitlement.hook.gap.md` | `mobile/features/pricing/hooks/use.entitlement.hook.ts` | G25 |
| `users.brioela.plan.tier.migration.gap.md` | Supabase migration + `user.schema.ts` | G1, C3 |

**Neighbor wrappers (owned by respective features; delegate to G2):**

| Feature | Draft in neighbor folder |
|---|---|
| **26** menu | `check.menu.entitlement.helper` |
| **27** ground | `check.ground.entitlement.helper` |
| **28** map | `check.map.entitlement.helper` |
| **33** receipt | `check.receipt.entitlement.helper` |
| **34** pantry | `check.meal.plan.entitlement.helper`, `check.pantry.rescue.entitlement.helper` |
| **37** craving | `check.craving.tier.gate.helper` |
| **38** negative-space | `check.negative.space.tier.gate.helper` |
| **41** mesa | `check.mesa.entitlement.helper` |
