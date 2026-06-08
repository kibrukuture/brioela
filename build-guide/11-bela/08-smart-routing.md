# Bela — Smart Routing

## What This File Covers

Store selection and route planning for a Bela order.

## Sources

- `implementable-specs/bela/08-smart-routing.md`
- `build-guide/09-ground/`
- `build-guide/10-map/`

## Inputs

- `product_sighting`
- `price_sighting`
- `map_place_signal`
- `location_signal_summary`
- user preference/history from Brain

## Scoring

- availability: 50%
- price: 30%
- store quality: 10%
- user preference: 10%

## Route Rules

- Prefer one store if confidence is high.
- Allow two stores if one covers 80%+ and route distance is reasonable.
- Never recommend more than two stops.
- Native maps handles turn-by-turn navigation.
