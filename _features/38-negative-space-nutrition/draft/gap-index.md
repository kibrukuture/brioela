# Draft index — 38-negative-space-nutrition

## Gap / production snapshots

| File | Target path | Blocked by |
|---|---|---|
| `nutrient.presence.window.schema.gap.md` | `_schemas/nutrient.presence.window.schema.ts` | **04** G1 |
| `nutrition.gap.schema.gap.md` | `_schemas/nutrition.gap.schema.ts` | **04** G1 |
| `diet.gaps.memory.schema.gap.md` | `shared/validator/negative-space/diet.gaps.memory.schema.ts` | — |
| `compute.coverage.score.helper.gap.md` | `_helpers/negative-space/compute.coverage.score.helper.ts` | G3, **33**, **34** |
| `classify.nutrient.presence.helper.gap.md` | `_helpers/negative-space/classify.nutrient.presence.helper.ts` | **24** G4 |
| `detect.structural.absences.helper.gap.md` | `_helpers/negative-space/detect.structural.absences.helper.ts` | G4 |
| `detect.displacement.gaps.helper.gap.md` | `_helpers/negative-space/detect.displacement.gaps.helper.ts` | **05** diet.* |
| `dedupe.gap.candidates.helper.gap.md` | `_helpers/negative-space/dedupe.gap.candidates.helper.ts` | G9 |
| `enqueue.gap.intervention.candidate.helper.gap.md` | `_helpers/negative-space/enqueue.gap.intervention.candidate.helper.ts` | **35** G10 |
| `run.negative.space.detection.pass.handler.gap.md` | `_handlers/negative-space/run.negative.space.detection.pass.handler.ts` | G7, **12** G8 |
| `write.diet.gaps.memory.handler.gap.md` | `_handlers/negative-space/write.diet.gaps.memory.handler.ts` | **05** G9 |
| `close.nutrition.gap.handler.gap.md` | `_handlers/negative-space/close.nutrition.gap.handler.ts` | G9 |
| `apply.standing.concern.plan.bias.helper.gap.md` | `_handlers/pantry/apply.standing.concern.plan.bias.helper.ts` | **34** G12 |
| `check.condition.gap.suppression.helper.gap.md` | `_helpers/negative-space/check.condition.gap.suppression.helper.ts` | **23** G15 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **35** | `_features/35-ambient-intelligence/draft/run.ambient.behavior.pattern.pass.handler.gap.md` — shared weekly budget |
| **34** | `_features/34-pantry-meal-plan/draft/generate.meal.plan.handler.gap.md` — add `diet.gaps` input |
| **37** | `_features/37-craving-decoder/draft/estimate.eating.gap.helper.gap.md` — recency only, not **38** |
| **24** | `_features/24-scanner/` — verdict carrier note consumer |

## 37 vs 38 note

Coverage gate + nutrient-category absence (**38**) ≠ eating-gap recency (**37**). Never merge helpers.

**Total in this folder:** 15 files (14 snapshots + this index).
