# Status

open

**Pantry + meal plan not shipped.** Build-guide **14-pantry-meal-plan** is complete (docs only). Zero pantry/meal-plan Brain tables, zero inventory model, zero snapshot vision, zero meal plan generation, zero shopping list delta, zero predictive pantry alarm, zero weekly summary generation, zero mobile pantry UI. Partial: `recipes` + constraint tools (**08**/**07**) — plan pool/filter inputs only; `scheduled_alarms` (**09**) — no pantry alarm handlers; `memory_event` (**05**) — no `cooking_intent` writer.

# Shipped in backend (partial / unrelated)

- [x] `recipes` + `recipe_versions` + partial recipe tools (**08**) — meal-plan pool; create path + index injection open
- [x] `constraint` table + constraint tools (**07**) — hard filter consumer
- [x] `scheduled_alarms` + `schedule_user_alarm` / `cancel_user_alarm` (**09**) — dispatch unwired (**14**)
- [x] `memory_event` + `appendMemoryEvent` RPC (**05**) — no pantry kinds
- [ ] `pantry_snapshot` / `pantry_item_detection` / `pantry_recipe_match` tables
- [ ] `inventory_item_estimate` table
- [ ] `meal_plan` / `meal_plan_slot` / `meal_plan_shopping_list` tables
- [ ] `purchase_pattern` / `predictive_nudge` tables
- [ ] `weekly_summary` table
- [ ] Pantry Zod validators (`shared/validator/pantry/`)
- [ ] `assembleInventorySnapshot` helper
- [ ] **33** purchase signal consumer
- [ ] Pantry vision detection (GPT-4o mini)
- [ ] `POST /api/pantry/snapshots`
- [ ] `POST /api/meal-plans/generate`
- [ ] Shopping list delta + cost estimate
- [ ] Predictive pantry weekly alarm pass
- [ ] Weekly food summary generation handler
- [ ] `cooking_intent` memory_event writer
- [ ] Mobile `features/pantry/`
- [ ] Tier entitlement gates (**43**)
- [ ] Pantry tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `backend/src/api/pantry/` | `rg pantry backend/src` — zero |
| G2 | No Brain pantry/meal-plan schemas | `rg pantry_snapshot meal_plan backend/src/agents` — zero |
| G3 | No `inventory_item_estimate` model | Bela `loadPantryModel()` referenced — not implemented |
| G4 | No pantry Zod validators | `rg pantry.schema shared/validator` — zero |
| G5 | No GPT-4o mini pantry vision handler | `01-pantry-snapshot.md` — pattern from unshipped **24**/**33** |
| G6 | No `POST /api/pantry/snapshots` | spec 14 — zero |
| G7 | No recipe rescue matching | `02-recipe-matching.md` — not built |
| G8 | No `meal_plan` generation handler | spec 33 — zero |
| G9 | No shopping list delta helper | `04-shopping-list-and-cost.md` — not built |
| G10 | No cost estimate from **33** price history | Depends on unshipped `purchase_price_event` |
| G11 | No store suggestion helper | **28** map unshipped |
| G12 | No `purchase_pattern` table | spec 36 — not in Brain migrations |
| G13 | No predictive pantry alarm handler | `05-predictive-pantry.md` — not wired to **14** |
| G14 | No `weekly_summary` table | spec 16 — not implemented |
| G15 | No weekly summary generation body | **14** lists `handle.weekly.food.summary.handler.ts` — missing |
| G16 | No **33** purchase signal consumer | **33** G24 — emit unwired; **34** consume unwired |
| G17 | No cooking usage depletion from **29** | Session-end ingredient usage — not built |
| G18 | No `cooking_intent` memory_event writer | Bela `10-cooking-intent-trigger.md` — kind undocumented in **05** |
| G19 | No mobile `features/pantry/` | `rg pantry mobile/features` — zero |
| G20 | No meal plan week UI | spec 33 — not built |
| G21 | No shopping list sheet | spec 33 + 36 — not built |
| G22 | No fridge rescue UI | Culina tier — `25-pricing-tiers/02` |
| G23 | No tier gates for plan preview vs full week | Core (spec 33) vs Luma (build guide `03`) conflict |
| G24 | Recipe pool thin — **08** open | No recipe index injection; no session-end creates |
| G25 | Alarm dispatch unwired (**14**) | No `weekly_food_summary` / `predictive_pantry` cases |
| G26 | Push kinds unwired (**21**) | `pantry_nudge`, `weekly_food_summary` documented — no send |
| G27 | **54** Tonight blocked | `_features/54-tonight/status.md` blocked-by **34** |
| G28 | **42** Bela pantry read blocked | Standing order + cooking intent need `loadPantryModel` |
| G29 | **45** in-store list sources blocked | spec 45 list_source plan \| pantry |
| G30 | **38** plan bias blocked | Standing concerns need meal plan composer |
| G31 | Mesa shared pantry out of scope | spec 41 — **41** owns; do not fork personal model |
| G32 | Session log 014 "complete" misleading | Build-guide docs only |
| G33 | `_features/36-pantry-meal-plan` glob residue | Canonical folder is **34** |
| G34 | Spec 36 prose swaps spec numbers | "spec 33 meal planning" vs predictive — doc typo only |
| G35 | No pantry tests | No `pantry*.test.ts` or `meal.plan*.test.ts` |
| G36 | Scan history signal missing | **24** unshipped — inventory lacks primary input |
| G37 | Share `shopping_list` classifier unwired | **25** `primaryKind: shopping_list` — no route |

# 34 vs neighbor boundaries

| In **34** (this feature) | In separate feature |
|---|---|
| Inventory estimate + pantry tables | Receipt capture + line items — **33** |
| Purchase pattern + predictive nudge execution | Personal `purchase_price_event` writes — **33** |
| Meal plan + shopping list delta | Shared `price_sighting` — **28** |
| Weekly summary generation + `weekly_summary` | Push delivery — **21** |
| `weekly_food_summary` alarm body | Alarm dispatch router — **14** |
| Fridge rescue + plan surfaces | Tonight daily card — **54** |
| `assembleInventorySnapshot` / gap model | Bela orders + escrow — **42** |
| Cost estimate (private history read) | In-store co-pilot session — **45** |
| Plan ranking with standing concerns | Gap detection pass — **38** |
| Constraint-filtered recipe rank | `recipes` DDL + tools — **08** |
| `cooking_intent` event payload | Order `source_kind` state machine — **42** |

# Critical boundary: three pantry concepts

| | **Inventory estimate** | **Pantry snapshot** | **Purchase pattern** |
|---|---|---|---|
| **Storage** | `inventory_item_estimate` | `pantry_snapshot` + detections | `purchase_pattern` |
| **Updates** | Every signal | Per camera capture | Weekly alarm + purchases |
| **Meal plan** | Primary input | Boosts rescue | Footer "probably need" |
| **Weekly summary** | Not written | Not written | Not written — reads activity only |

# Blocked by

- 01-platform-foundation (API router)
- 04-brain-foundation (Brain SQLite migrations)
- 07-brain-constraint-tools (hard filter — partial shipped)
- 08-brain-recipe-tools (recipe pool — partial shipped)
- 09-brain-alarm-tools (alarm schedule — table shipped)
- 14-brain-alarm-dispatch (weekly handler dispatch)
- 24-scanner (scan history + vision pattern)
- 33-receipt-intelligence (purchase signals + price history)
- 28-map (store suggestion fallback — optional)
- 21-platform-notifications (push kinds)
- 43-pricing-tiers (entitlement gates)

# Blocks

- 54-tonight (inventory + plan convergence)
- 42-bela (pantry model read for standing orders + cooking intent)
- 45-in-store-copilot (shopping list sources)
- 38-negative-space-nutrition (meal plan composition bias)
- 35-ambient-intelligence (weekly summary pattern consumption)
- 41-mesa (Mesa meal planning reads personal pipeline — shared pantry separate)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/014-pantry-meal-plan-complete.md` | Docs-only completion |
| Spec 33: "Core tier and above" for full week | Build guide `03`: Luma+ — reconcile in **43** |
| Spec 36 line 47: "spec 33 meal planning" inventory | Predictive vs plan spec numbers crossed in prose |
| **33** status: weekly summary presentation in **35** | Generation in **34** `06-weekly-food-summary.md` |
| Bela `loadPantryModel()` | Implementable spec only — no production API |
| `_features/36-pantry-meal-plan/` residue | Wrong feature number |
| `build-guide/05-brain/05-alarm-system.md` alarm table | May list types without handler owners — verify per **14** |

# Draft count

**28** files in `draft/` — 27 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/14-pantry-meal-plan/` (00–06)
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`
- `brioela-specs/16-weekly-food-summary.md`
- `brioela-specs/33-minimum-spend-meal-plan.md`
- `brioela-specs/36-predictive-pantry-intelligence.md`
- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/50-negative-space-nutrition.md`
- `brioela-specs/45-in-store-copilot.md`
- `build-guide/11-bela/09-standing-orders.md`, `10-cooking-intent-trigger.md`
- `build-guide/38-tonight/00-overview.md`, `01-answer-generation.md`
- `build-guide/13-receipt-intelligence/00-overview.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `build-guide/37-negative-space-nutrition/03-surfacing-and-memory.md`
- `implementable-specs/bela/01-order-creation.md`, `09-standing-order.md`, `10-cooking-intent-trigger.md`
- `_records/connections/10-pantry-meal-plan-connections.md`
- `_records/build-order/12-layer-pantry-meal-plan.md`
- `_records/session-log/014-pantry-meal-plan-complete.md`
- `_features/08-brain-recipe-tools/status.md`
- `_features/14-brain-alarm-dispatch/build.md`
- `_features/21-platform-notifications/spec.md`
- `_features/33-receipt-intelligence/status.md`
- `_features/38-negative-space-nutrition/status.md`
- `_features/42-bela/status.md`
- `_features/54-tonight/status.md`
