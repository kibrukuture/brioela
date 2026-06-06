# Map — Nearby Ranking API

## What This File Covers

The nearby map query, filtering, ranking, and user-specific result ordering.

## Source Specs

- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`

## API Surface

- `GET /api/map/nearby`
- `GET /api/map/places/:id`

## Query Inputs

- viewport bounds
- user location if available
- zoom level
- active layer toggles
- user ID if authenticated
- optional filters: open-now, place kind, product/category, constraints

## Ranking Inputs

- base place quality
- product relevance to user memory
- distance
- open-now status
- Ground find density from `location_signal_summary`
- price confidence
- recent availability confidence

## User Filtering

Filtering happens before ranking for hard constraints.

Examples:

- hard allergy exclusion
- dietary identity mismatch
- active boycott filter
- medical-condition food rule later

## Ranking Rule

Map results are personalized, but truthful.

The map should not hide the world unless a hard safety constraint applies. It should rank and size the world around what matters to the user.

## Geospatial Query

Use geohash or S2 cells for efficient local querying.

Implementation must avoid full-table geographic scans.
