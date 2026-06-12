# Receipt Intelligence — Spec

Feature **33**. Grocery receipt capture, GPT-4o mini vision extraction, merchant normalization, line-item product matching, private spend summaries, personal price history, inflation detection, and cheaper-equivalent candidate surfacing — all stored in Brain DO SQLite. Matched prices optionally emit anonymized shared `price_sighting` rows for **28** and structured line-item signals for **34** / **31** exposure writers.

**Not in this feature:** Shared `price_sighting` table, `alert_candidate` generation, map nearby ranking (**28**); pantry snapshot, meal-plan generation, predictive interval model execution (**34** / spec 36); Bela escrow, card last-4 verification, store/door proof workflow, R2 dispute evidence (**42**); push delivery of price or weekly summary notifications (**21**); weekly food summary presentation (**35** ambient); banking/PDF transaction receipts (`backend/src/api/banking/` — legacy Schnl, unrelated); tax accounting; household multi-card reconciliation.

---

## Purpose

Someone shops for groceries → photographs the receipt (or shares a receipt image, or a Bela shopper scans at checkout). Brioela extracts merchant, date, totals, and line items; matches products when possible; preserves uncertain lines; writes private purchase history; aggregates healthy vs less-healthy spend; detects personal price inflation; and optionally contributes anonymized price observations to the shared map layer.

1. **Capture** receipt image from camera, share sheet (`receipt_import`), in-store co-pilot checkout, or Bela shopper scan (**42** reuses pipeline only).
2. **Extract** structured fields with GPT-4o mini vision — raw output stored separately from normalized rows.
3. **Normalize** merchant, currency, datetime, line labels, quantities, unit/total prices.
4. **Match** lines to canonical products (barcode/SKU → fuzzy → category → unresolved).
5. **Record** `receipt_ingested` `memory_event` and `purchase_price_event` rows per matched line.
6. **Summarize** weekly healthy / non-healthy / uncategorized spend on Brain alarm cycle.
7. **Detect** >15% increase or >10% decrease vs 90-day rolling average per product per store.
8. **Suggest** cheaper equivalents that pass full constraint profile — using **28** shared sightings for nearby prices.
9. **Display** receipt detail, per-product price history chart, and answer voice price questions from **private** history.

Without **33**, pantry predictions (**34**), illness detective food window (**32**), recall receipt exposure (**31**), map price sightings (**28**), Bela order reconciliation (**42**), in-store spend estimates (**45**), and inflation voice answers have no structured purchase stream.

---

## Product definition

| Term | Meaning |
|---|---|
| **Receipt intelligence** | Grocery/food retail receipt OCR + line-item structuring + private spend/price history. Not banking PDF receipts. |
| **Raw extraction** | Immutable GPT-4o mini vision JSON for a receipt image — kept for model-upgrade reprocessing. |
| **Normalized receipt** | Merchant, totals, currency, and line items after post-processing. |
| **Unresolved line** | A line item with no confident product match — never silently dropped. |
| **Personal price history** | `purchase_price_event` rows in Brain DO SQLite — per user, per product, per store, per date. |
| **Private price alert** | User-scoped inflation/decrease signal (`personal_price_alert` in build; spec 29 names `price_alert` — see conflicts). |
| **Shared price sighting** | Anonymized `price_sighting` in Supabase (**28**) — geography-linked, reporter internal only. |

