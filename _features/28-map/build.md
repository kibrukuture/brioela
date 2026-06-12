# Healthy Food Map — Build

Feature **28**. Production paths under `backend/src/api/map/` (handlers, helpers, routes), `shared/drizzle/schema/` (Supabase map tables), `shared/validator/` (map Zod schemas), `shared/routes/` (map route constants), `mobile/features/map/` (Mapbox shell, healthy Skia layer, place detail, toggles), `mobile/network/map/`, and Mapbox config. Existing `backend/src/api/maps/` (LocationIQ location search) remains — autocomplete is not the discovery map.

**Scope:** Mapbox integration, place/sighting/price/alert tables, nearby ranking API, sighting decay, alert candidate generation, healthy map Skia layer, layer toggle orchestration, place detail sheet, travel cache display hook, Luma tier gate for full map + geo alerts. **Not in 28 build:** Ground Find APIs and pulse layer (**27**), menu scan parsers (**26**), product scanner (**24**), push send path (**21**), travel preload jobs (**35**), receipt Brain price history (**33**), Bela routing UI (**42**), verified onboarding (**46**).

---

## Shipped today

| Area | Status |
|---|---|
| Location search API (LocationIQ) | ✓ `GET /v1/maps/location-search` |
| Location search validator + routes | ✓ `shared/validators/location-search.validator.ts`, `shared/api/maps.routes.ts` |
| Mobile location search client | ✓ `mobile/network/maps/` |
| Skia Layer 4 map dots spec | ✓ docs only (`01-design-system/05-skia-layers.md`) |
| Notification kinds documented | ✓ (**21** — `price_alert`, `map_nearby_opportunity`; no producers) |
| Mapbox SDK / config | ✗ |
| Supabase map tables | ✗ |
| Map Zod schemas | ✗ |
| `GET /api/map/nearby` | ✗ |
| Product sightings / price alerts | ✗ |
| Mobile healthy map feature | ✗ |
| Map tests | ✗ |

---

## File manifest

### Mapbox config (28)

| File | Role |
|---|---|
| `mobile/features/map/config/mapbox.config.ts` | Access token, style URL, env-specific handling |
| `mobile/features/map/config/mapbox.init.ts` | `@rnmapbox/maps` init on app start |
| `mobile/app.config.ts` (or env) | `MAPBOX_ACCESS_TOKEN` for EAS builds |

Web/PWA: Mapbox GL JS init in web entry — separate from native.

### Shared validator (28)

| File | Role |
|---|---|
| `shared/validator/map.schema.ts` | `MapPlaceSchema`, `MapPlaceSignalSchema`, `ProductSightingSchema`, `PriceSightingSchema`, `AlertCandidateSchema`, `MapNearbyQuerySchema`, `MapNearbyResponseSchema`, `PlaceDetailSchema`, `CreateSightingRequestSchema`, `CreatePriceSightingRequestSchema` |
| `shared/routes/map.routes.ts` | `MAP_ROUTES`, `GET_NEARBY`, `GET_PLACE`, `POST_SIGHTING`, `POST_PRICE_SIGHTING`, `EVALUATE_ALERTS` |

Keep `shared/api/maps.routes.ts` for LocationIQ search — do not merge with discovery map routes.

### Supabase Drizzle (28)

| File | Role |
|---|---|
| `shared/drizzle/schema/map.place.schema.ts` | `map_place` |
| `shared/drizzle/schema/map.place.signal.schema.ts` | `map_place_signal` |
| `shared/drizzle/schema/product.sighting.schema.ts` | `product_sighting` |
| `shared/drizzle/schema/price.sighting.schema.ts` | `price_sighting` |
| `shared/drizzle/schema/alert.candidate.schema.ts` | `alert_candidate` |
| `shared/drizzle/schema/delivered.alert.schema.ts` | `delivered_alert` |
| `shared/drizzle/migrations/*` | Postgres migrations + geohash index |

**27** `find.location_id` FK → `map_place.place_id` — migrate **28** places before **27** find table FK.

### Backend API — map module (28)

