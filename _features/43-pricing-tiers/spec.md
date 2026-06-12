# Pricing Tiers — Spec

Feature **43**. Subscription tier definitions, entitlement catalog, server-side access checks, billing-state behavior, metered session credits, and upgrade-prompt policy. Every product feature that gates on tier calls **43** helpers — tier enforcement does not live inside feature handlers except thin `check.*.entitlement.helper.ts` wrappers.

**Not in this feature:** Product scan pipeline (**24** — always free); personal constraint tools (**07** — safety never gated); Mira session runtime (**29**/**30** — consumes voice/vision entitlements); Mesa compatibility engine (**41** — calls Mesa add-on gate); Stripe/Superwall webhook transport shell (**01** — hosts routes; **43** owns product-id → tier mapping); Superwall paywall UI SDK wiring detail (**03** mobile onboarding may surface pricing); Bela order fees (**42** — service-fee model, not subscription SKU); guard/lexicon/reading-gate tooling.

**Living catalog note:** Tier names (Sapor, Luma, Culina, Viva, Signet) and add-ons (Mesa, session credits) may grow. New gated features must register a `FeatureAction` here before shipping.

---

## Purpose

Pricing tiers are the cross-cutting gate for almost every premium feature. A single wrong entitlement check blocks Mesa, menu scan, voice cooking, receipt intelligence, Kids Mode, and twenty other surfaces. **43** owns the canonical tier matrix, the `checkTierAccess` contract, billing-downgrade behavior, and the mapping from Stripe/Superwall product IDs to `BrioelaTier`.

Without **43**, each feature invents its own tier string (`"core"` vs `"luma"` vs `"free"`), webhook updates never reach Brain context, and spec **19**'s non-negotiable rules (unlimited free scanning, never-gated safety) erode feature by feature.

---

## Product definition

| Term | Meaning |
|---|---|
| **Sapor** | Public name for Free — `$0`, unlimited basic scanning, safety always on |
| **Luma** | Public name for Core — `$8/mo`, private food memory and everyday intelligence |
| **Culina** | Public name for Chef — `$24/mo`, kitchen voice, pantry rescue, generational capture |
| **Viva** | Public name for Power — `$55/mo`, unlimited live video/voice, multi-person rooms, Mesa included |
| **Signet** | Public name for B2B/Practitioner — from `$99/mo`, verified person/business tools |
| **Mesa** | Add-on — `+$8/mo`, included in Viva; multi-person Food Audience (feature **41**) |
| **Session credits** | Metered pay-per-session alternative to subscription |
| **FeatureAction** | Stable string key for `checkTierAccess(userId, action)` |
| **BrioelaTier** | Internal enum: `sapor` \| `luma` \| `culina` \| `viva` \| `signet` |
| **BrioelaAddon** | `mesa` \| `session_credits` \| `bela_service` (Bela fee model TBD) |

**Internal aliases (docs/code comments only — never customer-facing):** Free→Sapor, Core→Luma, Chef→Culina, Power→Viva, B2B→Signet.

**Non-negotiable rules (spec 19 + build guide 25):**

1. Unlimited basic product scanning — no cap, no paywall, ever.
2. Hard allergy guardrails and boycott filters — never gated.
3. Basic scan verdict — always free.
4. Upgrade prompts at moment of desire — not on install, not on first scan, not on safety surfaces.
5. First three scans — suppress non-critical upgrade prompts on scan surfaces.
6. Billing inactive → keep Sapor access, preserve data, block new gated actions.

---

## Tier catalog (prices + positioning)

| Tier | Price | Spec alias | Positioning |
|---|---|---|---|
| **Sapor** | $0 | Free | Begin with every product you wonder about |
| **Luma** | $8/mo | Core | Your private food memory |
| **Culina** | $24/mo | Chef | Cook with Brioela beside you |
| **Viva** | $55/mo | Power | The full living Brioela experience |
| **Signet** | from $99/mo | B2B/Practitioner | Verified tools for people and food businesses |

**Mesa add-on:** `+$8/mo` on Luma or Culina; **included in Viva**; up to **8 active members** (archived excluded). Session 031 policy — not per-seat within limit.

**Annual billing:** 20% yearly discount offered; monthly remains primary path (`06-trust-and-billing-copy.md`).

**Metered (no subscription):**

| Session type | Price | Cap | Notes |
|---|---|---|---|
| Voice | $0.25/session | 15 min | Credits never expire |
| Vision | $1.00/session | 30 min | Re-check Gemini/Realtime costs before launch |
| Multi-person room | $0.50/session | 4 participants, 45 min | |

**Culina voice allowance (spec 19):** 30 voice sessions/month, up to 15 min each. Viva: unlimited voice + vision, no session cap.

**Sapor recipe cap (spec 19):** 3 saved recipes/imports; unlimited at Luma+.

---

## Master entitlement matrix

Canonical minimum tier per gated capability. Feature implementations stay in each feature folder; they call **43** only.

**Legend:** ✓ = included at tier; — = not included; **addon** = separate add-on required; **free** = never gated; **inherits** = no separate flag (uses parent session entitlement).

### Never gated (all tiers including Sapor)

| Capability | Feature | Source |
|---|---|---|
| Unlimited basic product scan + verdict | **24** | spec **19**, `07-scanner/04` |
| Hard allergy guardrails | **07**, **24** | spec **19** |
| Boycott filters | **24** | spec **19** |
| Basic safety warnings / recall surfacing | **31** | spec **19** |
| Harvest edition generation | **53** | spec **49** (viral artifact — free always) |
| Heirloom **receive** | **49** | spec **48** |
| Bela constraint respect | **42** | `05-metered-and-add-ons.md` (fees ≠ tier) |

### Sapor-only limits / upgrade moments

| FeatureAction | Minimum | Sapor behavior | Upgrade target | Feature | Source |
|---|---|---|---|---|---|
| `recipe_import_unlimited` | **Luma** | Max **3** saves/imports | Luma | **08**/**25** | spec **19**, `02-tier-entitlements` |
| `meal_plan_preview` | **Sapor** | Single-day preview only | Luma (full week) | **34** | spec **33**, `14-pantry/03` |
| `voice_cooking_session` | **Culina** | Inline upgrade on first attempt | Culina | **29**/**30** | spec **10**, **19** |
| All rows below | see tier column | Teaser / brief answer / read-only glimpse where noted | per row | various | |

### Luma+ (Core equivalent)

| FeatureAction | Minimum | Free/Sapor degradation | Feature | Migrated ref |
|---|---|---|---|---|
| `receipt_scan` | **Luma** | Upgrade on ingest | **33** | `33/spec.md` § Tier |
| `receipt_price_history` | **Luma** | Blocked | **33** | spec **29** |
| `menu_scan` | **Luma** | Upgrade before pipeline | **26** | `26/spec.md` § Tier |
| `map_full` | **Luma** | Read-only glimpse | **28** | `28/spec.md` § Tier |
| `map_geo_alerts` | **Luma** | Blocked | **28** | `02-tier-entitlements` |
| `community_notes_write` | **Luma** | Read-only | **28** | spec **19** |
| `ground_find_author` | **Luma** | Blocked (scan verdict free) | **27** | `27/spec.md` |
| `kids_mode` | **Luma** | Teaser + one example line | **44** | spec **31**, `21-kids-mode/05` |
| `weekly_food_summary` | **Luma** | — | **34** | `02-tier-entitlements` |
| `meal_plan_full_week` | **Luma** | Single-day preview | **34** | **Conflict C1** below |
| `craving_decode` | **Luma** | Brief generic + upgrade | **37** | spec **52** |
| `negative_space_nutrition` | **Luma** | Silent / no pass | **38** | spec **50** |
| `kin_row` | **Luma** | No Kin row on verdict | **50** | spec **47** |
| `tonight_card` | **Luma** | No daily card | **54** | spec **51** |
| `personal_memory_full` | **Luma** | Limited | **05** | `02-tier-entitlements` |
| `allergy_engine_full` | **Luma** | Basic guardrails only | **07**/**22** | spec **19** |

### Culina+ (Chef equivalent)

| FeatureAction | Minimum | Lower-tier behavior | Feature | Migrated ref |
|---|---|---|---|---|
| `voice_cooking_session` | **Culina** | 30 sessions/mo, 15 min (spec **19**) | **29**/**30** | spec **10** |
| `pantry_rescue` | **Culina** | Blocked | **34** | `02-tier-entitlements` |
| `generational_recipe_capture` | **Culina** | Blocked | **29**/**49** | spec **19** |
| `pre_trip_food_intel` | **Culina** | Blocked | **35** | `02-tier-entitlements` |
| `spend_tracker_deep` | **Culina** | Luma receipt only | **33** | spec **19** |
| `in_store_copilot` | **Culina** | Scan free; voice layer gated | **45** | spec **45** |
| `encore_recreation` | **Culina** | Preview headline + 3 ingredients; capture always stores | **48** | spec **44** |
| `heirloom_send` | **Culina** | Receive always free | **49** | spec **48** |
| `growth_mirror` | **Culina** | No teaser (inactive) | **40** | spec **53** |
| `acoustic_cooking` | **inherits** | Ships with Mira audio — **not** separate SKU | **39** | spec **46** |

### Viva+ (Power equivalent)

| FeatureAction | Minimum | Lower-tier behavior | Feature | Migrated ref |
|---|---|---|---|---|
| `live_video_cooking` | **Viva** | Culina/Luma: inline upgrade on first vision attempt | **29** | spec **11**, **19** |
| `multi_person_room` | **Viva** | Blocked / metered credit | **29** | spec **19** |
| `advanced_behavior_reports` | **Viva** | Blocked | **22**/**12** | `02-tier-entitlements` |
| `priority_routing` | **Viva** | Default routing | **29** | spec **19** |
| `mesa_audience` | **Viva** or **Mesa addon** | Blocked | **41** | session **031** |
| `advanced_wearable_personalization` | **Viva** | Reduced if connected at Luma | **36** | `02-tier-entitlements` |

### Signet

| FeatureAction | Minimum | Feature | Source |
|---|---|---|---|
| `verified_profile` | **Signet** | **46** | `23-verified-profiles/06` |
| `verified_business` | **Signet** | **46** | spec **18** |
| `practitioner_multi_client` | **Signet** | **46** | up to 10 clients per spec **19** |

### Add-ons (orthogonal to base tier)

| Add-on | Price | Requires base tier | Unlocks | Feature |
|---|---|---|---|---|
| **mesa** | +$8/mo | Luma or Culina (or included in Viva) | `mesa_audience`, 8 active members | **41** |
| **session_credits** | metered | any | voice/vision/room without subscription | **29** |
| **bela_service** | per-order fees | any | not subscription-gated | **42** |

### Cross-feature handoffs (tier at consumption point)

| Surface | Gate at handoff | Rule |
|---|---|---|
| Tonight "Cook it" | `voice_cooking_session` if voice; else recipe view | Luma+ card; Chef+ for Mira voice (spec **51**) |
| Menu scan → map overlay | `map_full` for full overlay; menu itself `menu_scan` | **26** + **28** |
| Encore capture | always succeeds | reconstruction gated Culina+ |
| Growth Mirror evidence | inherits cooking session | Culina+; richer on Viva with vision/acoustic |

---

## Cross-feature conflicts (must resolve in **43** implementation)

| ID | Conflict | Sources | **43** resolution |
|---|---|---|---|
| **C1** | Meal plan full week: spec **33** says "Core tier and above" vs build guide `14-pantry/03` and `02-tier-entitlements` say **Luma** | `34/spec.md`, `brioela-specs/33` | **Luma+** for full week; Sapor single-day preview. Public tier name is Luma; spec "Core" = Luma. |
| **C2** | Spec prose uses Free/Core/Chef/Power; build guide uses Sapor/Luma/Culina/Viva | spec **19** vs `25-pricing-tiers/01` | `BrioelaTier` enum uses product names; map legacy strings at webhook boundary only. |
| **C3** | `users.subscription_tier` Drizzle column stores `monthly`/`yearly`/`lifetime` — **not** product tier | `shared/drizzle/schema/user.schema.ts:42-47` | Add `brioela_plan_tier` (or rename in migration); keep `subscription_period_type` separate. **Do not** overload existing column. |
| **C4** | Vision first attempt: spec **19** says "Core or Chef tier" shows upgrade — implies Culina users need Viva for vision | spec **19** § Tier Gating | `live_video_cooking` requires **Viva**; Culina users get inline Viva upgrade on first vision toggle. |
| **C5** | Mesa spec **41** still lists "Core/Chef/Power" in open questions | `brioela-specs/41-mesa.md` vs session **031** | Mesa = **addon** `+$8` or **Viva** includes; not a base tier. |
| **C6** | Kids Mode entitlement type in build guide uses `"free" \| "core" \| "chef"` | `21-kids-mode/05` | Wrappers call `BrioelaTier`; deprecated alias map internal only. |
| **C7** | Acoustic / Growth Mirror: no separate feature flag | specs **46**, **53** | `checkTierAccess` returns allowed for `acoustic_cooking` / `growth_mirror` when `voice_cooking_session` allowed — convenience aliases, not separate billing. |

---

## Architecture — where tier state lives

```text
Billing providers (Stripe web / Superwall iOS+Android)
        │
        ▼
POST /v1/payments/stripe/webhook  |  POST /v1/payments/superwall/webhook
        │
        ▼
syncUserEntitlementFromBilling(userId)          ← **43** handler
        │
        ├── Supabase `users` row
        │     ├── brioela_plan_tier: BrioelaTier
        │     ├── brioela_addons: jsonb (mesa, …)
        │     ├── payment_status: BillingState
        │     ├── subscription_product_id (vendor SKU)
        │     └── subscription_end_date, trial fields (existing)
        │
        └── Brain DO RPC: mirror_entitlement
              └── `user_entitlement` SQLite row (read-fast for agent tools)

Feature handler / Brain tool
        │
        ▼
checkTierAccess(userId, featureAction)        ← **43** canonical helper
        │
        ├── read UserEntitlement (Supabase authoritative; Brain cache)
        ├── evaluate matrix above
        ├── check usage limits (voice sessions/mo, recipe count, Mesa members)
        └── return TierAccessResult { allowed, requiredTier, upgradeTarget, reason }

Mobile UI (hint only — not authoritative)
        │
        ▼
useEntitlement() hook → checkTierAccess via API or session profile
```

**Authoritative store:** Supabase `users` (platform). **Brain mirror:** `user_entitlement` table for agent/session context without cross-DO Supabase round-trip on every tool call. Mirror updated on webhook + explicit refresh RPC.

**Server-side rule:** Client hints may hide buttons; **every** expensive or gated API/tool path calls `checkTierAccess` server-side (`04-access-checks-and-tools.md`).

---

## Entitlement data model

```typescript
type BrioelaTier = 'sapor' | 'luma' | 'culina' | 'viva' | 'signet'

type BrioelaAddon = 'mesa' | 'session_credits' | 'bela_service'

type BillingState =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'

type UserEntitlement = {
  userId: string
  tier: BrioelaTier
  addons: BrioelaAddon[]
  billingStatus: BillingState
  currentPeriodEndsAt: number | null
  voiceSessionsUsedThisPeriod: number
  recipeSaveCount: number
}

type FeatureAction =
  | 'recipe_import_unlimited'
  | 'receipt_scan'
  | 'receipt_price_history'
  | 'menu_scan'
  | 'map_full'
  | 'map_geo_alerts'
  | 'community_notes_write'
  | 'ground_find_author'
  | 'kids_mode'
  | 'weekly_food_summary'
  | 'meal_plan_full_week'
  | 'meal_plan_preview'
  | 'pantry_rescue'
  | 'voice_cooking_session'
  | 'live_video_cooking'
  | 'multi_person_room'
  | 'advanced_behavior_reports'
  | 'mesa_audience'
  | 'verified_profile'
  | 'verified_business'
  | 'craving_decode'
  | 'negative_space_nutrition'
  | 'kin_row'
  | 'tonight_card'
  | 'in_store_copilot'
  | 'encore_recreation'
  | 'heirloom_send'
  | 'growth_mirror'
  | 'acoustic_cooking'

type TierAccessResult = {
  allowed: boolean
  requiredTier: BrioelaTier | null
  requiredAddon: BrioelaAddon | null
  reason: 'allowed' | 'requires_upgrade' | 'usage_limit_reached' | 'billing_inactive'
  upgradeTarget: BrioelaTier | BrioelaAddon | null
}
```

---

## Upgrade prompt policy

From `03-upgrade-triggers.md`:

- Inline, dismissible, one sentence of value, one action.
- Never on: first scan, hard allergy, boycott, basic verdict, safety warnings.
- **First three scans:** suppress non-critical prompts when `scanCount < 3`.
- **Dismissal:** 2 dismissals → 14-day suppress; 3 → until user opens pricing or retries gated action.
- Copy examples: Luma recipe save, Luma menu, Luma Kids Mode, Culina voice, Viva vision, Mesa table, Signet verified.

---

## Billing failure and cancellation

| State | Sapor access | Gated features | Data |
|---|---|---|---|
| `active` / `trialing` | ✓ | per tier | preserved |
| `past_due` | ✓ | block new gated sessions | preserved; gentle payment prompt |
| `cancelled` | ✓ until period end | until `subscription_end_date` | preserved |
| `expired` | ✓ | downgrade to Sapor limits | **never deleted** |

Cancellation copy (`06-trust-and-billing-copy.md`): memory stays yours; paid features stop after current period.

---

## Shipped in repo today (pricing-related)

| Area | Status |
|---|---|
| `build-guide/25-pricing-tiers/` (7 files) | ✓ docs complete (session 029) |
| `brioela-specs/19-pricing-and-tiers.md` | ✓ spec (legacy tier names in prose) |
| `_records/connections/22-pricing-tiers-connections.md` | ✓ ledger |
| `_records/build-order/24-layer-pricing-tiers.md` | ✓ ledger |
| `_records/session-log/029-pricing-tiers-complete.md` | ✓ session log |
| `users` payment columns + `PaymentStatus` enum | ✓ partial — **no** `BrioelaTier` column |
| `SubscriptionTier` enum (`monthly`/`yearly`/…) | ✓ **misnamed** — billing period, not plan (**C3**) |
| Stripe webhook services | ✓ partial — status only, no tier mapping |
| Superwall webhook services | ✓ partial — product id stored, tier mapping commented/TODO |
| `shared/api/payments.routes.ts` | ✓ routes exist |
| `mobile/components/settings/billing-management.tsx` | ✓ manage subscription links |
| `shared/constants/tiers/tiers.constant.ts` | ✗ planned in coding standards, not created |
| `checkTierAccess` / `tools/pricing/` | ✗ |
| Brain `user_entitlement` mirror | ✗ |
| Feature `check.*.entitlement.helper.ts` wrappers | ✗ (referenced in **26**, **27**, **28**, **33**, **34**, **37**, **38**, **41** drafts) |
| Session credit balance | ✗ |
| Upgrade prompt eligibility tracker | ✗ |
| Product-id → tier mapping table | ✗ |

**Grep proof:** `rg 'checkTierAccess|BrioelaTier|check\.tier\.access' backend/src shared/` — zero matches (2026-06-12 audit).

---

## Feature boundaries

| In **43** | In other features |
|---|---|
| Tier enum, addon enum, FeatureAction catalog | Scan pipeline — **24** |
| `checkTierAccess`, usage counters | Constraint inference — **07** |
| Webhook → tier sync | Webhook HTTP shell — **01** |
| Brain entitlement mirror DDL | Brain migration runtime — **04** |
| Session credit balance + metered purchase | Mira session runtime — **29** |
| Upgrade prompt policy + eligibility | Per-feature upgrade copy placement — each feature |
| `check-tier-access` brain tool (read-only) | Billing mutation — Stripe/Superwall checkout (**03**) |
| Mesa addon entitlement | Mesa tables/engine — **41** |
| Signet SKU mapping | Verified profile bodies — **46** |

---

## Sources

- `brioela-specs/19-pricing-and-tiers.md`
- `build-guide/25-pricing-tiers/` (00–06)
- `build-guide/26-mesa/10-tiering-and-rollout.md`
- `build-guide/21-kids-mode/05-safety-and-tier-boundary.md`
- `build-guide/23-verified-profiles/06-analytics-and-revenue.md`
- `build-guide/14-pantry-meal-plan/03-meal-plan-generation.md`
- `build-guide/17-menu-scanning/05-storage-offline-map.md`
- `build-guide/07-scanner/04-scan-result-ui.md`
- `_records/session-log/029-pricing-tiers-complete.md`, `031-mesa-policy-decisions.md`
- `_records/connections/22-pricing-tiers-connections.md`
- `_records/build-order/24-layer-pricing-tiers.md`
- Migrated `_features/` tier sections: **24**–**42**, **44**, **46**, **50**, **54** (stubs)
