# Pantry + Meal Plan — Build

Feature **34**. Production paths under `backend/src/api/pantry/` (handlers, helpers, routes), `backend/src/agents/brain/_schemas/pantry.*.ts` + `meal.plan.*.ts` + `purchase.pattern.schema.ts` + `weekly.summary.schema.ts`, `backend/src/agents/brain/_handlers/pantry/`, `shared/validator/pantry/`, `shared/routes/pantry.routes.ts`, `mobile/features/pantry/`, and `mobile/network/pantry/`. Vision detection reuses GPT-4o mini `generateObject` pattern from **24**/**33**.

**Scope:** inventory estimate model, pantry snapshots, recipe rescue matching, meal plan generation + slots + shopping list delta, predictive pantry alarm pass, weekly food summary generation, purchase-signal consumer from **33**, cost estimation hooks, mobile rescue + plan + list UI, tier gates. **Not in 34 build:** receipt ingest (**33**), `price_sighting` schema (**28**), recipe tools DDL (**08**), alarm dispatch router (**14**), push send (**21**), Tonight card (**54**), Bela order tables (**42**), negative-space detection pass (**38**), Mesa shared pantry (**41**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/14-pantry-meal-plan/` (7 files) | ✓ docs only |
| `brioela-specs/14`, `16`, `33`, `36` | ✓ specs |
| `_records/connections/10-pantry-meal-plan-connections.md` | ✓ ledger |
| `recipes` + partial recipe tools (**08**) | ✓ pool input — tools open |
| `constraint` tools (**07**) | ✓ hard filter consumer |
| `scheduled_alarms` + alarm tools (**09**) | ✓ table — no pantry alarm handlers |
| `memory_event` + `appendMemoryEvent` (**05**) | ✓ — no `cooking_intent` writer |
| Pantry / meal-plan Brain tables | ✗ |
| Inventory estimate helper | ✗ |
| Pantry snapshot API + vision | ✗ |
| Meal plan generation | ✗ |
| Shopping list delta + cost | ✗ |
| Predictive pantry alarm | ✗ |
| Weekly summary generation | ✗ |
| Purchase signal consumer (**33**) | ✗ |
| Mobile `features/pantry/` | ✗ |
| Pantry tests | ✗ |

**Zero pantry-meal-plan production code.** `rg 'pantry_snapshot|meal_plan|purchase_pattern|weekly_summary' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared validator + routes (**34**)

| File | Role |
|---|---|
| `shared/validator/pantry/pantry.snapshot.schema.ts` | Snapshot + detection request/response |
| `shared/validator/pantry/pantry.recipe.match.schema.ts` | Rescue match rows |
| `shared/validator/pantry/inventory.estimate.schema.ts` | Probabilistic inventory row shape |
| `shared/validator/pantry/meal.plan.schema.ts` | Plan header, slots, generate request |
| `shared/validator/pantry/meal.plan.shopping.list.schema.ts` | List item + patch status |
| `shared/validator/pantry/purchase.pattern.schema.ts` | Pattern + nudge shapes |
| `shared/validator/pantry/weekly.summary.schema.ts` | Summary JSON + read response |
| `shared/routes/pantry.routes.ts` | `PANTRY_ROUTES`, snapshot, plan, list, summary |

### Brain SQLite schemas (**34**)

| File | Role |
|---|---|
| `_schemas/pantry.snapshot.schema.ts` | `pantry_snapshot` |
| `_schemas/pantry.item.detection.schema.ts` | `pantry_item_detection` |
| `_schemas/pantry.recipe.match.schema.ts` | `pantry_recipe_match` |
| `_schemas/inventory.item.estimate.schema.ts` | Rolling probabilistic inventory |
| `_schemas/meal.plan.schema.ts` | `meal_plan` header |
| `_schemas/meal.plan.slot.schema.ts` | `meal_plan_slot` |
| `_schemas/meal.plan.shopping.list.schema.ts` | `meal_plan_shopping_list` |
| `_schemas/purchase.pattern.schema.ts` | `purchase_pattern` |
| `_schemas/predictive.nudge.schema.ts` | `predictive_nudge` |
| `_schemas/weekly.summary.schema.ts` | `weekly_summary` |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add pantry/meal-plan tables to Brain chain |

### Backend API — pantry module (**34**)

| File | Role |
|---|---|
| `backend/src/api/pantry/pantry.route.ts` | Hono mount at `/api/pantry`, `/api/meal-plans`, `/api/shopping-list` |
| `backend/src/api/pantry/pantry.controller.ts` | Controller wiring |
| `backend/src/api/pantry/_handlers/post.pantry.snapshot.handler.ts` | `POST /api/pantry/snapshots` |
| `backend/src/api/pantry/_handlers/get.pantry.matches.handler.ts` | `GET /api/pantry/snapshots/:id/matches` |
| `backend/src/api/pantry/_handlers/post.meal.plan.generate.handler.ts` | `POST /api/meal-plans/generate` |
| `backend/src/api/pantry/_handlers/get.active.meal.plan.handler.ts` | `GET /api/meal-plans/active` |
| `backend/src/api/pantry/_handlers/post.meal.plan.slot.swap.handler.ts` | `POST /api/meal-plans/slots/:id/swap` |
| `backend/src/api/pantry/_handlers/patch.shopping.list.item.handler.ts` | Mark bought / already_have |
| `backend/src/api/pantry/_handlers/get.shopping.list.handler.ts` | Unified plan + predictive list |
| `backend/src/api/pantry/_handlers/get.weekly.summary.handler.ts` | `GET /api/weekly-summary/latest` |
| `backend/src/api/pantry/_handlers/index.ts` | Barrel |
| `backend/src/api/pantry/index.ts` | Module export |

Register in backend app router (**01**).

### Pantry intelligence pipeline (**34**)

| File | Role |
|---|---|
| `_handlers/pantry/consume.pantry.purchase.signal.helper.ts` | **33** receipt signal → inventory + pattern |
| `_handlers/pantry/apply.cooking.usage.helper.ts` | **29** session end → depletion |
| `_handlers/pantry/assemble.inventory.snapshot.helper.ts` | Unified estimate for plan/rescue/Bela |
| `_handlers/pantry/vision.detect.pantry.items.handler.ts` | GPT-4o mini pantry vision |
| `_handlers/pantry/write.pantry.snapshot.handler.ts` | Snapshot + detections persist |
| `_handlers/pantry/match.pantry.recipes.helper.ts` | Coverage + constraint rank |
| `_handlers/pantry/generate.meal.plan.handler.ts` | Structured LLM plan generation |
| `_handlers/pantry/compute.shopping.list.delta.helper.ts` | Plan − inventory |
| `_handlers/pantry/estimate.shopping.list.cost.helper.ts` | **33** price history + **28** fallback |
| `_handlers/pantry/suggest.store.for.list.helper.ts` | Multi-item cheaper-store note |
| `_handlers/pantry/swap.meal.plan.slot.helper.ts` | 3 alternatives + list recompute |
| `_handlers/pantry/log.cooking.intent.helper.ts` | `memory_event` `cooking_intent` for **42** |
| `_handlers/pantry/index.ts` | Barrel |

### Weekly alarm batch (**34** body; **14** dispatches)

| File | Role |
|---|---|
| `_handlers/pantry/recompute.purchase.patterns.helper.ts` | Median intervals + confidence tiers |
| `_handlers/pantry/surface.predictive.nudges.helper.ts` | Threshold + tier behavior |
| `_handlers/pantry/run.predictive.pantry.alarm.handler.ts` | Weekly predictive pass |
| `_handlers/pantry/aggregate.weekly.food.signals.helper.ts` | Collect week inputs |
| `_handlers/pantry/generate.weekly.summary.handler.ts` | LLM one-liner + observations |
| `_handlers/pantry/run.weekly.food.summary.handler.ts` | Orchestrates summary alarm |
| `_handlers/pantry/index.ts` | Barrel |

Wire `predictive_pantry` and `weekly_food_summary` cases in **14** `dispatch.alarm.handler.ts`.

### Repositories (**34**)

| File | Role |
|---|---|
| `_repositories/read.inventory.estimate.repository.ts` | Per-user inventory rows |
| `_repositories/write.inventory.estimate.repository.ts` | Upsert from signals |
| `_repositories/read.pantry.snapshot.repository.ts` | Snapshot + detections |
| `_repositories/write.pantry.snapshot.repository.ts` | Insert snapshot |
| `_repositories/read.meal.plan.repository.ts` | Active plan + slots + list |
| `_repositories/write.meal.plan.repository.ts` | Plan CRUD + slot updates |
| `_repositories/read.purchase.pattern.repository.ts` | Patterns + open nudges |
| `_repositories/write.purchase.pattern.repository.ts` | Pattern recompute upsert |
| `_repositories/read.weekly.summary.repository.ts` | Latest by week |
| `_repositories/write.weekly.summary.repository.ts` | Alarm batch insert |

### Entitlement (**34**)

| File | Role |
|---|---|
| `_helpers/check.meal.plan.entitlement.helper.ts` | Full week vs single-day preview |
| `_helpers/check.pantry.rescue.entitlement.helper.ts` | Culina fridge rescue gate (**43**) |

### Mobile (**34**)

| File | Role |
|---|---|
| `mobile/features/pantry/components/pantry.capture.feature.tsx` | Fridge/pantry camera |
| `mobile/features/pantry/components/rescue.recipe.list.tsx` | Ranked matches post-snapshot |
| `mobile/features/pantry/components/meal.plan.week.feature.tsx` | 7-day grid + ingredient status |
| `mobile/features/pantry/components/meal.plan.slot.swap.sheet.tsx` | Swap UI |
| `mobile/features/pantry/components/shopping.list.sheet.tsx` | Delta + predictive footer |
| `mobile/features/pantry/components/weekly.summary.card.tsx` | Summary display |
| `mobile/features/pantry/hooks/use.meal.plan.hook.ts` | Active plan fetch |
| `mobile/features/pantry/hooks/use.shopping.list.hook.ts` | List + mark bought |
| `mobile/network/pantry/post-snapshot.api.ts` | Snapshot upload |
| `mobile/network/pantry/meal-plan.api.ts` | Generate + get + swap |
| `mobile/network/pantry/shopping-list.api.ts` | Unified list |
| `mobile/network/pantry/weekly-summary.api.ts` | Latest summary |

### Tests (**34**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/pantry/assemble.inventory.snapshot.test.ts` | Signal merge + probability |
| `backend/src/agents/brain/_handlers/pantry/compute.shopping.list.delta.test.ts` | Delta math |
| `backend/src/agents/brain/_handlers/pantry/recompute.purchase.patterns.test.ts` | Median interval + tiers |
| `backend/src/api/pantry/meal.plan.generate.test.ts` | Entitlement + validation |

---

## Acceptance criteria

### Inventory model

- [ ] `assembleInventorySnapshot` merges scans, receipts, cooking usage, latest snapshot — no Supabase reads.
- [ ] Per-item `probability_in_stock` in [0,1]; gap threshold 0.4 for Bela handoff.
- [ ] Waste-risk score increases with days since purchase/detection for perishables.
- [ ] **33** `consumePantryPurchaseSignal` updates inventory + `purchase_pattern` — idempotent per receipt line.

### Pantry snapshot / rescue

- [ ] `POST /api/pantry/snapshots` stores image + runs vision detection.
- [ ] Detection confidence hidden from primary UX — expanded review only (spec 14).
- [ ] `matchPantryRecipes` hard-filters constraints before ranking.
- [ ] Pool order: saved → cooked → shared-compatible → generated.

### Meal plan

- [ ] `POST /api/meal-plans/generate` completes single structured LLM call — target <5s.
- [ ] Plan stored in Brain DO only — not Supabase.
- [ ] Variety rules enforced: no type repeat within 3 days; no back-to-back main protein.
- [ ] `ingredient_status_json` marks at_home vs to_buy per slot.
- [ ] Swap returns exactly 3 alternatives sharing at-home ingredients where possible.
- [ ] Tier gate: preview single-day vs full week per **43** (resolve Core vs Luma conflict).

### Shopping list

- [ ] Delta recomputes on plan generate, swap, and ingredient removal.
- [ ] Department sort: produce, dairy, meat, pantry, frozen, other.
- [ ] Cost uses `purchase_price_event` first; **28** only when personal history missing.
- [ ] Predictive items in separate footer section — not silently merged into plan lines.
- [ ] Store suggestion requires constraint-safe items and ≥2 cheaper at same store.

### Predictive pantry

- [ ] Weekly alarm recomputes `purchase_pattern` — not on every receipt.
- [ ] Minimum 3 purchase events before medium confidence; 5+ for high.
- [ ] High confidence → `pantry_nudge` notification (**21**) + auto-add list row.
- [ ] Medium → list only; low → visible only when shopping list opened.
- [ ] Dismiss sets `purchase_pattern.dismissed = 1` permanently for item_key.
- [ ] Bought within 3 days of prediction → `outcome = bought`.

### Weekly food summary

- [ ] `weekly_food_summary` alarm generates `weekly_summary` row Sunday AM local preferred.
- [ ] Output: one-liner + 2–4 observations + optional action — no overconfident causal language.
- [ ] **14** dispatches; **21** delivers push at medium priority.
- [ ] Retrospective only — does not mutate inventory tables.

### Cross-feature hooks

- [ ] **33** emits purchase signal — **34** consumes; **33** does not write pantry tables.
- [ ] **08** recipe pool readable for plan generation (active recipes only).
- [ ] **07**/**23** hard constraint filter on all ranked recipes.
- [ ] **42** can call `assembleInventorySnapshot` / gap check — Bela owns order creation.
- [ ] **54** reads active plan slot — convergence documented in spec 51; no forked inventory model.
- [ ] **38** standing concerns bias plan ranking when confirmed — no gap detection in **34**.
- [ ] `cooking_intent` memory_event written when gap + user intent detected.

