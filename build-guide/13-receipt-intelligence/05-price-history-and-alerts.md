# Receipt Intelligence — Price History And Alerts

## What This File Covers

Personal price history, inflation detection, and cheaper equivalent suggestions.

## Source Specs

- `brioela-specs/29-food-cost-inflation-tracker.md`
- `build-guide/10-map/05-price-alerts.md`

## Private Price History

Store personal price history in Orchestrator DO SQLite.

Fields:

- `event_id`
- `user_id`
- `upc`
- `product_name`
- `price`
- `store_name`
- `store_location`
- `purchase_date`
- `receipt_scan_id`

## Detection

- significant increase: >15% above 90-day rolling average
- significant decrease: >10% below rolling average
- fewer than 3 price points: not enough history

## Cheaper Equivalent

Only suggest cheaper equivalents that pass:

- same category
- similar nutrition
- user constraints
- allergies
- dislikes
- dietary identity
- medical condition rules later

## Shared Aggregate Boundary

Personal price history is private.

Anonymized aggregate price trends can feed `10-map` for nearby cheaper-store suggestions.
