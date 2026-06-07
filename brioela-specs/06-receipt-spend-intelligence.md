# 06. Receipt Spend Intelligence

## Goal
Turn grocery receipts into structured spend data that connects cost, food quality, and personal health preferences.

## User Outcome
- Capture a receipt image.
- Brioela extracts store, line items, totals, and timing.
- Spend is summarized by healthy vs less healthy, recurring items, and cheaper alternatives.

## In Scope
- Receipt image extraction with GPT-4o mini.
- Merchant normalization.
- Item matching to canonical products when possible.
- Weekly and category spend aggregation.

## Out of Scope
- Tax accounting.
- Household multi-card reconciliation.

## Data Model
- `receipt`: receipt_id, user_id, merchant_name, captured_at, subtotal, total, currency.
- `receipt_line_item`: receipt_id, raw_label, normalized_label, quantity, unit_price, matched_product_id.
- `spend_summary`: user_id, week_start, healthy_spend, non_healthy_spend, uncategorized_spend.

## Matching Logic
- Attempt exact barcode or known SKU match when available.
- Fall back to fuzzy text matching against known products.
- Preserve uncertain lines for later reprocessing.

## API Surface
- `POST /api/receipts/ingest`
- `GET /api/receipts/:id`
- `GET /api/spend/summary`

## Technical Notes
- Raw GPT-4o mini extraction results should be stored separately from normalized results to allow model upgrades later.
- Budget-aware recommendations should read from this feature but not be implemented here.

## Success Metrics
- Receipt parsing completion rate.
- Line-item match rate.
- Weekly spend summary open rate.
