# Status

open

**Pricing tiers not shipped.** Build-guide **25-pricing-tiers** is complete (docs only). Stripe/Superwall webhooks update `paymentStatus` and product metadata on `users` — but no `BrioelaTier` column, no `checkTierAccess`, no entitlement matrix in code, no Brain mirror, no feature entitlement wrappers, no session credits, no upgrade-prompt tracker. Partial: legacy billing UI (`billing-management.tsx`), payment webhook shell, misnamed `subscription_tier` enum (billing **period**, not plan — **C3**).

# Shipped in backend (partial / legacy)

- [x] `build-guide/25-pricing-tiers/` (7 files) — docs complete per session 029
- [x] `brioela-specs/19-pricing-and-tiers.md` — spec (legacy Free/Core/Chef/Power names in prose)
- [x] `_records/connections/22-pricing-tiers-connections.md`, `_records/build-order/24-layer-pricing-tiers.md`
- [x] `_records/session-log/029-pricing-tiers-complete.md`, `031-mesa-policy-decisions.md` (Mesa +$8, Viva includes)
- [x] `users` payment columns (`paymentStatus`, `subscriptionProductId`, Superwall fields) — **01**/**03**
- [x] Stripe webhook services — status mapping only
- [x] Superwall webhook services — partial product storage
- [x] `shared/api/payments.routes.ts` — webhook routes
- [x] `mobile/components/settings/billing-management.tsx` — manage subscription links
- [ ] `brioela_plan_tier` / `brioela_addons` Supabase columns
- [ ] `shared/constants/tiers/tiers.constant.ts`
- [ ] `checkTierAccess` helper + matrix constant
- [ ] Brain `user_entitlement` mirror table
- [ ] `tools/pricing/check-tier-access.ts`
- [ ] Webhook → tier sync (`map.product.id.to.tier`)
- [ ] Session credit balance (metered)
- [ ] Upgrade prompt eligibility (first-3-scans, dismissal)
- [ ] Voice session monthly counter (30/mo Culina)
- [ ] Recipe save counter (3 Sapor)
- [ ] Feature entitlement wrappers (**26**, **27**, **28**, **33**, **34**, **37**, **38**, **41**)
- [ ] Mobile `features/pricing/` hooks + upgrade sheet
- [ ] Pricing tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No `BrioelaTier` on users row** | `user.schema.ts` — `subscriptionTier` = monthly/yearly only (**C3**) |
| G2 | **No `checkTierAccess` implementation** | `rg checkTierAccess backend/src shared/` — zero |
| G3 | **No entitlement matrix constant** | `04-access-checks-and-tools.md` — types only in docs |
| G4 | **No `shared/constants/tiers/`** | Coding standards plan file missing |
| G5 | **No Brain `user_entitlement` mirror** | `04-access-checks-and-tools.md` — tier in Brain context — not built |
| G6 | **Stripe webhook does not map product → tier** | `subscription-created.service.ts` — `paymentStatus` only |
| G7 | **Superwall tier sync incomplete** | `subscription-created.service.ts` — stores `productId`, no `brioela_plan_tier` |
| G8 | **No `check-tier-access` brain tool** | `tools/pricing/` — directory missing |
| G9 | **No session credit balance** | `05-metered-and-add-ons.md` — `SessionCreditBalance` type only |
| G10 | **No voice session usage counter** | Spec 19: 30/mo Culina — no code |
| G11 | **No Sapor recipe save cap (3)** | Spec 19 — no counter |
| G12 | **No upgrade prompt eligibility tracker** | `03-upgrade-triggers.md` — first-3-scans rule not coded |
| G13 | **Menu scan Luma gate unwired** | **26** G21 — `check.menu.entitlement.helper` missing |
| G14 | **Map Luma gate unwired** | **28** G32 |
| G15 | **Ground Find Luma gate unwired** | **27** G21 |
| G16 | **Receipt Luma gate unwired** | **33** G21 |
| G17 | **Meal plan tier gate unwired** | **34** G23 — Core vs Luma conflict **C1** |
| G18 | **Pantry rescue Culina gate unwired** | **34** G22 |
| G19 | **Craving decoder Core+ gate unwired** | **37** G15 |
| G20 | **Negative space Core+ gate unwired** | **38** G16 |
| G21 | **Mesa addon/Viva gate unwired** | **41** G16 — session 031 policy decided, code missing |
| G22 | **Kids Mode Luma gate unwired** | **44** blocked on **43** |
| G23 | **Signet SKU mapping undefined** | `05-metered-and-add-ons.md` — open subtype pricing |
| G24 | **Bela not in subscription tiers** | Policy decided — service fees only; no `bela_service` SKU yet |
| G25 | **No mobile entitlement hook** | `features/pricing/` missing |
| G26 | **No pricing tests** | No `pricing*.test.ts` |
| G27 | **Spec 19 legacy tier names in brioela-specs** | Free/Core/Chef/Power prose — alias map required (**C2**) |
| G28 | **Mesa spec 41 tier open questions stale** | Session 031 resolved +$8/Viva — spec prose not updated |
| G29 | **Gemini/Realtime costs not re-checked** | Spec 19 + `05-metered-and-add-ons.md` blocker before launch pricing |
| G30 | **No `GET /api/entitlements/me`** | Mobile profile lacks authoritative tier for hints |

# Cross-feature conflicts (track in **43**)

| ID | Issue | Resolution owner |
|---|---|---|
| **C1** | Meal plan: spec 33 Core+ vs build Luma+ | **43** → Luma+ |
| **C2** | Free/Core/Chef/Power vs Sapor/Luma/Culina/Viva | **43** alias map |
| **C3** | `subscription_tier` column = billing period | **43** + **01** new `brioela_plan_tier` |
| **C4** | Vision upgrade on Culina → Viva | **43** `live_video_cooking` |
| **C5** | Mesa spec lists Core/Chef/Power | **43** addon model (session 031) |
| **C6** | Kids mode helper uses `core` string | **43** legacy alias |
| **C7** | Acoustic/growth mirror no separate SKU | **43** inherit voice gate |

# 43 vs neighbor boundaries

| In **43** | In separate feature |
|---|---|
| Tier catalog + matrix | Scan always free — **24** |
| `checkTierAccess` | Constraint safety — **07** |
| Webhook tier sync logic | Webhook HTTP — **01** |
| Brain entitlement mirror DDL | Brain migrations — **04** |
| Mesa addon check | Mesa engine — **41** |
| Voice usage counter hook | Mira session — **29** |
| Upgrade prompt policy | Per-surface copy — each feature |
| Signet billing SKU | Verified profile body — **46** |

# Blocked by

- 01-platform-foundation (Drizzle migration for plan tier)
- 03-platform-auth-onboarding (session profile tier field)
- 04-brain-foundation (Brain SQLite + RPC)

# Blocks

- 26-menu-scanning, 27-ground, 28-map, 33-receipt-intelligence, 34-pantry-meal-plan
- 37-craving-decoder, 38-negative-space-nutrition, 41-mesa, 44-kids-mode
- 29-cooking-session (voice/vision limits), 39-acoustic-cooking, 40-growth-mirror
- 45-in-store-copilot, 46-verified-profiles, 48-encore, 49-heirloom, 50-kin, 54-tonight

# Draft count

**14** files in `draft/` — 13 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/25-pricing-tiers/` (00–06)
- `brioela-specs/19-pricing-and-tiers.md`
- `build-guide/26-mesa/10-tiering-and-rollout.md`
- `shared/drizzle/schema/user.schema.ts`
- `backend/src/core/webhooks/stripe/`, `superwall/`
- `_records/session-log/029-pricing-tiers-complete.md`, `031-mesa-policy-decisions.md`
- Neighbor `_features/*/status.md` entitlement gaps (**26**–**42**)
