# Session 001 — Initial Setup

## Date
2026-06-05

## Completed this session
- Designed the full `_records/` + `build-guide/` folder system
- Created all folder structure (both `_records/` and `build-guide/` skeletons)
- Wrote `00-how-to-use.md` in all four `_records/` subfolders
- Updated Bela payment architecture across 4 spec files:
  - `implementable-specs/bela/05-escrow-payment.md` — full rewrite (manual capture model, no wallet)
  - `implementable-specs/bela/15-checkout-payment.md` — full rewrite (dedicated Bela card, receipt scan)
  - `implementable-specs/bela/02-shopper-platform.md` — added Step 5: dedicated Bela card registration
  - `implementable-specs/bela/00-overview.md` — updated intro, order flow, stack table

## In progress
Nothing left half-done this session.

## What is next
1. Full inventory pass — read every spec file in:
   - `brioela-specs/` (40 files)
   - `implementable-specs/cooking-session/`
   - `implementable-specs/bela/`
   - any other spec locations
2. Fill `_records/inventory/01-brioela-specs.md` through `04-other-specs.md` with real entries
3. Fill `_records/build-order/` layer files from what the inventory reveals
4. Fill `_records/connections/` files as build-guide files are written
5. Begin `build-guide/01-design-system/` — requires web research on:
   - Generative UI in React Native
   - Font families available at this quality level
   - Color system for food app at art-studio quality
   - Motion/animation libraries in React Native

## Decisions made this session
- Bela payment model: shopper uses own dedicated debit card (Bela card), not Stripe Issuing
- `_records/` lives at root level (not inside build-guide)
- Each record type is its own folder with numbered files (not a single flat file)
- `session-log/` recovery = always read the last numbered file
- `build-guide/` subfolders are provisional — real structure derived from full inventory pass

## Blockers
None. Inventory pass is the next required step before any build-guide content is written.
