# Pricing Tiers — Build

Feature **43**. Production paths under `shared/constants/tiers/`, `shared/validator/pricing/`, `backend/src/agents/brain/_schemas/user.entitlement.schema.ts`, `backend/src/agents/brain/_helpers/pricing/`, `backend/src/agents/brain/tools/pricing/`, `backend/src/api/pricing/` (read-only entitlement API), `backend/src/core/webhooks/*/services/*` (tier sync hooks), and `mobile/features/pricing/`. Supabase `users` column migration for `brioela_plan_tier` lives in **01**/**03** migration chain — **43** owns schema contract.

**Scope:** `BrioelaTier` + `BrioelaAddon` constants, `FeatureAction` catalog, `checkTierAccess` helper, usage limit counters (voice sessions, recipe saves, Mesa members delegate), Brain `user_entitlement` mirror + sync RPC, webhook product-id → tier mapping, session credit balance, upgrade-prompt eligibility helper, read-only `check-tier-access` brain tool, mobile entitlement hook + upgrade sheet, thin re-exports documented for feature wrappers. **Not in 43 build:** Superwall SDK paywall presentation (**03**), Stripe Checkout session creation UI, Mesa compatibility engine (**41**), Mira session DO (**29**), per-feature business logic beyond gate call.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/25-pricing-tiers/` (7 files) | ✓ docs only |
| `brioela-specs/19-pricing-and-tiers.md` | ✓ spec (legacy names) |
| `_records/connections/22-pricing-tiers-connections.md` | ✓ ledger |
| `_records/build-order/24-layer-pricing-tiers.md` | ✓ ledger |
| `_records/session-log/029-pricing-tiers-complete.md` | ✓ session log |
| `users` payment + Superwall/Stripe columns | ✓ partial — no plan tier |
| Stripe + Superwall webhook handlers | ✓ partial — `paymentStatus` only |
| `shared/api/payments.routes.ts` | ✓ webhook routes |
| `mobile/components/settings/billing-management.tsx` | ✓ subscription management links |
| `BrioelaTier` / `checkTierAccess` | ✗ |
| `shared/constants/tiers/tiers.constant.ts` | ✗ (planned in coding standards) |
| Brain `user_entitlement` table | ✗ |
| Feature entitlement wrappers | ✗ (drafts in **26**, **27**, **28**, **33**, **34**, **37**, **38**, **41**) |
| Session credits | ✗ |
| Pricing tests | ✗ |

**Zero entitlement enforcement code.** `rg 'checkTierAccess|BrioelaTier|check\.tier\.access|user_entitlement' backend/src shared/` — no matches (2026-06-12).

---

## File manifest

### Shared constants + validators (**43**)

| File | Role |
|---|---|
| `shared/constants/tiers/tiers.constant.ts` | `BrioelaTier`, `BrioelaAddon`, tier order, prices (display) |
| `shared/constants/tiers/feature.actions.constant.ts` | `FeatureAction` union + metadata |
| `shared/constants/tiers/tier.entitlement.matrix.constant.ts` | Master matrix (single source for `checkTierAccess`) |
| `shared/constants/tiers/legacy.tier.alias.constant.ts` | `core`→`luma`, `free`→`sapor`, etc. |
| `shared/constants/tiers/index.ts` | Barrel |
| `shared/validator/pricing/user.entitlement.schema.ts` | `UserEntitlementSchema`, `TierAccessResultSchema` |
| `shared/validator/pricing/session.credit.balance.schema.ts` | Metered credit row |
| `shared/validator/pricing/upgrade.prompt.eligibility.schema.ts` | Scan count + dismissal state |
| `shared/validator/pricing/index.ts` | Barrel |
| `shared/routes/pricing.routes.ts` | `GET /api/entitlements/me` (optional) |

### Supabase schema (**01**/**03** owns migration; **43** owns contract)

| Change | Role |
|---|---|
| `users.brioela_plan_tier` | `text` check in `sapor`…`signet` |
| `users.brioela_addons` | `jsonb` default `[]` |
| `users.subscription_period_type` | Rename/clarify vs misnamed `subscription_tier` (**C3**) |
| `users.voice_sessions_used_period` | Monthly counter reset on billing period |
| `users.recipe_save_count` | Sapor cap enforcement |

### Brain SQLite (**43** mirror)

| File | Role |
|---|---|
| `_schemas/user.entitlement.schema.ts` | `user_entitlement` mirror row |
| `_schemas/session.credit.balance.schema.ts` | Brain copy of credit balance |
| `_schemas/upgrade.prompt.state.schema.ts` | Per-user prompt suppression |
| `_schemas/index.ts` | Export + **04** migration registration |
| `_migrations/*` | Add pricing tables to Brain chain |

