# Draft index — 33-receipt-intelligence

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `receipt.schema.gap.md` | `_schemas/receipt.schema.ts` | **04** migrations |
| `receipt.raw.extraction.schema.gap.md` | `_schemas/receipt.raw.extraction.schema.ts` | **04** |
| `receipt.line.item.schema.gap.md` | `_schemas/receipt.line.item.schema.ts` | **04** |
| `purchase.price.event.schema.gap.md` | `_schemas/purchase.price.event.schema.ts` | **04** |
| `spend.summary.schema.gap.md` | `_schemas/spend.summary.schema.ts` | **04** |
| `personal.price.alert.schema.gap.md` | `_schemas/personal.price.alert.schema.ts` | **04** |
| `receipt.vision.schema.gap.md` | `shared/validator/receipt/receipt.vision.schema.ts` | — |
| `receipt.validator.schema.gap.md` | `shared/validator/receipt/receipt.schema.ts` | — |
| `receipt.routes.gap.md` | `shared/routes/receipt.routes.ts` | — |
| `post.receipt.ingest.handler.gap.md` | `backend/src/api/receipt/_handlers/post.ingest.handler.ts` | G1 |
| `get.receipt.handler.gap.md` | `backend/src/api/receipt/_handlers/get.receipt.handler.ts` | G1 |
| `vision.extract.receipt.handler.gap.md` | `_handlers/receipt/vision.extract.receipt.handler.ts` | G7, **24** |
| `normalize.receipt.helper.gap.md` | `_handlers/receipt/normalize.receipt.helper.ts` | G7 |
| `match.receipt.line.items.helper.gap.md` | `_handlers/receipt/match.receipt.line.items.helper.ts` | **24** G* |
| `write.purchase.price.events.helper.gap.md` | `_handlers/receipt/write.purchase.price.events.helper.ts` | G3 |
| `log.receipt.memory.event.helper.gap.md` | `_handlers/receipt/log.receipt.memory.event.helper.ts` | **05** |
| `write.price.sighting.from.receipt.helper.gap.md` | `_handlers/receipt/write.price.sighting.from.receipt.helper.ts` | **28** G7 |
| `compute.spend.summary.helper.gap.md` | `_handlers/receipt/compute.spend.summary.helper.ts` | G4 |
| `detect.personal.price.change.helper.gap.md` | `_handlers/receipt/detect.personal.price.change.helper.ts` | G15 |
| `suggest.cheaper.equivalent.helper.gap.md` | `_handlers/receipt/suggest.cheaper.equivalent.helper.ts` | **07**, **28** |
| `run.receipt.weekly.alarm.handler.gap.md` | `_handlers/receipt/run.receipt.weekly.alarm.handler.ts` | **14** |
| `receipt.capture.feature.gap.md` | `mobile/features/receipt/components/receipt.capture.feature.tsx` | G19 |
| `receipt.detail.sheet.gap.md` | `mobile/features/receipt/components/receipt.detail.sheet.tsx` | G20 |
| `price.history.chart.feature.gap.md` | `mobile/features/receipt/components/price.history.chart.tsx` | G20 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **28** | `_features/28-map/draft/price.sighting.schema.gap.md` |
| **28** | `_features/28-map/draft/post.price.sighting.handler.gap.md` |
| **25** | `_features/25-recipe-ingestion/draft/route.shared.content.helper.gap.md` |
| **31** | `_features/31-recall-alerts/draft/product.exposure.schema.gap.md` |
| **24** | Scanner vision extraction (unshipped) — `build-guide/07-scanner/05` |

## Naming conflict note

- Spec 29 private table: `price_alert`
- **33** build name: `personal_price_alert` (Brain SQLite)
- **28** shared: `alert_candidate` → push kind `price_alert` (**21**)

**Total in this folder:** 24 files (23 gap + this index).
