# Draft index — 27-ground

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `find.schema.gap.md` | `shared/validator/find.schema.ts` | **01** shared package |
| `find.drizzle.schema.gap.md` | `shared/drizzle/schema/find.schema.ts` | Supabase migration, **28** places FK |
| `location.signal.summary.schema.gap.md` | `shared/drizzle/schema/location.signal.summary.schema.ts` | Supabase migration |
| `user.find.history.schema.gap.md` | `backend/src/agents/brain/_schemas/user.find.history.schema.ts` | **04** Brain migration |
| `create.find.handler.gap.md` | `backend/src/api/finds/_handlers/create.find.handler.ts` | schemas, gate helper, R2 |
| `get.finds.nearby.handler.gap.md` | `backend/src/api/finds/_handlers/get.finds.nearby.handler.ts` | summary table |
| `run.ai.gate.helper.gap.md` | `backend/src/api/finds/_helpers/run.ai.gate.helper.ts` | AI SDK |
| `draft.find.from.scan.helper.gap.md` | `backend/src/api/finds/_helpers/draft.find.from.scan.helper.ts` | **24** scan result shape |
| `update.location.signal.summary.helper.gap.md` | `backend/src/api/finds/_helpers/update.location.signal.summary.helper.ts` | drizzle schemas |
| `score.find.relevance.helper.gap.md` | `backend/src/api/finds/_helpers/score.find.relevance.helper.ts` | Brain profile RPC |
| `submit-find.tool.gap.md` | `tools/ground/submit-find.ts` | gate + DB |
| `log-find-from-scan.tool.gap.md` | `tools/ground/log-find-from-scan.ts` | draft helper |
| `mobile.ground-map.feature.gap.md` | `mobile/features/ground/components/ground-map.feature.tsx` | Mapbox (**28**), network APIs |
| `mobile.find-draft.card.gap.md` | `mobile/features/ground/components/find-draft.card.tsx` | **24** scan integration |
| `mobile.find-submission.sheet.gap.md` | `mobile/features/ground/components/find-submission.sheet.tsx` | voice STT |
| `ground.signal.layer.gap.md` | `mobile/features/ground/components/ground-signal-layer.tsx` | Skia + summaries API |
| `mobile.haptic.discovery.hook.gap.md` | `mobile/features/ground/hooks/use.haptic.discovery.hook.ts` | second release |
| `match.find.to.cooking.gap.md` | `backend/src/api/finds/_helpers/match.find.to.cooking.gap.helper.ts` | **05** `ingredient_not_found`, **35** |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **24** | `_features/24-scanner/draft/mobile.scanner.feature.gap.md` — wire Add Find |
| **28** | `_features/28-map/` (stub) — Mapbox base + layer toggle |
| **42** | Bela shopper draft batch — `implementable-specs/bela/07-ground-contribution.md` |

**Total in this folder:** 19 files (18 gap + this index).
