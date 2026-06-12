# Draft index — 36-wearables

## Gap / production snapshots

| File | Target path | Blocked by |
|---|---|---|
| `wearable.connection.schema.gap.md` | `_schemas/wearable.connection.schema.ts` | **04** migrations |
| `glucose.meal.window.schema.gap.md` | `_schemas/glucose.meal.window.schema.ts` | **04** |
| `wearable.audit.event.schema.gap.md` | `_schemas/wearable.audit.event.schema.ts` | **04** |
| `wearable.daily.summary.validator.gap.md` | `shared/validator/wearables/*.schema.ts` | — |
| `wearables.routes.gap.md` | `shared/routes/wearables.routes.ts` | — |
| `post.wearable.daily.summary.handler.gap.md` | `backend/src/api/wearables/_handlers/post.wearable.daily.summary.handler.ts` | G3 |
| `ingest.wearable.daily.summary.handler.gap.md` | `_handlers/wearables/ingest.wearable.daily.summary.handler.ts` | **22** G2 |
| `route.wearable.memory.helper.gap.md` | `_handlers/wearables/route.wearable.memory.helper.ts` | **05**, **22** |
| `open.glucose.meal.window.handler.gap.md` | `_handlers/wearables/open.glucose.meal.window.handler.ts` | **24** G10 |
| `derive.glucose.window.metrics.helper.gap.md` | `_handlers/wearables/derive.glucose.window.metrics.helper.ts` | G9 |
| `write.spike.trigger.memory.helper.gap.md` | `_handlers/wearables/write.spike.trigger.memory.helper.ts` | **05** |
| `disconnect.wearable.handler.gap.md` | `_handlers/wearables/disconnect.wearable.handler.ts` | G14 |
| `delete.wearable.data.handler.gap.md` | `_handlers/wearables/delete.wearable.data.handler.ts` | G14 |
| `wearable.connector.types.gap.md` | `mobile/features/wearables/types/wearable.connector.types.ts` | — |
| `apple.health.connector.gap.md` | `mobile/features/wearables/connectors/apple.health.connector.ts` | G5 |
| `oura.connector.gap.md` | `mobile/features/wearables/connectors/oura.connector.ts` | — |
| `build.daily.summary.helper.gap.md` | `mobile/features/wearables/helpers/build.daily.summary.helper.ts` | G4 |
| `connected.devices.screen.gap.md` | `mobile/features/wearables/screens/connected.devices.screen.tsx` | G4 |
| `scan.glucose.overlay.helper.gap.md` | `tools/product-scan/build.glucose.verdict.overlay.helper.ts` | **24**, G12 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **22** | `_features/22-health-intelligence/draft/health.captures.schema.gap.md` |
| **35** | `_features/35-ambient-intelligence/draft/wellbeing.signal.schema.gap.md` — add `wearable_corroboration` at implementation |
| **21** | Wearables push policy — **21** G10, no dedicated draft |

## Storage routing note (G8)

Daily summary → `health_captures` (append) + `user_memory.health.*` (rolling mirror). CGM windows → `glucose_meal_window` (derived). Spike facts → `user_memory` `health.glucose:spike_triggers`.

**Total in this folder:** 20 files (19 snapshots + this index).