| File | Role |
|---|---|
| `backend/src/api/map/map.route.ts` | Hono mount at `/api/map` |
| `backend/src/api/map/map.controller.ts` | Controller wiring |
| `backend/src/api/map/_handlers/get.nearby.handler.ts` | `GET /api/map/nearby` |
| `backend/src/api/map/_handlers/get.place.handler.ts` | `GET /api/map/places/:id` |
| `backend/src/api/map/_handlers/post.sighting.handler.ts` | `POST /api/map/sightings` |
| `backend/src/api/map/_handlers/post.price.sighting.handler.ts` | `POST /api/map/price-sightings` |
| `backend/src/api/map/_handlers/evaluate.alerts.handler.ts` | `POST /api/alerts/evaluate` |
| `backend/src/api/map/_handlers/index.ts` | Barrel |
| `backend/src/api/map/_helpers/rank.places.helper.ts` | Personalized scoring pipeline |
| `backend/src/api/map/_helpers/score.place.relevance.helper.ts` | User memory + constraint overlap |
| `backend/src/api/map/_helpers/score.menu.fit.helper.ts` | Read **26** shared restaurant intel |
| `backend/src/api/map/_helpers/read.ground.density.helper.ts` | Read **27** summaries by place |
| `backend/src/api/map/_helpers/query.places.geo.helper.ts` | Geohash/S2 bbox query |
| `backend/src/api/map/_helpers/decay.sighting.helper.ts` | Confidence decay + reconfirm bump |
| `backend/src/api/map/_helpers/generate.alert.candidates.helper.ts` | Threshold + suppression logic |
| `backend/src/api/map/_helpers/check.map.entitlement.helper.ts` | Luma gate for full map + alerts |
| `backend/src/api/map/_helpers/enqueue.price.alert.helper.ts` | Write candidate → **21** queue |
| `backend/src/api/map/_helpers/read.travel.cache.helper.ts` | Redis geo cache read (**35** writer) |
| `backend/src/api/map/_helpers/index.ts` | Barrel |
| `backend/src/api/map/index.ts` | Module export |

Register routes in backend app router (**01**). Keep `backend/src/api/maps/` for location search.

### Scheduled / queue jobs (28)

| File | Role |
|---|---|
| `backend/src/jobs/map-decay-sightings.job.ts` | Daily confidence decay on stale sightings |
| `backend/src/jobs/map-evaluate-alerts.job.ts` | Periodic alert candidate generation |
| `backend/src/jobs/map-seed-places.job.ts` | Optional admin seed from public place feeds |

### Mobile (28)

| File | Role |
|---|---|
| `mobile/features/map/components/healthy-map.feature.tsx` | Mapbox MapView shell + layer orchestration |
| `mobile/features/map/components/healthy-signal-layer.tsx` | Skia dots for places / fit sizing |
| `mobile/features/map/components/layer-toggles.tsx` | Healthy / Ground / menu intel toggles |
| `mobile/features/map/components/place-detail.sheet.tsx` | Health, products, prices, Ground hook |
| `mobile/features/map/components/place-card.tsx` | Compact list/card preview |
| `mobile/features/map/components/map-filter.sheet.tsx` | Open-now, kind, constraints filters |
| `mobile/features/map/components/travel-context.banner.tsx` | Destination cache active (**35**) |
| `mobile/features/map/hooks/use.healthy.map.hook.ts` | Nearby fetch + bbox state |
| `mobile/features/map/hooks/use.place.detail.hook.ts` | Place detail + sightings |
| `mobile/features/map/hooks/use.map.layers.hook.ts` | Toggle persistence |
| `mobile/features/map/hooks/use.travel.map.context.hook.ts` | Read travel cache + camera fly-to |
| `mobile/network/map/get-nearby.api.ts` | `GET /api/map/nearby` |
| `mobile/network/map/get-place.api.ts` | `GET /api/map/places/:id` |
| `mobile/network/map/post-sighting.api.ts` | `POST /api/map/sightings` |
| `mobile/design-system/shaders/map-place-pulse.glsl.ts` | SkSL for healthy dot glow |

**27** Ground components mount inside `healthy-map.feature.tsx` when Ground toggle on — do not duplicate MapView.

