# Receipt Intelligence — Overview

## What This Folder Covers
Receipt image extraction with GPT-4o mini, merchant normalization, line-item matching to canonical products, spend categorization (healthy vs non-healthy), weekly spend aggregation, personal price history, inflation tracking with cheaper equivalent suggestions, and the price history view. Receipts are also the primary data source for the predictive pantry and meal plan features.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-receipt-ingestion.md` | capture/upload, receipt record, raw vision extraction storage |
| `02-gpt4o-mini-vision-and-normalization.md` | GPT-4o mini extraction, merchant normalization, uncertain line preservation |
| `03-line-item-product-matching.md` | exact/SKU/barcode/fuzzy matching to products |
| `04-spend-summaries.md` | weekly/category healthy spend aggregation |
| `05-price-history-and-alerts.md` | private price history, inflation detection, cheaper equivalent candidates |
| `06-receipt-ui-and-voice.md` | receipt detail, price history view, voice query behavior |

## Specs This Folder Draws From
- `brioela-specs/06-receipt-spend-intelligence.md` — receipt image extraction, line-item matching, spend categorization
- `brioela-specs/29-food-cost-inflation-tracker.md` — personal price history, >15% change alert, cheaper equivalent suggestion, voice query for price data

## Key Decisions From Specs
- Raw GPT-4o mini extraction results stored separately from normalized results — allows model upgrades without data loss
- Fuzzy text matching for line-item to product matching when no barcode/SKU
- Uncertain lines preserved for later reprocessing (never silently dropped)
- Price history stored in Orchestrator DO SQLite (private) — not Supabase
- Anonymized aggregate price trend stored in Supabase for cross-user "nearby store is cheaper" queries
- Price computation: weekly DO alarm cycle, not on every receipt scan
- >15% increase vs 90-day rolling average = significant increase alert
- >10% decrease = positive "good time to stock up" signal
- Cheaper equivalent must clear user's full constraint profile before being suggested

## What This Folder Depends On
- `05-orchestrator` — price history and spend data stored in Orchestrator DO SQLite
- `07-scanner` — receipt scanner uses same GPT-4o mini vision extraction pattern as product scanner
- `03-foundation` — Supabase for shared anonymized price trend data

## What Depends On This Folder
- `14-pantry-meal-plan` — receipt history drives pantry state and shopping list cost estimates
- `18-ambient-intelligence` — behavioral patterns use receipt data to detect dietary drift and spend habits
- `11-bela` — Bela receipt scan at store and door uses this GPT-4o mini vision extraction pipeline

## Boundary

This feature owns personal receipt/spend/price history. Map owns shared `price_sighting` and alert candidate geography. Bela owns checkout proof workflow.
