# Map — Overview

## What This Folder Covers
The healthy food map — location-aware discovery of nearby healthy food options, products, and trusted businesses. Separate from Ground (which is the community intelligence layer). The map shows curated health data about places; Ground shows real-time community observations. Both render on the same Mapbox base map with independent layer toggles. Also covers: product sightings, place health scoring, hyperlocal price alerts, and pre-trip food intelligence (map pre-loads for travel destinations).

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/04-healthy-food-map.md` — map places, health scoring, product availability overlays, Ground integration
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md` — price sightings, alert logic, throttling
- `brioela-specs/22-pre-trip-food-intelligence.md` — travel intent detection, destination pre-load, local database priority switch

## Key Decisions From Specs
- Same Mapbox base map as Ground — both layers render together with toggles
- `map_place_signal` (healthy food score) and `location_signal_summary` (Ground finds) are separate tables — never merged
- Ranking: base place quality + product relevance to user memory + distance/open-now + Ground find density + price/availability confidence
- Geohash or S2 cells for efficient local querying
- Product sightings decay unless re-confirmed (community-contributed availability data)
- Price alerts: >15% increase vs 90-day rolling average = significant; >10% decrease = positive signal
- Travel: destination map pre-fetched via Upstash QStash job before departure; cached in Upstash Redis with geo-region key
- Travel intent detected from: voice mention, optional calendar integration, repeat map search of distant city

## What This Folder Depends On
- `05-orchestrator` — user constraint profile for filtering
- `08-ground` — Ground signal layer overlays on this map
- `03-foundation` — Supabase for shared map tables, Upstash Redis for geo cache

## What Depends On This Folder
- `22-bela` — smart routing uses map data (store locations, product sightings)
- `11-pantry-meal-plan` — store suggestions on shopping list from map price data
