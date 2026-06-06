# Map — Mapbox Setup

## What This File Covers

Mapbox setup for the healthy food map and Ground overlay surface.

## Source Specs

- `brioela-specs/04-healthy-food-map.md`
- `build-guide/09-ground/04-map-rendering.md`

## Current Direction

Use Mapbox as the base map provider.

Docs checked:

- Mapbox iOS Maps SDK current docs
- Mapbox Android Maps SDK current docs
- Mapbox GL JS current docs

## Platform Split

- Native iOS/Android: Mapbox native SDK through the React Native integration we choose during implementation.
- Web/PWA: Mapbox GL JS.

## Base Map Requirements

- 3D-capable map style.
- Building extrusion support where available.
- Runtime styling support.
- Custom data layers for healthy map and Ground.
- Camera control for zoom, pitch, bearing, and fly-to transitions.

## Required Config

- Mapbox access token.
- Map style URL.
- Environment-specific token handling.
- Attribution visible and not removed.

## Layers

The map has two independent food intelligence layers:

- Healthy map layer from `map_place_signal`.
- Ground layer from `location_signal_summary`.

Never merge these tables. They are different kinds of truth.
