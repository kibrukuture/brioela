# Pantry + Meal Plan — Spec

Feature **34**. Personal pantry intelligence: probabilistic inventory estimates, fridge/pantry camera snapshots, recipe matching, 7-day minimum-spend meal plans, shopping-list deltas with cost estimates, predictive purchase-interval nudges, and weekly food summary generation — all in Brain DO SQLite. Receipt purchase signals (**33**), scan history (**24**), and cooking-session usage (**29**) feed the inventory model; **34** owns how that state is assembled, ranked, planned, and surfaced.

**Not in this feature:** Grocery receipt capture, GPT-4o mini receipt vision, line-item matching, private `purchase_price_event` writes (**33**); shared `price_sighting` / map nearby ranking (**28**); recipe CRUD tools and `recipes` table DDL (**08** — consumer only); Bela order state machine, escrow, standing-order approval UI, shopper live scan (**42**); push transport and priority ladder (**21**); Tonight daily card generation and learned delivery timing (**54**); negative-space gap detection pass and standing-concern queue (**38**); Mesa shared pantry / audience tables (**41**); in-store co-pilot session shell (**45**).

---

## Purpose

Four interconnected surfaces share one inventory + constraint pipeline:

1. **Fridge rescue (urgent)** — camera snapshot → "what can I cook right now?"
2. **Meal plan (planned)** — user-initiated 7-day plan minimizing spend and waste.
3. **Predictive pantry (proactive)** — interval-based "you usually buy X around now" without manual lists.
4. **Weekly food summary (ambient)** — Sunday rollup of scans, receipts, recipes, constraints, sessions.

Without **34**, receipt line items (**33**) have no pantry consumer, Bela standing orders (**42**) have no pantry model to read, Tonight (**54**) has no inventory estimate, in-store co-pilot (**45**) has no list source, and negative-space nutrition (**38**) cannot bias meal-plan composition.

---

## Product definition

| Term | Meaning |
|---|---|
| **Inventory estimate** | Probabilistic model of what is likely at home — **not** exact real-time stock. Built from scans, receipts, cooking usage, and manual snapshot detections. |
| **Pantry snapshot** | Episodic camera capture of fridge/pantry with detected items — operates on snapshots, not continuous tracking (spec 14). |
| **Purchase pattern** | Median days-between-purchases per regularly bought item (spec 36). |
| **Predictive nudge** | Surfaced prediction that user will need an item within threshold window. |
| **Meal plan** | Active 7-day (or single-day preview) plan with breakfast/lunch/dinner slots stored per user in Brain DO. |
| **Shopping list delta** | Plan ingredients minus estimated inventory — `to_buy` / `already_have` / `bought`. |
| **Weekly food summary** | One-line summary + 2–4 observations + optional action — spec 16. |

**Design principle:** Pantry is snapshot + prediction based, not perpetual inventory. Silence over wrong confidence. Personal plan data stays in Brain DO SQLite — never Supabase.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/14-pantry-meal-plan/`, `brioela-specs/14`, `16`, `33`, `36`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/08`, `14`, `21`, `33`, `38`, `42`, `54`.