**Design principle:** Receipt data is personal by default. Only explicitly anonymized, aggregated price observations cross into shared map tables. Voice answers about *my* spending read Brain SQLite, not Supabase aggregates.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/13-receipt-intelligence/`, `brioela-specs/06-receipt-spend-intelligence.md`, `brioela-specs/29-food-cost-inflation-tracker.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/24`, `25`, `28`, `34`, `42`, `05`.

| # | Component | Type | In **33**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Camera receipt capture** | Mobile UX | **Yes** | No | User taps scan receipt | `06-receipt-ui-and-voice.md` |
| 2 | **Share sheet `receipt_import`** | Entry route | **Yes** | No | **25** classifier routes here | `19-recipe-ingestion/08-shared-content-classifier.md` |
| 3 | **In-store co-pilot checkout handoff** | Entry route | **Yes** consumer | No | **45** ends session → receipt scan | `32-in-store-copilot/01-session-lifecycle.md` |
| 4 | **Bela store/door receipt scan** | Entry route | **42** owns workflow | No | Shopper scan reuses **33** vision | `11-bela/15-checkout-payment.md` |
| 5 | **`POST /api/receipts/ingest`** | Hono handler | **Yes** | No | Image upload + async job | `01-receipt-ingestion.md` |
| 6 | **`GET /api/receipts/:id`** | Hono handler | **Yes** | No | Receipt detail read | `01-receipt-ingestion.md` |
| 7 | **`GET /api/spend/summary`** | Hono handler | **Yes** | No | Weekly rollup read | spec 06 |
| 8 | **Receipt image → R2** | Object storage | **Yes** | No | Evidence retention | Bela pattern; optional for Core user receipts |
| 9 | **GPT-4o mini vision extraction** | AI + Zod | **Yes** | No | Reuses **24** `generateObject` pattern | `02-gpt4o-mini-vision-and-normalization.md`, `07-scanner/05` |
| 10 | **`receipt_raw_extraction` table** | Brain SQLite | **Yes** | No | Immutable model output | `00-overview.md` key decision |
| 11 | **`receipt` table** | Brain SQLite | **Yes** | No | Normalized header | spec 06 |
| 12 | **`receipt_line_item` table** | Brain SQLite | **Yes** | No | Lines + match metadata | spec 06, `03-line-item-product-matching.md` |
| 13 | **Merchant normalization** | Backend helper | **Yes** | No | Text cleanup + optional `map_place` link | `02-gpt4o-mini-vision-and-normalization.md` |
| 14 | **Line-item product matching** | Backend helper | **Yes** | No | Reuses **24** product resolution | `03-line-item-product-matching.md`, `07-scanner/02` |
| 15 | **`purchase_price_event` table** | Brain SQLite | **Yes** | No | Private price history | spec 29, `05-price-history-and-alerts.md` |
| 16 | **`spend_summary` table** | Brain SQLite | **Yes** | No | Weekly healthy spend buckets | spec 06, `04-spend-summaries.md` |
| 17 | **`personal_price_alert` table** | Brain SQLite | **Yes** | No | Private inflation/decrease rows | spec 29 (names `price_alert`) |
| 18 | **Weekly price/spend alarm pass** | Brain DO alarm | **Yes** | No | Batch compute — not per-scan | spec 29, `04`, `05` |
| 19 | **Price change detection** | Backend helper | **Yes** | No | >15% / >10% vs 90d avg | spec 29 |
| 20 | **Cheaper equivalent suggestion** | Backend helper | **Yes** | No | Constraint-safe + **28** price read | spec 29 |
| 21 | **`POST /api/map/price-sightings`** caller | **28** integration | **Yes** writer | No | Anonymized shared sighting | `10-map/05-price-alerts.md` |
| 22 | **Aggregate price trend (Supabase)** | Optional shared | **Partial** | No | Anonymized cross-user trends | `00-overview.md`, spec 29 |
| 23 | **`memory_event` `receipt_ingested`** | Brain append | **Yes** | Partial RPC | `appendMemoryEvent` path | **05**, `01-memory-event.md` |
| 24 | **`product_exposure` receipt_line** | **31** consumer | **Yes** producer | No | Matched recall exposure | **31** `product.exposure.schema.gap.md` |
| 25 | **Pantry line-item signal** | **34** boundary | **Yes** emit | No | Structured lines — **34** owns inventory | `14-pantry-meal-plan/01` |
| 26 | **Receipt detail UI** | Mobile | **Yes** | No | Merchant, lines, unresolved, health spend | `06-receipt-ui-and-voice.md` |
| 27 | **Price history chart UI** | Mobile | **Yes** | No | 30/60/90d, store color-coded | spec 29 |
| 28 | **Voice price queries** | **20** / Brain context | **Yes** consumer | No | Reads private `purchase_price_event` | spec 29, `06` |
| 29 | **Luma tier gate** | Entitlement | **Yes** | No | Receipt intelligence = Luma+ | `25-pricing-tiers/02` |
| 30 | **Scan inline price callout** | **24** consumer | **Cross** | No | On product scan, check personal history | spec 29 |
| 31 | **Banking transaction receipt PDF** | Legacy | **No** | **Yes** | Schnl banking — different domain | `backend/src/api/banking/` |

### Shipped in repo today (receipt-intelligence-related)

- `memory_event` table + `appendMemoryEvent` callable RPC (**04** / **05**) — `receipt_ingested` kind documented; no receipt writer calls it.
- `ExtractedTextSchema` + `extractText()` — Gemini medical document OCR (**22** path) — **not** grocery receipt GPT-4o mini pipeline.
- `mobile/features_to_build.ts` — legacy VoiceBudget receipt comments; not Brioela receipt intelligence.
- Banking receipt PDF handlers — **unrelated** grocery feature.
- **No** `backend/src/api/receipt/`.
- **No** Brain `receipt`, `receipt_line_item`, `purchase_price_event`, or `spend_summary` schemas.
- **No** receipt Zod validators in `shared/validator/`.
- **No** `mobile/features/receipt/`.
- **No** receipt-specific tests.

---

## Architecture — capture to price history

```text
Entry paths
  ├── Camera capture (33 primary)
  ├── Share sheet → receipt_import (25 routes)
  ├── In-store co-pilot checkout (45 handoff)
  └── Bela shopper store/door scan (42 — reuses vision, adds order/card proof)

        │
        ▼
