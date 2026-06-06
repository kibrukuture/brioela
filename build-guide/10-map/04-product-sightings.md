# Map — Product Sightings

## What This File Covers

Product availability observations and how they enter the map layer.

## Source Specs

- `brioela-specs/04-healthy-food-map.md`
- `build-guide/07-scanner/02-product-resolution.md`
- `build-guide/09-ground/03-find-submission-flow.md`

## What A Product Sighting Is

A product sighting says a product was seen at a place at a time with a confidence score.

It is not a Ground Find by itself.

## Inputs

Product sightings can come from:

- product scans with location/place match
- receipt parsing
- Ground Finds that mention product availability
- merchant feeds later
- Bela shopper scan flow later

## Decay

Sightings decay unless reconfirmed.

Old sightings should not keep a product shown as confidently available.

## Map Behavior

- High-confidence recent sightings can appear on place detail.
- Availability can improve nearby map ranking for matching user interests.
- Product sightings can support smart routing later.

## API Surface

- `POST /api/map/sightings`

## Boundary

Ground Finds are richer observations. Product sightings are normalized availability signals.
