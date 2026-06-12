# Receipt Intelligence — Build

Feature **33**. Production paths under `backend/src/api/receipt/` (handlers, helpers, routes), `backend/src/agents/brain/_schemas/receipt.*.ts` + `purchase.price.*.ts` + `spend.summary.schema.ts`, `backend/src/agents/brain/_handlers/receipt/`, `shared/validator/receipt/`, `shared/routes/receipt.routes.ts`, `mobile/features/receipt/`, and `mobile/network/receipt/`. Vision extraction reuses `generateObject` + GPT-4o mini pattern from **24** scanner docs — separate receipt Zod schema.

**Scope:** Receipt ingest API, raw extraction persistence, normalization, line-item matching, private price events, spend summaries, personal price alerts, weekly Brain alarm batch, memory_event writes, optional `price_sighting` emit to **28**, mobile capture + detail + price history UI, Luma entitlement gate. **Not in 33 build:** `price_sighting` Drizzle schema (**28**), `alert_candidate` evaluate (**28**), push send (**21**), pantry snapshot (**34**), Bela order state machine (**42**), share classifier (**25**), product scanner (**24**), banking PDF receipts.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/13-receipt-intelligence/` (7 files) | ✓ docs only |
| `brioela-specs/06-receipt-spend-intelligence.md` | ✓ spec |
| `brioela-specs/29-food-cost-inflation-tracker.md` | ✓ spec |
| `memory_event` + `appendMemoryEvent` RPC (**05**) | ✓ table + RPC; no receipt caller |
| Banking transaction receipt PDF | ✓ **unrelated** Schnl legacy |
| `extractText()` Gemini helper | ✓ medical OCR — not grocery receipts |
| Receipt ingest API | ✗ |
| Brain receipt / price tables | ✗ |
| GPT-4o mini receipt vision pipeline | ✗ |
| Line-item product matching | ✗ |
| Spend summary + price alarm batch | ✗ |
| `price_sighting` writer hook | ✗ |
| Mobile `features/receipt/` | ✗ |
| Receipt tests | ✗ |

**Zero grocery receipt intelligence production code.** `rg 'receipts/ingest|purchase_price_event|receipt_line_item' backend/src shared/ mobile/` — no matches (banking receipt paths excluded).

---

## File manifest

### Shared validator + routes (**33**)

| File | Role |
|---|---|
| `shared/validator/receipt/receipt.schema.ts` | `ReceiptSchema`, `ReceiptLineItemSchema`, `ReceiptIngestRequestSchema`, `ReceiptDetailResponseSchema` |
| `shared/validator/receipt/receipt.vision.schema.ts` | GPT-4o mini structured extraction output |
| `shared/validator/receipt/spend.summary.schema.ts` | `SpendSummarySchema`, weekly query |
| `shared/validator/receipt/purchase.price.event.schema.ts` | Price history row + chart query shapes |
| `shared/validator/receipt/personal.price.alert.schema.ts` | Private alert row (not map `alert_candidate`) |
| `shared/routes/receipt.routes.ts` | `RECEIPT_ROUTES`, `INGEST`, `GET_BY_ID`, `SPEND_SUMMARY` |

### Brain SQLite schemas (**33**)

| File | Role |
|---|---|
| `_schemas/receipt.schema.ts` | `receipt` header table |
| `_schemas/receipt.raw.extraction.schema.ts` | Immutable vision JSON |
| `_schemas/receipt.line.item.schema.ts` | Line items + match fields |
| `_schemas/purchase.price.event.schema.ts` | Private price history |
| `_schemas/spend.summary.schema.ts` | Weekly healthy spend buckets |
| `_schemas/personal.price.alert.schema.ts` | User-scoped inflation alerts |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add receipt tables to Brain chain |

### Backend API — receipt module (**33**)

| File | Role |
|---|---|
| `backend/src/api/receipt/receipt.route.ts` | Hono mount at `/api/receipts` |
| `backend/src/api/receipt/receipt.controller.ts` | Controller wiring |
| `backend/src/api/receipt/_handlers/post.ingest.handler.ts` | `POST /api/receipts/ingest` |
| `backend/src/api/receipt/_handlers/get.receipt.handler.ts` | `GET /api/receipts/:id` |
| `backend/src/api/receipt/_handlers/get.spend.summary.handler.ts` | `GET /api/spend/summary` |
| `backend/src/api/receipt/_handlers/get.product.price.history.handler.ts` | Per-product chart data |
| `backend/src/api/receipt/_handlers/index.ts` | Barrel |
| `backend/src/api/receipt/_helpers/upload.receipt.image.helper.ts` | R2 upload (optional) |
| `backend/src/api/receipt/_helpers/enqueue.receipt.process.job.helper.ts` | QStash / Workflow trigger |
| `backend/src/api/receipt/_helpers/index.ts` | Barrel |
| `backend/src/api/receipt/index.ts` | Module export |

Register in backend app router (**01**). Mount spend summary at `/api/spend` or sub-route per spec 06.

### Receipt processing pipeline (**33**)

| File | Role |
|---|---|
| `_handlers/receipt/vision.extract.receipt.handler.ts` | GPT-4o mini `generateObject` + `ReceiptVisionSchema` |
| `_handlers/receipt/normalize.receipt.helper.ts` | Merchant, currency, datetime, line labels |
| `_handlers/receipt/match.receipt.line.items.helper.ts` | Product resolution — calls **24** helpers |
| `_handlers/receipt/write.receipt.rows.handler.ts` | Insert receipt + lines + raw extraction |
| `_handlers/receipt/write.purchase.price.events.helper.ts` | `purchase_price_event` per matched line |
| `_handlers/receipt/log.receipt.memory.event.helper.ts` | `appendMemoryEvent` `receipt_ingested` |
| `_handlers/receipt/write.product.exposure.from.receipt.helper.ts` | **31** `product_exposure` enqueue |
| `_handlers/receipt/emit.pantry.purchase.signal.helper.ts` | Structured signal for **34** (no inventory write) |
| `_handlers/receipt/write.price.sighting.from.receipt.helper.ts` | Anonymized **28** `POST` internal call |
| `_handlers/receipt/link.merchant.to.place.helper.ts` | High-confidence `map_place` FK |
| `_handlers/receipt/index.ts` | Barrel |

### Weekly alarm batch (**33** body; **14** dispatches)

| File | Role |
|---|---|
| `_handlers/receipt/compute.spend.summary.helper.ts` | Roll healthy / non-healthy / uncategorized |
| `_handlers/receipt/detect.personal.price.change.helper.ts` | 90d rolling avg thresholds |
| `_handlers/receipt/suggest.cheaper.equivalent.helper.ts` | Constraint check + **28** price read |
| `_handlers/receipt/run.receipt.weekly.alarm.handler.ts` | Orchestrates batch on alarm type |
| `_handlers/receipt/index.ts` | Barrel |

Wire `receipt_weekly` (or reuse maintenance alarm slot) in **14** `dispatch.alarm.handler.ts`.

### Repositories (**33**)

| File | Role |
|---|---|
| `_repositories/read.receipt.repository.ts` | Receipt + lines by id |
| `_repositories/write.receipt.repository.ts` | Header + lines + raw |
| `_repositories/read.purchase.price.history.repository.ts` | Chart + rolling avg queries |
| `_repositories/write.purchase.price.event.repository.ts` | Idempotent inserts |
| `_repositories/read.spend.summary.repository.ts` | Weekly rollup read |
| `_repositories/write.spend.summary.repository.ts` | Alarm batch upsert |
| `_repositories/read.personal.price.alert.repository.ts` | Open alerts for UI |
| `_repositories/write.personal.price.alert.repository.ts` | Threshold inserts |

### Entitlement (**33**)

| File | Role |
|---|---|
| `_helpers/check.receipt.entitlement.helper.ts` | Luma gate — calls **43** pattern |

### Mobile (**33**)

| File | Role |
|---|---|
| `mobile/features/receipt/components/receipt.capture.feature.tsx` | Camera capture + upload |
| `mobile/features/receipt/components/receipt.detail.sheet.tsx` | Merchant, lines, unresolved, health spend |
| `mobile/features/receipt/components/price.history.chart.tsx` | 30/60/90d chart, store colors |
| `mobile/features/receipt/components/unresolved.lines.card.tsx` | Reprocess CTA |
| `mobile/features/receipt/hooks/use.receipt.ingest.hook.ts` | Ingest + poll status |
| `mobile/features/receipt/hooks/use.receipt.detail.hook.ts` | Detail fetch |
| `mobile/features/receipt/hooks/use.price.history.hook.ts` | Per-product history |
| `mobile/network/receipt/post-ingest.api.ts` | `POST /api/receipts/ingest` |
| `mobile/network/receipt/get-receipt.api.ts` | `GET /api/receipts/:id` |
| `mobile/network/receipt/get-spend-summary.api.ts` | `GET /api/spend/summary` |

Scanner / share integration (**not owned by 33**):

| File | Owner | Role |
|---|---|---|
| `mobile/features/scanner/components/scan-receipt-entry.tsx` | **24** or **33** | Entry chip from scanner shell |
| `backend/.../route.shared.content.helper.ts` | **25** | `receipt_import` enqueue |

### Tests (**33**)

| File | Role |
|---|---|
| `backend/src/api/receipt/receipt.ingest.test.ts` | Ingest + validation |
| `backend/src/agents/brain/_handlers/receipt/match.receipt.line.items.test.ts` | Match order + unresolved |
| `backend/src/agents/brain/_handlers/receipt/detect.personal.price.change.test.ts` | Threshold math |
| `backend/src/agents/brain/_handlers/receipt/normalize.receipt.test.ts` | Merchant normalization |

---

## Acceptance criteria

### Ingest + extraction

- [ ] `POST /api/receipts/ingest` accepts image; returns `receipt_id` + `status: processing`.
- [ ] Raw GPT-4o mini JSON stored in `receipt_raw_extraction` — never overwritten on reprocess.
- [ ] Schema validation failure leaves receipt `unresolved` — retriable.
- [ ] Uncertain lines persisted with `match_confidence` below threshold — not dropped.

### Matching + writes

- [ ] Match order: barcode/SKU → merchant SKU → fuzzy → category → unresolved.
- [ ] No fabricated `matched_product_id` on low confidence.
- [ ] Each matched line writes `purchase_price_event` with store attribution.
- [ ] `memory_event` `receipt_ingested` appended via `appendMemoryEvent` — not LLM tool.
- [ ] High-confidence merchant links optional `map_place.place_id`.

### Private vs shared price boundary

- [ ] Personal price history queries hit Brain SQLite only.
- [ ] `price_sighting` writes strip user attribution; require **28** `place_id`.
- [ ] No receipt line items or user-id prices in Supabase.
- [ ] `personal_price_alert` rows stay in Brain — distinct from **28** `alert_candidate`.

### Weekly alarm

- [ ] Spend summary runs on alarm cycle — not on every receipt view.
- [ ] Price rolling averages batch-computed weekly.
- [ ] <3 price points → "not enough history" — no alert.
- [ ] >15% increase / >10% decrease thresholds per spec 29.
- [ ] Cheaper equivalent blocked when constraint profile fails.

### API + mobile

- [ ] `GET /api/receipts/:id` returns lines, match status, unresolved count, health spend slice.
- [ ] `GET /api/spend/summary` returns current week buckets.
- [ ] Price history chart: store color-coded points, 30/60/90d averages.
- [ ] Luma entitlement enforced on ingest + price history view.
- [ ] Voice context injection reads `purchase_price_event` at session start (**15** / **20** consumer).

### Cross-feature hooks

- [ ] **25** `receipt_import` route enqueues same pipeline as camera ingest.
- [ ] **31** matched lines enqueue `product_exposure` with `source=receipt_line`.
- [ ] **34** receives structured purchase signal — does not write pantry tables from **33**.
- [ ] **42** Bela scan calls shared vision helper — Bela owns card verify + order linkage.
- [ ] **24** scan result can read personal price delta inline (spec 29) when **33** history exists.

### Tests

- [ ] Ingest happy path + validation failure.
- [ ] Match order + unresolved preservation.
- [ ] Price threshold detection edge cases (2 vs 3 points).
- [ ] Entitlement gate returns 403 for Sapor tier.

---

## Build order dependencies

1. **04-brain-foundation** — Drizzle migrations for new Brain tables.
2. **24-scanner** — product corpus + resolution helpers (can stub corpus for MVP).
3. **05-brain-memory-tools** — `appendMemoryEvent` for `receipt_ingested`.
4. **28-map** — `map_place` + `price_sighting` before shared sighting writer ships.
5. **07-brain-constraint-tools** — cheaper equivalent constraint check.
6. **43-pricing-tiers** — Luma gate.

**Blocks:** **34-pantry-meal-plan**, **32-illness-detective** (food history density), **31-recall-alerts** (receipt exposure), **42-bela** (checkout proof data), **45-in-store-copilot** (checkout close-out), **35-ambient-intelligence** (spend patterns).

---

## Draft count

**24** files in `draft/` — 23 gap/intended snapshots + `gap-index.md`.