POST /api/receipts/ingest
        │
        ├── store image (R2 optional)
        ├── create receipt row (pending)
        └── async: GPT-4o mini vision extract
                │
                ├── write receipt_raw_extraction (immutable)
                ├── normalize merchant / datetime / currency / lines
                ├── match products (24 resolution helpers)
                ├── write receipt_line_item rows (incl. unresolved)
                ├── write purchase_price_event per matched line
                ├── append memory_event receipt_ingested
                ├── enqueue product_exposure rows (31) for matched UPCs
                ├── emit pantry line signal (34 consumer)
                └── for high-confidence matches: POST price_sighting (28)

Weekly Brain alarm cycle (not per receipt)
        │
        ├── recompute spend_summary (healthy / non-healthy / uncategorized)
        ├── rolling 90d averages per product+store
        ├── insert personal_price_alert on threshold cross
        └── cheaper equivalent query (constraints + 28 shared prices)

User surfaces
        │
        ├── Receipt detail screen (lines, unresolved, health spend)
        ├── Price history chart per product
        └── Voice: "Has butter gotten more expensive?" → Brain private read
```

---

## Data model (Brain DO SQLite — private)

| Table | Role |
|---|---|
| `receipt` | Header: merchant, captured_at, subtotal, total, currency, place_id nullable, status |
| `receipt_raw_extraction` | Immutable vision JSON + model version + receipt_id FK |
| `receipt_line_item` | raw_label, normalized_label, qty, unit_price, matched_product_id, match_confidence, resolution |
| `purchase_price_event` | upc, product_name, price, store_name, store_location, purchase_date, receipt_id |
| `spend_summary` | user_id, week_start, healthy_spend, non_healthy_spend, uncategorized_spend |
| `personal_price_alert` | upc, alert_type increase/decrease, pct_change, baseline, current, suggestion_product_id |

**Shared (Supabase — not private history):**

| Table | Owner | **33** role |
|---|---|---|
| `price_sighting` | **28** | **33** writes anonymized observations after match |
| `aggregate_price_trend` (optional) | **28** / platform | Anonymized rollups for nearby cheaper-store query |

Never store personal receipt line items or user-attributed prices in Supabase.

---

## Matching logic

Order (from `03-line-item-product-matching.md`):

1. Exact barcode/SKU on line if present.
2. Known merchant SKU map if available.
3. Fuzzy label match against canonical product corpus (**24**).
4. Category-level match only.
5. Preserve as unresolved — never fabricate `matched_product_id`.

Health spend categorization uses matched product health score; unmatched lines → `uncategorized_spend`.

---

## API surface

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/receipts/ingest` | Upload image; start extraction job |
| `GET` | `/api/receipts/:id` | Receipt + lines + match status |
| `GET` | `/api/spend/summary` | Weekly spend rollup |
| `GET` | `/api/receipts/:id/price-history/:productId` | Per-product chart data (or nested in detail) |

Brain internal RPC (no public REST):

- `appendPurchasePriceEvents(receiptId)` — idempotent from line items.
- `runReceiptWeeklyAlarm()` — spend + price alert batch (**14** dispatches type).

---

## Detection thresholds (spec 29)

| Signal | Threshold | Min history |
|---|---|---|
| Significant increase | >15% above 90-day rolling average | 3 price points |
| Significant decrease | >10% below rolling average | 3 price points |
| Store attribution | Price change at Store A ≠ Store B | — |

Cheaper equivalent must pass: same category, similar nutrition, allergies, dislikes, dietary identity, medical rules (**07** / **23**).

---

## Voice queries (private Brain read)

Supported (spec 29 + `06-receipt-ui-and-voice.md`):

- "Has [product] gotten more expensive?"
- "Am I spending more on groceries this month?"
- "What's the cheapest place to buy [product] near me?" — **private history first**; nearby public prices from **28** shared sightings only when asking about community/nearby prices.

---

## Tier gates

From `25-pricing-tiers/02-tier-entitlements.md`:

| Tier | Receipt access |
|---|---|
| **Sapor** | Upgrade moment — receipt intelligence gated |
| **Luma** | Receipt scan unlimited; price history view; weekly summary inputs |
| **Culina+** | No additional receipt caps documented |

---

## 33 vs neighbor boundaries