### Brain helpers — `backend/src/agents/brain/_helpers/pricing/` (**43**)

| File | Role |
|---|---|
| `_helpers/pricing/check.tier.access.helper.ts` | **Canonical** `checkTierAccess` |
| `_helpers/pricing/resolve.user.entitlement.helper.ts` | Load from Brain mirror; fallback Supabase RPC |
| `_helpers/pricing/evaluate.feature.action.helper.ts` | Matrix lookup + addon checks |
| `_helpers/pricing/check.usage.limit.helper.ts` | Voice 30/mo, recipe 3, Mesa 8 (delegates **41** count) |
| `_helpers/pricing/map.legacy.tier.alias.helper.ts` | **C2** / **C6** string normalization |
| `_helpers/pricing/sync.entitlement.to.brain.helper.ts` | Webhook → Brain mirror |
| `_helpers/pricing/decrement.session.credit.helper.ts` | Metered voice/vision/room |
| `_helpers/pricing/upgrade.prompt.eligibility.helper.ts` | First-3-scans + dismissal rules |
| `_helpers/pricing/map.product.id.to.tier.helper.ts` | Stripe/Superwall SKU → `BrioelaTier` |
| `_helpers/pricing/index.ts` | Barrel |

### Brain tool — `tools/pricing/` (**43**)

| File | Role |
|---|---|
| `tools/pricing/check.tier.access.tool.ts` | Read-only LLM tool; no billing mutation |
| `tools/pricing/index.ts` | Barrel → **19** registry |

### Brain handlers (**43**)

| File | Role |
|---|---|
| `_handlers/pricing/sync.entitlement.handler.ts` | RPC: platform → Brain mirror |
| `_handlers/pricing/record.voice.session.usage.handler.ts` | Increment monthly counter (**29** calls) |
| `_handlers/pricing/index.ts` | Barrel |

### Backend API — optional read path (**43**)

| File | Role |
|---|---|
| `backend/src/api/pricing/pricing.route.ts` | `GET /api/entitlements/me` |
| `backend/src/api/pricing/_handlers/get.entitlement.handler.ts` | Mobile session profile enrichment |
| `backend/src/api/pricing/index.ts` | Module export |

### Webhook tier sync (**43** logic; **01** hosts routes)

| File | Role |
|---|---|
| `backend/src/core/webhooks/stripe/services/sync.tier.from.stripe.service.ts` | Product/price → `brioela_plan_tier` |
| `backend/src/core/webhooks/superwall/services/sync.tier.from.superwall.service.ts` | `productId` → tier + addons |
| Extend `subscription-created.service.ts` / `subscription-updated.service.ts` | Call sync service |

### Feature wrappers (thin — each feature owns file; **43** owns matrix)

Documented contract — implement when respective feature ships:

| File | FeatureAction |
|---|---|
| `backend/src/api/menu-scans/_helpers/check.menu.entitlement.helper.ts` | `menu_scan` |
| `backend/src/api/map/_helpers/check.map.entitlement.helper.ts` | `map_full`, `map_geo_alerts` |
| `backend/src/api/finds/_helpers/check.ground.entitlement.helper.ts` | `ground_find_author` |
| `backend/src/agents/brain/_helpers/check.receipt.entitlement.helper.ts` | `receipt_scan` |
| `backend/src/agents/brain/_helpers/check.meal.plan.entitlement.helper.ts` | `meal_plan_full_week` |
| `backend/src/agents/brain/_helpers/check.pantry.rescue.entitlement.helper.ts` | `pantry_rescue` |
| `backend/src/agents/brain/_helpers/craving-decoder/check.craving.tier.gate.helper.ts` | `craving_decode` |
| `backend/src/agents/brain/_helpers/negative-space/check.negative.space.tier.gate.helper.ts` | `negative_space_nutrition` |
| `backend/src/agents/brain/_helpers/mesa/check.mesa.entitlement.helper.ts` | `mesa_audience` + 8-member cap |

### Mobile (**43**)

| File | Role |
|---|---|
| `mobile/features/pricing/hooks/use.entitlement.hook.ts` | Client hint from profile/API |
| `mobile/features/pricing/hooks/use.upgrade.prompt.hook.ts` | Eligibility + dismissal |
| `mobile/features/pricing/components/upgrade.prompt.sheet.tsx` | Inline upgrade UI |
| `mobile/features/pricing/components/pricing.trust.banner.tsx` | Trust copy block |
| `mobile/network/pricing/entitlement.api.ts` | `GET /api/entitlements/me` |

