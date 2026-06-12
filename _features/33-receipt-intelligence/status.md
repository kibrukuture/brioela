# Status

open

**Receipt intelligence not shipped.** Build-guide **13-receipt-intelligence** is complete (docs only). Zero grocery receipt API, zero Brain receipt/price tables, zero GPT-4o mini receipt vision pipeline, zero line-item matching, zero mobile receipt UI. Partial: `memory_event` + `appendMemoryEvent` RPC (**05**) documents `receipt_ingested` — no writer. Banking PDF transaction receipts exist — **unrelated** legacy Schnl path.

# Shipped in backend (partial / unrelated)

- [x] `memory_event` table + `appendMemoryEvent` callable RPC (**05**) — no receipt pipeline caller
- [x] `extractText()` Gemini helper — medical document OCR, not grocery receipts
- [x] Banking transaction receipt PDF (`backend/src/api/banking/handlers/transactions/*receipt*`) — **not feature 33**
- [ ] `backend/src/api/receipt/` module
- [ ] Brain `receipt` / `receipt_raw_extraction` / `receipt_line_item` tables
- [ ] Brain `purchase_price_event` / `spend_summary` / `personal_price_alert` tables
- [ ] Receipt Zod validators (`shared/validator/receipt/`)
- [ ] `POST /api/receipts/ingest`
- [ ] `GET /api/receipts/:id`
- [ ] `GET /api/spend/summary`
- [ ] GPT-4o mini receipt vision extraction
- [ ] Raw extraction immutability + reprocess path
- [ ] Line-item product matching (**24** resolution reuse)
- [ ] Merchant → `map_place` linking
- [ ] `purchase_price_event` writer
- [ ] `receipt_ingested` memory_event writer
- [ ] Weekly spend summary alarm batch
- [ ] Personal price change detection (>15% / >10%)
- [ ] Cheaper equivalent suggestion (constraint-safe)
- [ ] Anonymized `price_sighting` emit (**28**)
- [ ] `product_exposure` receipt_line writer (**31**)
- [ ] Pantry purchase signal emit (**34** boundary)
- [ ] Mobile `features/receipt/` capture + detail + price history
- [ ] Luma receipt entitlement gate (**43**)
- [ ] Share sheet `receipt_import` wiring (**25**)
- [ ] Bela vision reuse hook (**42**)
- [ ] In-store co-pilot checkout handoff (**45**)
- [ ] Receipt tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `backend/src/api/receipt/` | `rg receipts/ingest backend` — zero |
| G2 | No Brain receipt schemas | `rg receipt_line_item shared/drizzle backend/src/agents` — zero |
| G3 | No `purchase_price_event` table | spec 29 — not in Brain migrations |
| G4 | No `spend_summary` table | spec 06 — not implemented |
| G5 | No `personal_price_alert` table | spec 29 `price_alert` naming — not in repo |
| G6 | No receipt Zod validators | `rg receipt.schema shared/validator` — zero |
| G7 | No GPT-4o mini receipt vision handler | `07-scanner/05` pattern — scanner path also unshipped |
| G8 | No raw extraction immutability layer | `00-overview.md` key decision — no table |
| G9 | No line-item product matching | `03-line-item-product-matching.md` — not built |
| G10 | No `POST /api/receipts/ingest` | spec 06 API — zero |
| G11 | No `GET /api/receipts/:id` | spec 06 — zero |
| G12 | No `GET /api/spend/summary` | spec 06 — zero |
| G13 | No `receipt_ingested` writer | **05** RPC exists — no caller |
| G14 | No weekly price/spend alarm batch | spec 29 — alarm cycle not wired |
| G15 | No personal price threshold helper | >15% / >10% — not implemented |
| G16 | No cheaper equivalent helper | spec 29 — not implemented |
| G17 | No `price_sighting` writer from receipts | **28** G12 — **33** producer unwired |
| G18 | No `product_exposure` receipt_line writer | **31** G13 |
| G19 | No mobile `features/receipt/` | `rg receipt.capture mobile/features` — zero |
| G20 | No price history chart UI | `06-receipt-ui-and-voice.md` — not built |
| G21 | No Luma entitlement gate for receipts | `25-pricing-tiers/02` — not built |
| G22 | Share `receipt_import` unwired | **25** G* — classifier unshipped |
| G23 | Bela receipt scan unwired | **42** — reuses unshipped **33** pipeline |
| G24 | Pantry signal emit unwired | **34** blocked on **33** |
| G25 | Illness detective sparse food history | **32** — receipt events missing |
| G26 | In-store co-pilot checkout close-out unwired | **45** — depends on **33** |
| G27 | `price_alert` vs `personal_price_alert` naming conflict | spec 29 vs **28** `alert_candidate` |
| G28 | Banking receipt name collision | `banking/*receipt*` — unrelated Schnl PDF |
| G29 | `extractText()` not receipt pipeline | Gemini medical OCR — different model/use case |
| G30 | Session log 013 "complete" misleading | Build-guide docs only |
| G31 | No receipt tests | No `receipt*.test.ts` |
| G32 | `mobile/features_to_build.ts` legacy noise | VoiceBudget finance comments — not Brioela spec |