| In **33** (this feature) | In separate feature |
|---|---|
| Receipt capture + vision + normalization | Product scan verdict UI — **24** |
| Private `purchase_price_event` + `spend_summary` | Shared `price_sighting` schema — **28** |
| Personal price alert rows (Brain) | `alert_candidate` + push `price_alert` — **28** + **21** |
| Line-item → product match | Pantry snapshot / meal plan — **34** |
| `receipt_ingested` memory_event | `log_memory_event` tool definition — **05** |
| Cheaper equivalent **candidate** (constraint-safe) | Map nearby ranking + place detail — **28** |
| Share-sheet route target | Classifier + workflow — **25** |
| Vision extraction pipeline | Bela escrow, card verify, door proof — **42** |
| Weekly spend **computation** | Weekly summary **presentation** + push — **35** / **21** |
| Predictive pantry **input data** | Interval model execution — **34** / spec 36 |
| Recall exposure from receipt lines | Recall feed + match batch — **31** |
| Illness window food events | Sift ranking — **32** |

### Critical boundary: private price history ≠ shared price sightings

| | **33-receipt-intelligence** | **28-map** |
|---|---|---|
| **Storage** | Brain DO SQLite | Supabase Postgres |
| **Data** | Full receipt, line items, user-attributed prices | Anonymized `price_sighting` + geo `place_id` |
| **Alerts** | `personal_price_alert` (user-scoped) | `alert_candidate` → push `price_alert` (geo-scoped) |
| **Voice** | "My butter price history" | "Nearby stores with lower price" (shared) |
| **Write trigger** | Every matched receipt line → private event; optional anonymized sighting | `POST /api/map/price-sightings` + evaluate job |

### Critical boundary: receipt lines ≠ pantry inventory

| | **33** | **34** |
|---|---|---|
| **What** | Structured purchase facts + price events | Pantry state, meal plan, shopping list |
| **Output** | Line items with match confidence | Consumes purchase signals; owns `pantry_snapshot` |
| **Rule** | **33** does not maintain cupboard quantities | **34** runs predictive intervals (spec 36) |

### Critical boundary: Bela receipt scan ≠ user receipt intelligence

| | **33** | **42** |
|---|---|---|
| **What** | User's own grocery receipt intelligence | Shopper proof + order reconciliation |
| **Shared** | GPT-4o mini vision + line extraction helpers | — |
| **Bela-only** | — | Card last-4, R2 dispute image, order state machine, door scan |

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/013-receipt-intelligence-complete.md` | Build-guide docs only — zero grocery receipt production |
| `brioela-specs/29-food-cost-inflation-tracker.md` | Names private table `price_alert` — **28** uses `alert_candidate` for shared geo alerts; **33** build uses `personal_price_alert` |
| `mobile/features_to_build.ts` | Legacy VoiceBudget finance app notes — not Brioela spec |
| `backend/src/api/banking/*receipt*` | Banking PDF receipts — name collision only |
| `extractText()` Gemini path | Medical document OCR — not receipt GPT-4o mini pipeline |
| spec 36 predictive pantry | Interval **execution** lives in **34** alarm; **33** supplies purchase events |
| `brioela-specs/16-weekly-food-summary.md` | Presentation owned by ambient/**35**; **33** supplies spend inputs |

---

## Success metrics

From spec 06 + spec 29:

- Receipt parsing completion rate
- Line-item match rate
- Weekly spend summary open rate
- Price alert trigger rate per user per month
- Cheaper equivalent suggestion acceptance rate
- Voice query rate for price-related questions
- Correlation between inflation alerts and store switching (via **28** place visits)

---

## Sources

- `build-guide/13-receipt-intelligence/` (00–06)
- `brioela-specs/06-receipt-spend-intelligence.md`
- `brioela-specs/29-food-cost-inflation-tracker.md`
- `build-guide/07-scanner/02-product-resolution.md`, `05-gpt4o-mini-vision-fallback.md`
- `build-guide/10-map/04-product-sightings.md`, `05-price-alerts.md`
- `build-guide/14-pantry-meal-plan/00-overview.md`, `04-shopping-list-and-cost.md`
- `build-guide/11-bela/15-checkout-payment.md`
- `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`
- `build-guide/32-in-store-copilot/01-session-lifecycle.md`, `04-spend-estimate.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/bela/15-checkout-payment.md`
- `_records/connections/09-receipt-intelligence-connections.md`
- `_records/build-order/11-layer-receipt-intelligence.md`
- `_features/05-brain-memory-tools/spec.md`
- `_features/24-scanner/status.md`
- `_features/25-recipe-ingestion/spec.md`
- `_features/28-map/spec.md`
- `_features/34-pantry-meal-plan/status.md`
- `_features/42-bela/status.md`