### Tests

- [ ] Inventory assembly from mixed signals.
- [ ] Shopping list delta with partial inventory.
- [ ] Purchase pattern median + confidence tier boundaries.
- [ ] Entitlement gate returns preview-only for below-tier users.

---

## Build order dependencies

1. **04-brain-foundation** — Drizzle migrations for pantry/meal-plan tables.
2. **07-brain-constraint-tools** — hard filter for matching/planning.
3. **08-brain-recipe-tools** — recipe pool (partial OK for MVP with saved recipes only).
4. **09-brain-alarm-tools** — schedule `predictive_pantry` / `weekly_food_summary` rows.
5. **14-brain-alarm-dispatch** — dispatch cases for weekly handlers.
6. **24-scanner** — scan history signal + vision pattern reuse.
7. **33-receipt-intelligence** — purchase signals + price history for cost (can stub signals for MVP).
8. **28-map** — optional store suggestion fallback.
9. **21-platform-notifications** — `pantry_nudge`, `weekly_food_summary` push kinds.
10. **43-pricing-tiers** — meal plan + rescue entitlements.

**Blocks:** **42-bela** (pantry model read), **54-tonight** (inventory + plan convergence), **45-in-store-copilot** (list sources), **38-negative-space-nutrition** (plan bias consumer), **35-ambient-intelligence** (summary pattern consumption).

---

## Draft count

**28** files in `draft/` — 27 gap/intended snapshots + `gap-index.md`.