| # | Component | Type | In **34**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Probabilistic inventory model** | Brain helper | **Yes** | No | Assembled on demand for plan/match | `01-pantry-snapshot.md`, Bela `10-cooking-intent-trigger.md` |
| 2 | **Pantry snapshot capture** | Mobile + API | **Yes** | No | User camera → fridge/pantry | spec 14 |
| 3 | **GPT-4o mini pantry vision** | AI + Zod | **Yes** | No | Item detection from image | `01-pantry-snapshot.md` (pattern from **24**/**33**) |
| 4 | **`pantry_snapshot` table** | Brain SQLite | **Yes** | No | Episodic captures | spec 14 |
| 5 | **`pantry_item_detection` table** | Brain SQLite | **Yes** | No | Per-snapshot detections | spec 14 |
| 6 | **`pantry_recipe_match` table** | Brain SQLite | **Yes** | No | Rescue ranking cache | `02-recipe-matching.md` |
| 7 | **Recipe matching / rescue rank** | Backend helper | **Yes** | No | Coverage + constraints + cost | spec 14, `02-recipe-matching.md` |
| 8 | **Purchase signal consumer** | Brain helper | **Yes** | No | **33** `emit.pantry.purchase.signal` | **33** boundary |
| 9 | **Manual pantry edit / voice** | Brain tool or RPC | **Partial** | No | User correction of estimate | spec 36 dismissals; no dedicated tool shipped |
| 10 | **`meal_plan` table** | Brain SQLite | **Yes** | No | Active week plan header | spec 33 |
| 11 | **`meal_plan_slot` table** | Brain SQLite | **Yes** | No | Day × meal_type × recipe | spec 33 |
| 12 | **`meal_plan_shopping_list` table** | Brain SQLite | **Yes** | No | Delta rows + cost | spec 33 |
| 13 | **Meal plan generation** | Brain handler | **Yes** | No | Single structured LLM call <5s | `03-meal-plan-generation.md` |
| 14 | **Waste minimization rank** | Generation input | **Yes** | No | Expiring produce priority | spec 33 |
| 15 | **Variety constraints** | Generation rule | **Yes** | No | No repeat within 3 days; protein guard | spec 33 |
| 16 | **Budget baseline compare** | Generation output | **Yes** | No | Receipt weekly avg vs plan cost | spec 33, **33** `spend_summary` |
| 17 | **Slot swap / adjust** | API + voice | **Yes** | No | 3 alternatives; real-time list update | spec 33 |
| 18 | **Shopping list delta compute** | Backend helper | **Yes** | No | Plan ingredients − inventory | `04-shopping-list-and-cost.md` |
| 19 | **Department sort** | List presentation | **Yes** | No | produce → dairy → meat → pantry → frozen | `04-shopping-list-and-cost.md` |
| 20 | **Cost estimate** | Backend helper | **Yes** | No | **33** personal price first; **28** fallback | `04-shopping-list-and-cost.md` |
| 21 | **Store suggestion** | List annotation | **Yes** | No | Multi-item cheaper-at-store from **28** | `04-shopping-list-and-cost.md` |
| 22 | **`purchase_pattern` table** | Brain SQLite | **Yes** | No | Interval model per item_key | spec 36 |
| 23 | **`predictive_nudge` table** | Brain SQLite | **Yes** | No | Surfaced predictions + outcomes | spec 36 |
| 24 | **Predictive pantry alarm pass** | Brain DO alarm | **Yes** | No | Weekly batch — not per receipt | spec 36, `05-predictive-pantry.md` |
| 25 | **Confidence-tier surfacing** | Notification rule | **Yes** | No | high → notify+auto-add; medium → list only | spec 36 |
| 26 | **`weekly_summary` table** | Brain SQLite | **Yes** | No | Rollup JSON per week | spec 16 |
| 27 | **Weekly summary generation** | Brain handler | **Yes** | No | `weekly_food_summary` alarm | `06-weekly-food-summary.md` |
| 28 | **Weekly summary push** | **21** consumer | **Partial** | No | **14** dispatches; **21** sends | `21-platform-notifications/spec.md` |
| 29 | **`cooking_intent` memory_event** | Brain append | **Cross** | No | Pantry gap → Bela handoff signal | Bela `10-cooking-intent-trigger.md` |
| 30 | **Constraint hard filter** | **07** / **23** | **Yes** consumer | Partial | All recipes/plan slots | constraints table shipped |
| 31 | **Recipe pool read** | **08** consumer | **Yes** | Partial | `recipes` + tools partial | **08** status open |
| 32 | **Tonight convergence** | **54** consumer | **No** | No | Today's plan slot re-validated | spec 51 |
| 33 | **Bela standing order list gen** | **42** consumer | **No** | No | Reads pantry model from **34** | Bela `09-standing-order.md` |
| 34 | **Bela cooking-intent gap check** | **42** consumer | **No** | No | `loadPantryModel()` | Bela `10-cooking-intent-trigger.md` |
| 35 | **Negative-space meal bias** | **38** consumer | **Partial** | No | Standing concerns rank carriers | spec 50 |
| 36 | **Fridge rescue UI** | Mobile | **Yes** | No | Camera → ranked recipes | spec 14, Culina tier |
| 37 | **Meal plan week UI** | Mobile | **Yes** | No | 7-day grid + swap | spec 33 |
| 38 | **Shopping list sheet** | Mobile | **Yes** | No | Delta + predictive section | spec 33, 36 |
| 39 | **Voice plan queries** | **20** consumer | **Yes** | No | "What's for dinner tonight?" (plan context) | spec 33 |
| 40 | **Share sheet `shopping_list`** | **25** route | **Cross** | No | Classifier kind exists — unwired | `08-shared-content-classifier.md` |
| 41 | **Tier gates** | Entitlement | **Yes** | No | Plan preview vs full week; rescue tier | `25-pricing-tiers/02` |
| 42 | **Wearables readiness modulation** | **36** consumer | **Partial** | No | Low readiness → simpler meals | spec 40, `20-wearables/05` |

### Shipped in repo today (pantry-meal-plan-related)

- `recipes` + `recipe_versions` tables + partial recipe tools (**08**) — meal-plan pool input only.
- `constraint` table + constraint tools (**07**) — hard filter for matching/planning.
- `scheduled_alarms` table + alarm tools (**09**) — dispatch shell; no `weekly_food_summary` / pantry alarm handlers.
- `memory_event` table + `appendMemoryEvent` RPC (**05**) — no `cooking_intent` or pantry writers.
- **No** `pantry_*`, `meal_plan*`, `purchase_pattern`, `predictive_nudge`, `weekly_summary` schemas.
- **No** `backend/src/api/pantry/` or `backend/src/agents/brain/_handlers/pantry/`.
- **No** `shared/validator/pantry/` or `mobile/features/pantry/`.
- **No** pantry/meal-plan tests (`rg pantry meal_plan shopping_list backend shared mobile` — zero).

---

## Architecture — inventory to plan to list

```text
Signal sources (not owned by 34)
  ├── Product scans (**24**) — last_seen, frequency
  ├── Receipt line items (**33**) — purchase events, quantities
  ├── Cooking session end (**29**) — ingredient usage depletion
  ├── Pantry camera snapshot (**34**) — episodic detections
  └── Bela delivery confirm (**42**) — restock reset

        │
        ▼
assembleInventorySnapshot(userId)
        │
        ├── probabilistic per-item estimate (likely_have, confidence, last_seen)
        ├── waste-risk queue (age since purchase / detection)
        └── constraint-safe ingredient universe

Surfaces (34 owns)
  │
  ├── Fridge rescue: snapshot → vision detect → matchPantryRecipes → ranked list
  │
  ├── Meal plan: generateMealPlan (1× structured LLM) → meal_plan + slots
  │       └── computeShoppingListDelta → meal_plan_shopping_list + cost estimate
  │
  ├── Predictive pantry (weekly alarm): recompute purchase_pattern → predictive_nudge
  │       └── high confidence → pantry_nudge notification (**21**) + auto-add list row
  │
  └── Weekly summary (weekly alarm): aggregate week signals → weekly_summary JSON
          └── push weekly_food_summary (**21** via **14** dispatch)

Consumers (not 34)
  ├── Tonight (**54**) — reads inventory + active plan slot; convergence rule
  ├── Bela (**42**) — standing order + cooking_intent gap; fulfills shopping list
  ├── In-store co-pilot (**45**) — list_source plan | pantry | dictated
  └── Negative space (**38**) — standing concerns bias plan ranking only
```

---

## Data model (Brain DO SQLite — private)

### Inventory & rescue (spec 14)

| Table | Role |
|---|---|
| `pantry_snapshot` | `snapshot_id`, `user_id`, `created_at`, `source_type` (camera \| voice \| import) |
| `pantry_item_detection` | `snapshot_id`, `item_label`, `confidence`, `quantity_estimate`, optional `matched_product_id` |
| `pantry_recipe_match` | `snapshot_id`, `recipe_id`, `coverage_score`, `substitution_score` |
| `inventory_item_estimate` | `item_key`, `display_name`, `probability_in_stock`, `last_seen_at`, `source_mix_json`, `expires_risk_score` |

> `inventory_item_estimate` is the rolling probabilistic model (not in spec prose as a named table — required by Bela `loadPantryModel()` and meal-plan snapshot assembly). Distinct from episodic `pantry_snapshot`.

### Meal plan (spec 33)

| Table | Role |
|---|---|
| `meal_plan` | `plan_id`, `user_id`, `week_start_date`, `generated_at`, `status` (active \| completed \| abandoned) |
| `meal_plan_slot` | `slot_id`, `plan_id`, `day_index` 1–7, `meal_type`, `recipe_id`, `ingredient_status_json` |
| `meal_plan_shopping_list` | `list_id`, `plan_id`, `ingredient_name`, `upc` nullable, `quantity`, `unit`, `status` (to_buy \| already_have \| bought), `estimated_cost`, `store_suggestion` |

### Predictive pantry (spec 36)

| Table | Role |
|---|---|
| `purchase_pattern` | `item_key`, `display_name`, `purchase_dates` JSON, `median_interval_days`, `last_purchased`, `confidence_tier`, `dismissed` |
| `predictive_nudge` | `nudge_id`, `item_key`, `predicted_need_date`, `surfaced_at`, `resolved_at`, `outcome` (bought \| dismissed \| expired) |

### Weekly summary (spec 16)

| Table | Role |
|---|---|
| `weekly_summary` | `user_id`, `week_start`, `summary_json`, `generated_at`, `delivered_at` |

All personal — never replicate in Supabase.

---

## Inventory estimate rules

**Not real-time inventory** (spec 36 + Bela `10-cooking-intent-trigger.md`):

- Built from scan frequency, receipt purchase dates, cooking-session usage events, and snapshot detections.
- Per-item `probability_in_stock` — items with probability < 0.4 are gap candidates for Bela / shopping list.
- Receipt data contributes estimated quantities (spec 33 inventory snapshot step 1).
- Items used in logged recipes reduce estimated on-hand without requiring a new scan.
- User dismissals on predictive items set `purchase_pattern.dismissed = 1` permanently for that `item_key`.

**Waste minimization** (spec 33): produce purchased ~4 days ago ranks higher than long-life pantry staples for plan inclusion.

---

## Meal plan generation

**Trigger:** voice "Plan my week", weekly plan button, or agent tool.

**Inputs:** inventory snapshot, recent receipt history, recipe pool (**08**), active constraints (**07**/**23**), budget baseline from **33** spend history, waste-risk ingredients, optional **38** standing concerns, optional **36** wearables readiness.

