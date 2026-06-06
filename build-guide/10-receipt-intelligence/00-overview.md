# Receipt Intelligence — Overview

## What This Folder Covers
Receipt OCR and parsing, merchant normalization, line-item matching to canonical products, spend categorization (healthy vs non-healthy), weekly spend aggregation, personal price history, inflation tracking with cheaper equivalent suggestions, and the price history view. Receipts are also the primary data source for the predictive pantry and meal plan features.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/06-receipt-spend-intelligence.md` — receipt OCR, line-item matching, spend categorization
- `brioela-specs/29-food-cost-inflation-tracker.md` — personal price history, >15% change alert, cheaper equivalent suggestion, voice query for price data

## Key Decisions From Specs
- OCR results stored separately from normalized results — allows model upgrades without data loss
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
- `05-scanner` — receipt scanner uses same OCR pipeline as product scanner
- `03-foundation` — Supabase for shared anonymized price trend data

## What Depends On This Folder
- `11-pantry-meal-plan` — receipt history drives pantry state and shopping list cost estimates
- `15-ambient-intelligence` — behavioral patterns use receipt data to detect dietary drift and spend habits
- `09-bela` — Bela receipt scan at store and door uses this OCR pipeline