# 33 vs neighbor boundaries

| In **33** (this feature) | In separate feature |
|---|---|
| Receipt capture + GPT-4o mini extraction | Product scan verdict — **24** |
| Private `purchase_price_event` + spend summaries | Shared `price_sighting` + `alert_candidate` — **28** |
| `personal_price_alert` (Brain) | Push `price_alert` delivery — **21** |
| Line items + match confidence | Pantry inventory + meal plan — **34** |
| `receipt_ingested` memory_event | `log_memory_event` tool — **05** |
| Vision + normalization helpers (shared) | Bela card verify + escrow — **42** |
| Spend computation | Weekly summary presentation — **35** |
| Purchase event stream | Predictive interval execution — **34** / spec 36 |
| Receipt exposure enqueue | Recall feed + batch match — **31** |
| Share route target | Classifier + workflow — **25** |

# Critical boundary: private price history ≠ shared price sightings

| | **33-receipt-intelligence** | **28-map** |
|---|---|---|
| **Storage** | Brain DO SQLite | Supabase Postgres |
| **Tables** | `purchase_price_event`, `personal_price_alert` | `price_sighting`, `alert_candidate` |
| **PII** | Full receipt + user-attributed prices | Reporter ID internal only; anonymized on map |
| **Alerts** | Personal inflation/decrease | Geo-scoped opportunity candidates |
| **Voice** | "My price history" | "Nearby cheaper" (shared sightings) |

# Blocked by

- 01-platform-foundation (API router, R2, QStash/Workflow)
- 04-brain-foundation (Brain SQLite migrations)
- 05-brain-memory-tools (`appendMemoryEvent` caller pattern)
- 24-scanner (product corpus + resolution — unshipped)
- 07-brain-constraint-tools (cheaper equivalent checks)
- 28-map (`map_place` + `price_sighting` for shared emit — unshipped)
- 43-pricing-tiers (Luma gate — unshipped)

# Blocks

- 34-pantry-meal-plan (purchase history + price estimates)
- 32-illness-detective (receipt food-history density)
- 31-recall-alerts (`product_exposure` receipt_line source)
- 42-bela (store/door receipt vision reuse)
- 45-in-store-copilot (checkout close-out + spend estimate ground truth)
- 35-ambient-intelligence (dietary drift + spend patterns)
- 28-map (receipt → `price_sighting` input path)
- 37-negative-space-nutrition (receipt coverage backbone)
- 38-negative-space-nutrition build-guide (coverage gate)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/013-receipt-intelligence-complete.md` | Docs-only completion |
| `brioela-specs/29-food-cost-inflation-tracker.md` | Private `price_alert` name vs **28** `alert_candidate` |
| `backend/src/api/banking/*receipt*` | Banking PDF — not grocery intelligence |
| `mobile/features_to_build.ts` | Legacy VoiceBudget ideas |
| `extractText()` in `backend/src/core/ai/functions/extract-text.ts` | Medical Gemini OCR — not receipt GPT-4o mini |
| No implementation ledger for receipt tables | Build from build-guide 13 + Brain migration runtime |

# Draft count

**24** files in `draft/` — 23 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/13-receipt-intelligence/` (00–06)
- `brioela-specs/06-receipt-spend-intelligence.md`
- `brioela-specs/29-food-cost-inflation-tracker.md`
- `build-guide/07-scanner/02-product-resolution.md`, `05-gpt4o-mini-vision-fallback.md`
- `build-guide/10-map/05-price-alerts.md`
- `build-guide/14-pantry-meal-plan/00-overview.md`
- `build-guide/11-bela/15-checkout-payment.md`
- `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`
- `build-guide/32-in-store-copilot/01-session-lifecycle.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/bela/15-checkout-payment.md`
- `_records/connections/09-receipt-intelligence-connections.md`
- `_records/build-order/11-layer-receipt-intelligence.md`
- `_records/session-log/013-receipt-intelligence-complete.md`
- `_features/05-brain-memory-tools/spec.md`
- `_features/24-scanner/status.md`
- `_features/25-recipe-ingestion/spec.md`
- `_features/28-map/spec.md`
- `_features/34-pantry-meal-plan/status.md`
- `_features/42-bela/status.md`