**Rules:**

- Single structured LLM call — not streaming; target <5 seconds.
- No external query during generation — Brain SQLite only.
- Hard constraint clearance before ranking.
- Recipe pool order: saved → cooked successfully → constraint-compatible shared → generated from ingredients.
- Variety: no recipe type within 3 consecutive days; no main protein back-to-back.
- Budget: show estimated plan cost vs historical weekly average when available.

**Adjustability:** swap slot (3 alternatives), "make faster", "remove ingredient", drag reorder — all recompute shopping list delta.

**Tier (conflict — see Obsolete sources):** spec 33 says Core+ full week with free single-day preview; build guide `03` says Luma+ full week, Sapor single-day preview; pricing `02` puts fridge rescue in Culina and weekly summary in Luma.

---

## Shopping list & cost

**Delta:** plan ingredients − inventory estimate.

**Sections:**

- Already have (struck through or separate section).
- To buy — sorted by department.
- Predictive "probably need soon" (spec 36) — separate footer, not merged silently into plan lines.

**Cost:** `purchase_price_event` (**33**) per item first; shared **28** `price_sighting` only when personal history absent.

**Store suggestion:** if ≥2 list items cheaper at one nearby store (community data), one concise note — must pass constraints.

---

## Predictive pantry

**Alarm:** weekly Brain DO pass (same cycle as behavior patterns — **12**/**14**), not per receipt.

**Algorithm per regular item:**

1. Median days between purchases (receipt + scan dates in `purchase_dates`).
2. `last_purchased` / `last_seen`.
3. `predicted_need_date = last_purchased + median_interval`.
4. Surface if `today >= predicted_need_date − 3 days`.

**Minimum data:** 3 events → medium; 5+ low variance → high; 2 or high variance → low (list-only if user opens shopping list).

**Notification:** high → quiet `pantry_nudge` + auto-add; medium → list only; low → never push.

**Learning:** bought within 3 days → correct; no buy within 2 weeks → interval adjust; explicit dismiss → archive pattern.

**Price alert merge (spec 36):** if **33**/**28** price alert and predictive need coincide → one combined notification (**21**).

---

## Weekly food summary

**Distinct from meal plan** — retrospective digest, not forward planning.

**Sources:** scan events, receipt spend (**33**), recipe activity (**08**), constraint matches, Ground interactions, cooking sessions (**29**).

**Output JSON:**

- `one_liner` string
- `observations` array (2–4)
- `action` optional string
- `shareable_moment` optional (**51** viral)

**Generation:** `weekly_food_summary` alarm — Sunday morning local preferred.

**Delivery:** medium priority push (**21**); one push max per day; in-app fallback if suppressed.

**Dispatch shell:** **14** `handle.weekly.food.summary.handler.ts` — **34** owns generation body + `weekly_summary` write.

---

## API surface (intended)

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/pantry/snapshots` | Upload fridge/pantry image → detections |
| `GET` | `/api/pantry/snapshots/:id/matches` | Rescue recipe rankings |
| `POST` | `/api/meal-plans/generate` | Create 7-day (or preview) plan |
| `GET` | `/api/meal-plans/active` | Active plan + slots + shopping list |
| `POST` | `/api/meal-plans/slots/:id/swap` | Swap with alternatives |
| `PATCH` | `/api/meal-plans/shopping-list/:id` | Mark bought / already_have |
| `GET` | `/api/shopping-list` | Unified list (plan + predictive) |
| `GET` | `/api/weekly-summary/latest` | Latest rollup |

Brain internal RPC (no public REST):

- `assembleInventorySnapshot()` — used by plan, rescue, **42** Bela gap check.
- `consumePantryPurchaseSignal(receiptId)` — **33** caller.
- `runPredictivePantryAlarm()` — weekly batch.
- `runWeeklyFoodSummaryAlarm()` — weekly batch.

---

## Voice access (spec 33)

Supported when active plan exists (**20** / cooking agent context):

- "What was I supposed to cook tonight?"
- "I don't have [ingredient], what can I make instead?"
- "What's left in my plan for this week?"

Cooking voice agent (**29**) starts session from plan slot without navigating to plan screen.

---

## 34 vs neighbor boundaries

| In **34** (this feature) | In separate feature |
|---|---|
| Inventory estimate + snapshot tables | Receipt capture + `purchase_price_event` — **33** |
| Purchase pattern + predictive nudge | Shared map prices — **28** |
| Meal plan + shopping list delta | `recipes` DDL + recipe tools — **08** |
| Weekly summary **generation** + `weekly_summary` table | Push send + priority rules — **21** |
| `weekly_food_summary` alarm **body** | Alarm dispatch router — **14** |
| Fridge rescue + plan UI | Tonight daily card — **54** |
| Pantry model read API for Bela | Order escrow, standing-order UI — **42** |
| Cost estimate from private history | In-store session shell — **45** |
| Plan ranking with standing concerns | Gap detection + intervention queue — **38** |
| Constraint-filtered ranking | Condition config DDL — **23** |
| `cooking_intent` payload shape | Bela order creation — **42** |

---

## Critical boundary: inventory estimate ≠ predictive pattern ≠ snapshot

| | **Inventory estimate** | **Pantry snapshot** | **Purchase pattern** |
|---|---|---|---|
| **Question** | What is likely at home now? | What did camera see this moment? | When will they need to buy again? |
| **Update** | Every signal (scan, receipt, cook, snapshot) | Per capture only | Weekly alarm + purchase events |
| **Quantities** | Probabilistic | Per-detection estimate | Intervals only — no quantities (spec 36) |
| **Used by** | Meal plan, rescue, Bela gap | Rescue ranking | Predictive list + nudges |

Weekly food summary is **retrospective** — does not write inventory rows; reads activity streams only.

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/014-pantry-meal-plan-complete.md` | Build-guide docs only — not production |
| `_features/36-pantry-meal-plan/` (glob residue) | Wrong number — canonical folder is **34** |
| Spec 33 tier: "Core tier and above" | Build guide `03`: "Luma and above" — reconcile via **43** |
| Spec 36: "Brain DO's scan-based inventory for spec 33 meal planning" | Spec numbers swapped in prose — meal plan is spec 33, predictive is 36 |
| **33** `status.md`: weekly summary presentation in **35** | Generation lives in **34** `06-weekly-food-summary.md`; **35** may consume patterns |
| Bela `loadPantryModel()` in implementable spec | API not implemented — **34** must expose helper |
| `cooking_intent` memory kind | Documented in Bela spec — not in shipped `memory.event` enum docs |
| Mesa "shared pantry" (spec 41) | Household scope — **41** owns shared rows; **34** owns personal model |

---

## Success metrics (from specs)

| Surface | Metrics |
|---|---|
| Rescue | Snapshots created; recipe clickthrough; less abandonment on missing ingredients |
| Meal plan | Generation rate; shopping list completion; waste proxy; swap rate; budget adherence |
| Predictive | Accuracy within 5 days; notification acceptance; dismissal rate |
| Weekly summary | Open rate; return-to-app; relevance feedback |

---

## Sources

- `build-guide/14-pantry-meal-plan/` (00–06)
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`
- `brioela-specs/16-weekly-food-summary.md`
- `brioela-specs/33-minimum-spend-meal-plan.md`
- `brioela-specs/36-predictive-pantry-intelligence.md`
- `build-guide/13-receipt-intelligence/00-overview.md`
- `build-guide/11-bela/09-standing-orders.md`, `10-cooking-intent-trigger.md`
- `build-guide/38-tonight/00-overview.md`, `01-answer-generation.md`
- `build-guide/37-negative-space-nutrition/03-surfacing-and-memory.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `implementable-specs/bela/01-order-creation.md`, `09-standing-order.md`, `10-cooking-intent-trigger.md`
- `_records/connections/10-pantry-meal-plan-connections.md`
- `_records/build-order/12-layer-pantry-meal-plan.md`
- `_records/session-log/014-pantry-meal-plan-complete.md`
- `_features/08-brain-recipe-tools/spec.md`
- `_features/14-brain-alarm-dispatch/build.md`
- `_features/21-platform-notifications/spec.md`
- `_features/33-receipt-intelligence/spec.md`
- `_features/38-negative-space-nutrition/status.md`
- `_features/42-bela/status.md`
- `_features/54-tonight/status.md`
