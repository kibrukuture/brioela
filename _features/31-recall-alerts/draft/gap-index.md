# Draft index — 31-recall-alerts

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `recall.schema.gap.md` | `shared/drizzle/schema/recall.schema.ts` | **01** migrations |
| `product.exposure.schema.gap.md` | `shared/drizzle/schema/product.exposure.schema.ts` | **24** scan_events |
| `recall.alert.schema.gap.md` | `shared/validator/recall/recall.alert.schema.ts` | — |
| `recall.routes.gap.md` | `shared/routes/recall.routes.ts` | — |
| `poll.recall.feeds.job.gap.md` | `backend/src/jobs/recall/poll.recall.feeds.job.ts` | feed adapters |
| `fda.recall.adapter.gap.md` | `backend/src/jobs/recall/_adapters/fda.recall.adapter.ts` | FDA API keys |
| `match.recall.entry.handler.gap.md` | `backend/src/jobs/recall/match.recall.entry.handler.ts` | G3, G4 schemas |
| `classify.match.confidence.helper.gap.md` | `backend/src/jobs/recall/_helpers/classify.match.confidence.helper.ts` | — |
| `check.recall.on.scan.handler.gap.md` | `backend/src/jobs/recall/check.recall.on.scan.handler.ts` | **24** hook |
| `handle.recall.match.handler.gap.md` | `backend/src/agents/brain/_handlers/recall/handle.recall.match.handler.ts` | **21** send-push |
| `list.resolve.recall.handlers.gap.md` | `backend/src/api/recall/_handlers/*.ts` | G3 |
| `recall.detail.feature.gap.md` | `mobile/features/recall/recall.feature.tsx` | API |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **14** | `_features/14-brain-alarm-dispatch/draft/recall.check.boundary.gap.md` — Path B boundary |
| **24** | `_features/24-scanner/draft/scan.events.schema.gap.md` — match target |
| **21** | `_features/21-platform-notifications/draft/send-push.brain.tool.gap.md` — delivery |

## Shipped (not in draft/)

None — zero production files for feature **31**.

**Total in this folder:** 13 files (12 gap + this index).
