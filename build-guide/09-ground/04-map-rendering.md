# Ground — Map Rendering

## What This File Covers

Ground map rendering, pulse animation, relevance sizing, clusters, zoom behavior, and building interaction.

## Source Specs

- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`
- `build-guide/10-map/00-overview.md`

## Map Foundation

Use the same Mapbox base as the healthy food map.

Ground is a separate layer, not merged with healthy-place scoring.

Ground reads `location_signal_summary` for map rendering.

## Visual System

Signal dots are anchored to physical locations.

Color by signal type:

- red: health / safety
- orange: ingredient / availability
- green: price
- blue: new product
- grey: general

## Pulse = Freshness

| Age | Pulse |
|---|---|
| < 2 hours | fast pulse |
| 2-12 hours | medium pulse |
| 12-48 hours | slow pulse |
| 2-7 days | very slow pulse |
| 7-14 days | static dim dot |
| > 14 days | faded, expiring |

## Size = Personal Relevance

Render size:

```text
rendered_dot_size = base_size × (1 + relevance_score × 0.8)
```

Relevance comes from overlap with user ingredient profile, scan history, constraints, and cooking memory.

The world is not filtered away; irrelevant dots are smaller.

## Zoom Behavior

### City

- clusters as colored rings
- red outer ring if any safety signal exists
- count in center

### Neighborhood

- buildings show active-find count badge
- badge color = dominant signal type

### Building

- individual pulsing dots
- tap highlights building with strongest signal color
- find list slides up

## First-Open Feeling

The map must not look like colored Google Maps pins.

It should feel like a living city breathing with food knowledge.
