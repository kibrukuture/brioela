# In-Store Co-Pilot — Running Spend Estimate

## What This File Covers

The running total and its honesty rules.

## Source Specs

- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/29-food-cost-inflation-tracker.md`

## Price Resolution Order (per scanned item)

1. the user's own price history at this store (`purchase_price_event`)
2. most recent community price signal for this store (price sightings)
3. unpriced — excluded from the total, counted as an item

## Framing

- Always an estimate, always said as one: "you're at about $52."
- Baseline comparison uses the user's own weekly average from receipt history — never a generic budget.
- Mentioned proactively exactly once per visit (on baseline crossing); available on request anytime.

## Ground Truth

The receipt scan at checkout closes the loop:

- actual totals retrain per-item price expectations
- estimate accuracy (estimate vs. receipt) is a tracked metric and the calibration input

## Rule

Never present the estimate with false precision. "About" is part of the contract.
