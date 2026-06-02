# 29. Food Cost Inflation Tracker

## Goal

Show the user exactly how much more (or less) specific products cost compared to when they last bought them, using their own receipt history as the price baseline — and surface a cheaper equivalent nearby when the price increase is significant.

## Why This Exists

Grocery inflation is one of the most visceral financial frustrations in most markets right now. People feel it but cannot measure it. They suspect they're paying more but have no proof and no alternative.

Brioela has proof. Every receipt scan writes a product + price + store + date record. Over time this becomes a personal price history that no external price comparison service can replicate — because it is tied to the specific products this specific user buys, at the specific stores they shop at.

This feature turns that data into an actionable alert: "This product costs 40% more than 3 months ago. Here's a cheaper equivalent 300 meters away."

## User Outcome

- No setup. Receipt scanning is already happening (spec 06).
- When the user scans a product or a receipt, Brioela checks if the price has moved significantly vs. their history.
- If it has: an inline callout on the scan result screen shows the price change.
- Weekly food summary (spec 16) includes a "price movers" section: top 3 products that increased most that week.
- The user can ask via voice: "Has [product] gotten more expensive?" and get the exact answer from their history.

## Price Change Detection

Price change is computed per product (by UPC) across the user's purchase history:

- **Significant increase threshold**: >15% more expensive than the 90-day rolling average.
- **Significant decrease threshold**: >10% cheaper (surfaces as a positive finding: "this is cheaper than usual, good time to stock up").
- Price is attributed to the specific store where it was purchased — price change at Store A is separate from Store B.

A product with fewer than 3 historical price points is shown as "not enough history yet."

## Cheaper Equivalent Suggestion

When a price increase is flagged, Brioela attempts to surface an equivalent:

1. Query product corpus for products with similar nutritional profile, same category, and same constraint compatibility (no point suggesting a cheaper product the user can't eat).
2. Check if any of those products have been scanned by users at nearby stores with a lower recent price.
3. If a match exists: "Similar product available at [store] for [price] — [X]% cheaper."

The suggestion must clear the user's full constraint profile: allergies, dislikes, dietary identity, medical conditions. A cheaper alternative that contains a known allergen is never surfaced.

## Receipt History View

The user can browse their full price history per product from the receipt screen:

- Product name + photo.
- Price history chart: date on x-axis, price on y-axis, store color-coded.
- Average price, highest, lowest.
- Current price vs. 30/60/90-day average.

This view is available in Core tier and above (receipt scanning is a Core feature per pricing spec).

## Weekly Inflation Summary

The weekly food summary (spec 16) includes an inflation section if meaningful price changes occurred:

"Your grocery basket cost $X this week. That's $Y more than your average 3 months ago. The biggest movers: [product] (+43%), [product] (+28%)."

This is shareable. "My grocery bill went up 40% in 3 months" with specific product data is content people post.

## Voice Query

User can ask at any time:
- "Has butter gotten more expensive?"
- "Am I spending more on groceries this month?"
- "What's the cheapest place to buy [product] near me?"

The Orchestrator DO holds the price history. The voice agent queries it directly at session start as part of context injection.

## Data Model

- `purchase_price_event`: event_id, user_id, upc, product_name, price, store_name, store_location, purchase_date, receipt_scan_id.
- `price_alert`: alert_id, user_id, upc, alert_type (increase/decrease), pct_change, baseline_price, current_price, suggestion_product_id (nullable), created_at.

## Technical Constraints

- Price history is stored in the user's Orchestrator DO SQLite, not in Supabase — it is personal data, not shared data.
- Aggregated price trend data (anonymized, no user attribution) can be stored in Supabase to power the "nearby store has it cheaper" query across users.
- Price computation runs as part of the DO alarm cycle — not on every receipt scan. The alarm fires weekly and computes the rolling averages in batch.

## Success Metrics

- Price alert trigger rate per user per month.
- Cheaper equivalent suggestion acceptance rate (user taps the suggestion).
- Weekly summary inflation section tap-through rate.
- Voice query rate for price-related questions.
- Correlation between inflation alerts and store switching behavior (do users actually go to the suggested store?).
