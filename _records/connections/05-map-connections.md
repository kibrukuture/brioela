# Connections — Map

spec: brioela-specs/04-healthy-food-map.md
  → build-guide/10-map/00-overview.md          [x] done
  → build-guide/10-map/01-mapbox-setup.md      [x] done (Mapbox base map)
  → build-guide/10-map/02-map-data-model.md    [x] done (map_place, map_place_signal, product_sighting)
  → build-guide/10-map/03-nearby-ranking-api.md [x] done (nearby API, user-aware ranking)
  → build-guide/10-map/04-product-sightings.md [x] done (availability observations)
  → build-guide/10-map/06-map-ui-layers.md     [x] done (healthy map + Ground layer split)

spec: brioela-specs/15-hyperlocal-price-and-availability-alerts.md
  → build-guide/10-map/02-map-data-model.md    [x] done (price_sighting, alert_candidate, delivered_alert)
  → build-guide/10-map/03-nearby-ranking-api.md [x] done (price/availability confidence in ranking)
  → build-guide/10-map/05-price-alerts.md      [x] done (thresholds, throttling, candidate generation)

build-guide: build-guide/09-ground/
  → build-guide/10-map/01-mapbox-setup.md      [x] done (shared Mapbox base)
  → build-guide/10-map/06-map-ui-layers.md     [x] done (Ground overlay as separate layer)

build-guide: build-guide/07-scanner/
  → build-guide/10-map/04-product-sightings.md [x] done (scan-to-sighting input)

build-guide: build-guide/13-receipt-intelligence/
  → build-guide/10-map/05-price-alerts.md      [x] done (receipt-derived price history)
