# Draft index — 34-pantry-meal-plan

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `pantry.snapshot.schema.gap.md` | `_schemas/pantry.snapshot.schema.ts` | **04** migrations |
| `pantry.item.detection.schema.gap.md` | `_schemas/pantry.item.detection.schema.ts` | **04** |
| `pantry.recipe.match.schema.gap.md` | `_schemas/pantry.recipe.match.schema.ts` | **04** |
| `inventory.item.estimate.schema.gap.md` | `_schemas/inventory.item.estimate.schema.ts` | **04** |
| `meal.plan.schema.gap.md` | `_schemas/meal.plan.schema.ts` | **04** |
| `meal.plan.slot.schema.gap.md` | `_schemas/meal.plan.slot.schema.ts` | **04** |
| `meal.plan.shopping.list.schema.gap.md` | `_schemas/meal.plan.shopping.list.schema.ts` | **04** |
| `purchase.pattern.schema.gap.md` | `_schemas/purchase.pattern.schema.ts` | **04** |
| `predictive.nudge.schema.gap.md` | `_schemas/predictive.nudge.schema.ts` | **04** |
| `weekly.summary.schema.gap.md` | `_schemas/weekly.summary.schema.ts` | **04** |
| `pantry.validator.schema.gap.md` | `shared/validator/pantry/*.schema.ts` | — |
| `pantry.routes.gap.md` | `shared/routes/pantry.routes.ts` | — |
| `consume.pantry.purchase.signal.helper.gap.md` | `_handlers/pantry/consume.pantry.purchase.signal.helper.ts` | **33** G24 |
| `assemble.inventory.snapshot.helper.gap.md` | `_handlers/pantry/assemble.inventory.snapshot.helper.ts` | G3 |
| `vision.detect.pantry.items.handler.gap.md` | `_handlers/pantry/vision.detect.pantry.items.handler.ts` | **24**, **33** G7 |
| `match.pantry.recipes.helper.gap.md` | `_handlers/pantry/match.pantry.recipes.helper.ts` | **08** G24 |
| `generate.meal.plan.handler.gap.md` | `_handlers/pantry/generate.meal.plan.handler.ts` | G8 |
| `compute.shopping.list.delta.helper.gap.md` | `_handlers/pantry/compute.shopping.list.delta.helper.ts` | G9 |
| `estimate.shopping.list.cost.helper.gap.md` | `_handlers/pantry/estimate.shopping.list.cost.helper.ts` | **33** G10 |
| `run.predictive.pantry.alarm.handler.gap.md` | `_handlers/pantry/run.predictive.pantry.alarm.handler.ts` | **14** G25 |
| `handle.weekly.food.summary.handler.gap.md` | `_handlers/pantry/run.weekly.food.summary.handler.ts` | **14** G15 |
| `post.pantry.snapshot.handler.gap.md` | `backend/src/api/pantry/_handlers/post.pantry.snapshot.handler.ts` | G1 |
| `post.meal.plan.generate.handler.gap.md` | `backend/src/api/pantry/_handlers/post.meal.plan.generate.handler.ts` | G1 |
| `get.active.meal.plan.handler.gap.md` | `backend/src/api/pantry/_handlers/get.active.meal.plan.handler.ts` | G1 |
| `pantry.capture.feature.gap.md` | `mobile/features/pantry/components/pantry.capture.feature.tsx` | G19 |
| `meal.plan.week.feature.gap.md` | `mobile/features/pantry/components/meal.plan.week.feature.tsx` | G20 |
| `shopping.list.sheet.gap.md` | `mobile/features/pantry/components/shopping.list.sheet.tsx` | G21 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **33** | `_features/33-receipt-intelligence/draft/emit.pantry.purchase.signal` — producer in **33** `build.md` |
| **33** | `purchase.price.event.schema.gap.md` — cost estimate input |
| **08** | `_features/08-brain-recipe-tools/` — recipe pool |
| **14** | `_features/14-brain-alarm-dispatch/build.md` — dispatch shell |
| **42** | `implementable-specs/bela/10-cooking-intent-trigger.md` — order handoff |

## Data model note

Three distinct concepts — do not merge tables:

1. `inventory_item_estimate` — probabilistic on-hand model (meal plan, Bela gap)
2. `pantry_snapshot` + detections — episodic camera rescue
3. `purchase_pattern` — interval prediction (spec 36)

**Total in this folder:** 28 files (27 gap + this index).
