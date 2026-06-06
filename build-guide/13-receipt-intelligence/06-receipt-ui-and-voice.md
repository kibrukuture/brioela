# Receipt Intelligence — UI And Voice Queries

## What This File Covers

Receipt detail screen, price history view, and voice query support.

## Source Specs

- `brioela-specs/06-receipt-spend-intelligence.md`
- `brioela-specs/29-food-cost-inflation-tracker.md`

## Receipt Detail

Show:

- merchant
- date
- total
- line items
- matched products
- unresolved lines
- health spend summary

## Price History View

Per product:

- product name/photo
- price chart
- store-color-coded price points
- 30/60/90-day average
- highest/lowest
- current vs baseline

## Voice Queries

Supported questions:

- “Has butter gotten more expensive?”
- “Am I spending more on groceries this month?”
- “What's the cheapest place to buy this near me?”

## Rule

Voice answers must read from private Orchestrator price history, not shared aggregate data, unless asking about nearby public prices.
