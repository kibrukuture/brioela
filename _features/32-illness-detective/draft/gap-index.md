# Draft index — 32-illness-detective

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `illness.report.schema.gap.md` | `_schemas/illness.report.schema.ts` | **04** migrations |
| `illness.suspect.schema.gap.md` | `_schemas/illness.suspect.schema.ts` | **04** |
| `community.illness.signal.schema.gap.md` | `shared/drizzle/schema/community.illness.schema.ts` | **01** migrations |
| `sift.result.schema.gap.md` | `shared/validator/sift/sift.result.schema.ts` | — |
| `run.sift.schema.gap.md` | `_tools/_schemas/run.sift.schema.ts` | — |
| `compute.lookback.window.helper.gap.md` | `_handlers/sift/compute.lookback.window.helper.ts` | — |
| `build.sift.context.helper.gap.md` | `_handlers/sift/build.sift.context.helper.ts` | **05**, **31** |
| `rank.sift.suspects.handler.gap.md` | `_handlers/sift/rank.sift.suspects.handler.ts` | LLM client |
| `run.sift.executable.gap.md` | `_tools/sift/run.sift.executable.ts` | G1–G4 |
| `write.community.illness.signal.helper.gap.md` | `_handlers/sift/write.community.illness.signal.helper.ts` | G3 |
| `handle.sickness.followup.handler.gap.md` | `_handlers/sift/handle.sickness.followup.handler.ts` | **14** shell |
| `schedule.sift.followup.helper.gap.md` | `_handlers/sift/schedule.sift.followup.helper.ts` | **09** |
| `sift.result.feature.gap.md` | `mobile/features/illness.detective/sift.feature.tsx` | **20** |
| `illness.detective.skill.seed.gap.md` | `_seeds/illness.detective.skill.seed.ts` | Brain init |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **14** | `_features/14-brain-alarm-dispatch/draft/run.inline.alarm.session.handler.gap.md` |
| **14** | `_features/14-brain-alarm-dispatch/draft/dispatch.alarm.handler.gap.md` |
| **31** | `_features/31-recall-alerts/draft/recall.schema.gap.md` |
| **09** | `_features/09-brain-alarm-tools/draft/schedule.user.alarm.schema.md` |

## Shipped (not in draft/)

- `schedule.user.alarm.schema.ts` — `sickness_followup` example string
- `alarm.tool.test.ts` — schedules test `sickness_followup` row

**Total in this folder:** 15 files (14 gap + this index).