### Tests (**43**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/pricing/check.tier.access.test.ts` | Matrix coverage all `FeatureAction`s |
| `backend/src/agents/brain/_helpers/pricing/check.usage.limit.test.ts` | Voice 30/mo, recipe 3 |
| `backend/src/agents/brain/_helpers/pricing/upgrade.prompt.eligibility.test.ts` | First-3-scans rule |
| `backend/src/agents/brain/_helpers/pricing/map.product.id.to.tier.test.ts` | SKU mapping |
| `backend/src/core/webhooks/stripe/services/sync.tier.from.stripe.test.ts` | Webhook → tier |

---

## Build sequence

1. **Constants + matrix** — `tiers.constant.ts`, `tier.entitlement.matrix.constant.ts`, Zod schemas.
2. **Supabase migration** — `brioela_plan_tier`, `brioela_addons`; clarify period vs plan (**C3**).
3. **`checkTierAccess`** — unit-tested against full matrix + conflicts **C1**–**C7**.
4. **Webhook sync** — Stripe + Superwall → Supabase → Brain mirror RPC.
5. **Brain tool** — register in **19**; read-only.
6. **Usage counters** — voice session increment hook for **29**; recipe save hook for **08**/**25**.
7. **Feature wrappers** — as each gated feature ships; must call **43** only.
8. **Mobile hooks** — entitlement hint + upgrade sheet; billing management already exists.
9. **Session credits** — metered path after subscription tiers stable.

---

## Acceptance criteria

### Tier catalog

- [ ] Public names: Sapor, Luma, Culina, Viva, Signet; Mesa as add-on.
- [ ] Internal `BrioelaTier` enum matches build guide `04-access-checks-and-tools.md`.
- [ ] Legacy alias map resolves spec **19** prose in webhooks/tests only.

### Non-negotiables

- [ ] `checkTierAccess('product_scan_basic')` or equivalent never blocks scan.
- [ ] Allergy/boycott paths never call upgrade prompt.
- [ ] First 3 scans suppress non-critical prompts on scan surfaces.

### Matrix enforcement

- [ ] Every `FeatureAction` in `spec.md` master table has matrix row + test case.
- [ ] **C1** meal plan: Luma+ full week, Sapor preview only.
- [ ] Mesa: Viva includes OR `mesa` addon; 8 active member cap enforced with **41**.
- [ ] Acoustic/growth mirror inherit voice session gate (**C7**).

### Billing

- [ ] `past_due` / `expired` downgrade behavior per `06-trust-and-billing-copy.md`.
- [ ] Cancelled: access until `subscription_end_date`.
- [ ] Product-id mapping table for Stripe + Superwall SKUs (env-configured).

### Brain mirror

- [ ] `user_entitlement` row synced on webhook + login refresh.
- [ ] `check-tier-access` tool returns `TierAccessResult`; never mutates billing.

### Cross-feature

- [ ] **26** menu, **27** Ground, **28** map, **33** receipt, **34** plan/rescue, **37** craving, **38** negative-space, **41** Mesa wrappers delegate to `checkTierAccess`.
- [ ] **29** voice/vision gates use `voice_cooking_session` / `live_video_cooking` + usage limits.

### Mobile

- [ ] `useEntitlement` reflects server state; UI hides gated actions as hint only.
- [ ] Upgrade sheet copy matches `03-upgrade-triggers.md` families.

---

## Depends on

- **01-platform-foundation** — API router, Drizzle migrations
- **03-platform-auth-onboarding** — session profile exposes entitlement
- **04-brain-foundation** — Brain SQLite migrations, RPC spine
- **19-brain-tool-registry** — `check-tier-access` registration

## Blocks (entitlement unwired)

- **26-menu-scanning**, **27-ground**, **28-map**, **33-receipt-intelligence**, **34-pantry-meal-plan**
- **37-craving-decoder**, **38-negative-space-nutrition**, **41-mesa**, **44-kids-mode**
- **29-cooking-session** (voice/vision limits), **40-growth-mirror**, **39-acoustic-cooking** (inherits)
- **45-in-store-copilot**, **46-verified-profiles**, **48-encore**, **49-heirloom**, **50-kin**, **54-tonight**

---

## Sources

- `build-guide/25-pricing-tiers/` (00–06)
- `brioela-specs/19-pricing-and-tiers.md`
- `_features/43-pricing-tiers/spec.md`
- `_records/session-log/029-pricing-tiers-complete.md`, `031-mesa-policy-decisions.md`
- Neighbor `_features/*/build.md` entitlement rows (**26**–**42**)