Scanner integration (**24** — not owned by **28**):

| File | Role |
|---|---|
| `mobile/features/scanner/components/scan-follow-up-actions.tsx` | "Map" opens healthy-map with scan bbox |
| Wire sighting create on scan with place match | Consumer of `POST /api/map/sightings` |

Menu integration (**26** — not owned by **28**):

| File | Role |
|---|---|
| Menu result overlay | Reads place detail summary lines via **28** API |

---

## Acceptance criteria

### First release

- [ ] Mapbox native SDK initialized with token + attribution visible
- [ ] `map_place`, `map_place_signal`, `product_sighting`, `price_sighting`, `alert_candidate`, `delivered_alert` migrated with geohash index
- [ ] `GET /api/map/nearby` returns ranked places for viewport bbox in <500ms p95 (indexed geo query)
- [ ] Hard constraint exclusions applied before ranking (**07** Brain RPC)
- [ ] Ground density read from **27** summaries — never merges into `map_place_signal`
- [ ] Menu fit score read from **26** shared intel when linked — null when no intel
- [ ] `GET /api/map/places/:id` returns scores, decayed sightings, price deltas, menu fit preview
- [ ] `POST /api/map/sightings` creates/reconfirms sighting; confidence decays on schedule
- [ ] `POST /api/map/price-sightings` records price; feeds alert evaluation
- [ ] Alert thresholds: >15% increase / >10% decrease vs 90-day average; suppression via `delivered_alert`
- [ ] Healthy Skia layer: dot color by health score, size by personalized fit
- [ ] Layer toggles: healthy / Ground (**27** component) / menu intel highlights — independent
- [ ] Place detail sheet lists Ground finds via **27** API — not raw find query from map module
- [ ] Scan "Map" action opens map filtered to scan geoHash (**24** integration)
- [ ] Luma entitlement gates full map + geo alerts; Sapor read-only glimpse per tier doc
- [ ] Location search (`/v1/maps/location-search`) unchanged and coexists with discovery map

### Second release / integration

- [ ] Travel arrival: read **35** Redis cache; fly map to destination context
- [ ] Receipt parse (**33**) writes `price_sighting` rows
- [ ] Bela smart routing (**42**) reads sightings + signals — no UI in **28**
- [ ] `price_alert` / `map_nearby_opportunity` candidates enqueued for **21**
- [ ] Verified business badge on place detail when `verification_status=verified` (**46**)

### Integration acceptance (cross-feature)

- [ ] **27** Ground layer mounts on **28** MapView; `location_id` FK resolves to `map_place`
- [ ] **26** menu overlay reads summarized place context — no raw menu on map API
- [ ] **24** scan with place creates product sighting when confidence sufficient
- [ ] **21** delivers `price_alert` from **28** candidate queue
- [ ] **35** travel preload cache displayed on map arrival

---

## Build order

From `_records/build-order/08-layer-map.md`:

1. **07-layer-scanner** (sighting input — unshipped)
2. **07-layer-ground** (Ground overlay — unshipped; needs **28** places FK)
3. **08-layer-map** (this feature)

Practical order: **28** places table first → **27** find FK → full map UI with both layers.

---

## Test plan

| Test | Covers |
|---|---|
| `map.schema.test.ts` | Zod round-trip |
| `query.places.geo.helper.test.ts` | Bbox/geohash correctness |
| `rank.places.helper.test.ts` | Hard exclude + score ordering |
| `decay.sighting.helper.test.ts` | Confidence decay curve |
| `generate.alert.candidates.helper.test.ts` | Threshold + suppression |
| `get.nearby.handler.integration.test.ts` | End-to-end nearby (mock DB) |
| `post.sighting.handler.integration.test.ts` | Create + reconfirm |

---

## Sources

- `build-guide/10-map/` (00–06)
- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`
- `build-guide/17-menu-scanning/07-personalized-restaurant-discovery.md`
- `build-guide/01-design-system/05-skia-layers.md`
- `build-guide/09-ground/04-map-rendering.md`
- `_records/build-order/08-layer-map.md`
- `_records/connections/05-map-connections.md`
