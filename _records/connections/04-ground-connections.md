# Connections — Ground

spec: brioela-specs/35-ground-community-intelligence.md
  → build-guide/09-ground/00-overview.md              [x] done
  → build-guide/09-ground/01-find-data-model.md       [x] done (find, location_signal_summary, user_find_history)
  → build-guide/09-ground/02-authenticity-gate.md     [x] done (gate checks, rejection, media rules)
  → build-guide/09-ground/03-find-submission-flow.md  [x] done (scan/map/ambient, voice-to-find)
  → build-guide/09-ground/04-map-rendering.md         [x] done (Mapbox layer, colors, freshness)

spec: brioela-specs/35b-ground-finds-deep-design.md
  → build-guide/09-ground/00-overview.md              [x] done
  → build-guide/09-ground/03-find-submission-flow.md  [x] done (AI-drafted finds)
  → build-guide/09-ground/04-map-rendering.md         [x] done (personal relevance, pulse animation, clusters)
  → build-guide/09-ground/05-haptic-walking-discovery.md [x] done (second-release haptic discovery)
  → build-guide/09-ground/06-find-to-cooking-trigger.md [x] done (second-release cooking trigger)

spec: brioela-specs/03-hyperlocal-community-notes.md
  → build-guide/09-ground/00-overview.md              [x] done (deprecated; superseded by Ground)

spec: brioela-specs/04-healthy-food-map.md
  → build-guide/09-ground/04-map-rendering.md         [x] done (Ground overlays same map base as healthy map)

spec: brioela-specs/23-ambient-notification-strategy.md
  → build-guide/09-ground/05-haptic-walking-discovery.md [x] done (ambient/haptic suppression rules)
  → build-guide/09-ground/06-find-to-cooking-trigger.md [x] done (ambient cooking card)

build-guide: build-guide/07-scanner/
  → build-guide/09-ground/03-find-submission-flow.md  [x] done (find-from-scan, AI-drafted finds)

build-guide: build-guide/05-orchestrator/
  → build-guide/09-ground/01-find-data-model.md       [x] done (private user_find_history)
  → build-guide/09-ground/06-find-to-cooking-trigger.md [x] done (Orchestrator matching)

build-guide: build-guide/10-map/
  → build-guide/09-ground/04-map-rendering.md         [x] done (shared Mapbox base, separate layer)
