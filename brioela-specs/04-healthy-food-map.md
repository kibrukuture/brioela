# 04. Healthy Food Map

## Goal
Provide a location-aware map of nearby healthy food options, products, and trusted businesses using user scan activity, business data, and community contributions.

## User Outcome
- Open map or receive map suggestions ambiently.
- Discover nearby stores, restaurants, markets, or specific product availability.
- Filter results using personal dietary constraints.

## In Scope
- Business and place discovery.
- Product availability overlays.
- Health-oriented ranking.
- Personal filters for diet, allergies, and boycott preferences.

## Out of Scope
- Turn-by-turn navigation engine.
- Delivery marketplace functionality.

## Data Sources
- User-submitted product sightings.
- Verified business profiles.
- Public place data.
- Optional merchant feeds.
- Ground finds layer (spec 35) — real-time community observations rendered as a separate signal overlay on the same base map.

## Data Model
- `map_place`: place_id, kind, name, lat, lng, verification_status.
- `map_place_signal`: place_id, healthy_score, community_score, affordability_score, recency_score.
- `product_sighting`: place_id, product_id, seen_at, user_id, confidence.
- Ground finds are stored separately in the `find` and `location_signal_summary` tables (spec 35) — they are not merged into `map_place_signal`. Both layers render on the same Mapbox GL base map with independent toggles.

## Ranking Model
- Base place quality.
- Product relevance to user memory.
- Distance and open-now status.
- Ground find density at location (from `location_signal_summary`, replaces generic "community note density").
- Price and recent availability confidence.

## API Surface
- `GET /api/map/nearby`
- `GET /api/map/places/:id`
- `POST /api/map/sightings`

## Technical Notes
- Use geohash or S2 cells for efficient local querying.
- Product sightings should expire or decay unless re-confirmed.
- Ranking must support user-specific exclusions before place scoring.

## Success Metrics
- Nearby result clickthrough rate.
- Place revisit rate.
- Density of active sightings per city.
