# Map — Data Model

## What This File Covers

Shared map tables for places, health scoring, product sightings, price sightings, and alerts.

## Source Specs

- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`
- `build-guide/09-ground/01-find-data-model.md`

## Shared Supabase Tables

### `map_place`

Represents a real place shown on the map.

Fields:

- `place_id`
- `kind`
- `name`
- `lat`
- `lng`
- `verification_status`

Kinds include stores, restaurants, markets, stalls, and trusted businesses.

### `map_place_signal`

Curated health/place signal table.

Fields:

- `place_id`
- `healthy_score`
- `community_score`
- `affordability_score`
- `recency_score`

This is not Ground. Ground uses `location_signal_summary`.

### `product_sighting`

Product availability table.

Fields:

- `place_id`
- `product_id`
- `seen_at`
- `user_id`
- `confidence`

Product sightings decay unless reconfirmed.

### `price_sighting`

Observed product price at a place.

Fields:

- `product_id`
- `place_id`
- `amount`
- `currency`
- `seen_at`
- `reporter_user_id`

### `alert_candidate`

Generated opportunity before delivery.

Fields:

- `user_id`
- `product_id`
- `place_id`
- `score`
- `generated_at`

### `delivered_alert`

Delivery log for suppression/throttling.

Fields:

- `user_id`
- `alert_type`
- `object_id`
- `delivered_at`

## Ground Boundary

Ground uses:

- `find`
- `location_signal_summary`

Those are documented in `09-ground` and are not owned here.
