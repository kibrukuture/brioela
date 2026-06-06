# Map — UI Layers

## What This File Covers

How the healthy map and Ground appear together without becoming one confusing layer.

## Source Specs

- `brioela-specs/04-healthy-food-map.md`
- `build-guide/09-ground/04-map-rendering.md`

## Layer Model

The base map is shared.

Layers:

1. Base Mapbox style.
2. Healthy place/product layer.
3. Ground signal layer.
4. User location layer.
5. Optional alert/opportunity layer.

## Healthy Map Layer

Shows:

- places
- healthy scores
- trusted businesses
- product availability
- affordability signals

## Ground Layer

Shows:

- pulsing finds
- freshness
- signal type
- relevance sizing

Ground layer behavior is owned by `09-ground`.

## Place Detail

Place detail should show:

- place identity
- health summary
- available products
- recent price/availability signals
- Ground finds for the location
- actions: scan here, save, route/open map, start relevant flow later

## UX Rule

The map should feel alive, not like pins on Google Maps.

Do not over-label. Use layers, pulses, color, and focused bottom sheets.
