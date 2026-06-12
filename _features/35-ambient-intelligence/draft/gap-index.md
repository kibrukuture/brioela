# Draft index — 35-ambient-intelligence

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `wellbeing.signal.schema.gap.md` | `_schemas/wellbeing.signal.schema.ts` | **04** migrations |
| `behavior.pattern.schema.gap.md` | `_schemas/behavior.pattern.schema.ts` | **04** |
| `behavior.pattern.intervention.schema.gap.md` | `_schemas/behavior.pattern.intervention.schema.ts` | **04** |
| `ambient.candidate.schema.gap.md` | `_schemas/ambient.candidate.schema.ts` | **04** |
| `travel.intent.schema.gap.md` | `_schemas/travel.intent.schema.ts` | **04** |
| `travel.preload.job.schema.gap.md` | `_schemas/travel.preload.job.schema.ts` | **04** |
| `travel.local.cache.schema.gap.md` | `_schemas/travel.local.cache.schema.ts` | **04** |
| `time.machine.moment.schema.gap.md` | `_schemas/time.machine.moment.schema.ts` | **04** |
| `guest.session.schema.gap.md` | `_schemas/guest.session.schema.ts` | **04** |
| `ambient.suppression.schema.gap.md` | `_schemas/ambient.suppression.schema.ts` | **04** |
| `ambient.validator.schema.gap.md` | `shared/validator/ambient/*.schema.ts` | — |
| `check.ambient.idle.helper.gap.md` | `_handlers/ambient/check.ambient.idle.helper.ts` | **11** sessions |
| `capture.wellbeing.signal.helper.gap.md` | `_handlers/ambient/capture.wellbeing.signal.helper.ts` | **29**/**20** transcripts |
| `run.ambient.pass.handler.gap.md` | `_handlers/ambient/run.ambient.pass.handler.ts` | **14** G25 |
| `run.ambient.behavior.pattern.pass.handler.gap.md` | `_handlers/ambient/run.ambient.behavior.pattern.pass.handler.ts` | **12** G1 |
| `build.time.machine.candidates.helper.gap.md` | `_handlers/ambient/build.time.machine.candidates.helper.ts` | **24** scan events |
| `review.guest.session.archive.helper.gap.md` | `_handlers/ambient/review.guest.session.archive.helper.ts` | G17 |
| `detect.travel.intent.helper.gap.md` | `_handlers/ambient/detect.travel.intent.helper.ts` | — |
| `run.travel.preload.handler.gap.md` | `_handlers/ambient/run.travel.preload.handler.ts` | **14** G10, G11 |
| `activate.travel.context.handler.gap.md` | `_handlers/ambient/activate.travel.context.handler.ts` | **28** G |
| `surface.ambient.candidate.helper.gap.md` | `_handlers/ambient/surface.ambient.candidate.helper.ts` | **21** G4 |
| `run.find.to.cooking.trigger.helper.gap.md` | `_handlers/ambient/run.find.to.cooking.trigger.helper.ts` | **27** second release |
| `travel.routes.gap.md` | `shared/routes/travel.routes.ts` | — |
| `get.travel.status.handler.gap.md` | `backend/src/api/travel/_handlers/get.travel.status.handler.ts` | G9 |
| `time.machine.inline.gap.md` | `mobile/features/ambient/components/time.machine.inline.tsx` | G16 |
| `guest.mode.constraint.overlay.gap.md` | `mobile/features/ambient/components/guest.constraint.badge.tsx` | G18 |
| `travel.ready.banner.gap.md` | `mobile/features/ambient/components/travel.ready.banner.tsx` | **28** consumer |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **12** | `_features/12-brain-sub-agents/draft/` — BehaviorPatternAgent |
| **14** | `_features/14-brain-alarm-dispatch/draft/run.inline.alarm.session.handler.gap.md` |
| **21** | `_features/21-platform-notifications/draft/` — send-push, suppression |
| **27** | `_features/27-ground/draft/match.find.to.cooking.gap.md` |
| **34** | `_features/34-pantry-meal-plan/draft/handle.weekly.food.summary.handler.gap.md` |

## Orchestration note (G1)

`behavior_pattern_detection` alarm should chain **12** spawn → **35** `promotePatternInterventions` — do not ship two independent LLM pattern detectors without explicit ordering in `run.ambient.behavior.pattern.pass.handler.gap.md`.

**Total in this folder:** 28 files (27 gap + this index).
