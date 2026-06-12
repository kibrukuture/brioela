# Status

open

**Healthy food map not shipped.** Build-guide **10-map** is complete (docs only). Partial: LocationIQ location search API (`GET /v1/maps/location-search`) — address autocomplete, not Mapbox discovery map. Zero Mapbox SDK, zero `map_place` / sightings / price alert tables, zero nearby ranking API, zero mobile healthy map UI, zero alert producers. Dependencies: Brain DO (**04** shipped), constraints (**07**), Ground (**27** unshipped — blocked on **28** places FK), menu intel (**26** unshipped).

# Shipped in backend (partial — not discovery map)

- [x] `GET /v1/maps/location-search` — LocationIQ proxy (`backend/src/api/maps/`)
- [x] `shared/validators/location-search.validator.ts`
- [x] `shared/api/maps.routes.ts`
- [x] `mobile/network/maps/maps.api.ts`, `use-location-search.ts`
- [x] Notification spec kinds `price_alert`, `map_nearby_opportunity` (**21** — documented only)
- [ ] Mapbox SDK + config
- [ ] `map_place` Supabase table
- [ ] `map_place_signal` Supabase table
- [ ] `product_sighting` Supabase table
- [ ] `price_sighting` Supabase table
- [ ] `alert_candidate` / `delivered_alert` tables
- [ ] Map Zod schemas
- [ ] `backend/src/api/map/` module
- [ ] `GET /api/map/nearby`
- [ ] `GET /api/map/places/:id`
- [ ] `POST /api/map/sightings`
- [ ] `POST /api/map/price-sightings`
- [ ] `POST /api/alerts/evaluate`
- [ ] Geohash/S2 spatial queries
- [ ] Personalized place ranking
- [ ] Menu-intel fit read (**26**)
- [ ] Ground density read (**27**)
- [ ] Sighting decay job
- [ ] Alert candidate generation
- [ ] Mobile `features/map/` healthy map UI
- [ ] Skia healthy signal layer
- [ ] Layer toggles (Healthy / Ground / menu intel)
- [ ] Place detail bottom sheet
- [ ] Travel cache display hook (**35**)
- [ ] Luma map entitlement gate
- [ ] Scan "Map" follow-up wiring (**24**)
- [ ] Map tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No Mapbox in repo | `rg Mapbox @rnmapbox` — zero |
| G2 | No `backend/src/api/map/` | `rg map/nearby backend` — zero |
| G3 | No map Zod schemas | `rg map.schema shared/validator` — zero |
| G4 | No `map_place` drizzle schema | `rg map_place shared/drizzle` — zero |
| G5 | No `map_place_signal` table | Same |
| G6 | No `product_sighting` table | Same |
| G7 | No `price_sighting` table | Same |
| G8 | No `alert_candidate` / `delivered_alert` | Same |
| G9 | No `GET /api/map/nearby` | spec 04 — zero |
| G10 | No `GET /api/map/places/:id` | spec 04 — zero |
| G11 | No `POST /api/map/sightings` | spec 04 — zero |
| G12 | No `POST /api/map/price-sightings` | spec 15 — zero |
| G13 | No `POST /api/alerts/evaluate` | spec 15 — zero |
| G14 | No geohash spatial index | `03-nearby-ranking-api.md` — not implemented |
| G15 | No personalized ranking helper | `17/07-personalized-restaurant-discovery.md` — not implemented |
| G16 | No menu fit score read | **26** shared intel unshipped |
| G17 | No Ground density read in ranking | **27** summaries unshipped |
| G18 | No mobile `features/map/` | `rg healthy-map mobile/features` — zero |
| G19 | No Skia healthy signal layer | design Layer 4 — docs only |
| G20 | No layer toggle UI | `06-map-ui-layers.md` — not built |
| G21 | No place detail sheet | `06-map-ui-layers.md` — not built |
| G22 | No sighting decay job | `04-product-sightings.md` — not built |
| G23 | No alert candidate generator | `05-price-alerts.md` — not built |
| G24 | No `price_alert` producer | **21** spec lists kind — no backend writer |
| G25 | No `map_nearby_opportunity` producer | **21** spec — no backend writer |
| G26 | Scan "Map" action unwired | **24** `04-scan-result-ui.md` — spec only |
| G27 | Ground layer blocked on places FK | **27** G34 — `map_place` not migrated |
| G28 | Menu overlay blocked | **26** G20 — depends on **28**/**27** |
| G29 | Travel cache display unwired | **35** unshipped — **28** consumer only |
| G30 | Bela routing data unwired | **42** — consumes unshipped tables |
| G31 | Receipt → price sighting unwired | **33** — consumer of **28** |
| G32 | Luma map entitlement unwired | `25-pricing-tiers/02` — not built |
| G33 | No map tests | No `map*.test.ts` |
| G34 | Session log 010 "complete" misleading | Build-guide docs only; no production map |
| G35 | Drizzle example schema conflict | `02-coding-standards/07` product_sightings ≠ `10-map/02` |
| G36 | LocationIQ ≠ Mapbox | Shipped autocomplete ≠ unshipped discovery map |

# 28 vs neighbor boundaries

| In **28** (this feature) | In separate feature |
|---|---|
| Mapbox base + style + tokens | Ground Find tables + gate — **27** |
| map_place, signals, sightings, price tables | Find pulse rendering — **27** |
| Nearby ranking + healthy Skia layer | Ground Skia pulse layer — **27** |
| alert_candidate generation | Push delivery — **21** |
| Menu-intel fit read for ranking | Menu parsing + shared intel write — **26** |
| Product sighting API | Product scan verdict — **24** |
| Place detail + toggles | Dish verdict UI — **26** |
| Travel cache display | Travel preload jobs — **35** |
| LocationIQ location search (shipped) | Receipt private history — **33** |
| verification_status field on place | Verified onboarding — **46** |

# Critical boundary: Map ≠ Ground

| | **28-map** | **27-ground** |
|---|---|---|
| **What** | Curated healthy place/product discovery | Anonymous community observations (Finds) |
| **Tables** | `map_place`, `map_place_signal`, `product_sighting`, … | `find`, `location_signal_summary` |
| **Rendering** | Health scores, fit-sized dots, sightings | Pulsing signal dots, freshness, relevance |
| **Same surface** | Shared Mapbox base; **28** owns shell + healthy layer toggle | **27** owns Ground layer component |

# Critical boundary: Map ranking ≠ Menu scanning

| | **28-map** | **26-menu-scanning** |
|---|---|---|
| **What** | Map-scale personalized place discovery | In-restaurant dish verdicts from menu capture |
| **Ranking** | **28** implements `GET /api/map/nearby` | **26** supplies shared restaurant intel only |
| **Doc** | Consumes `17-menu-scanning/07-personalized-restaurant-discovery.md` scoring shape | Does not own map API or Mapbox |

# Critical boundary: Map alerts ≠ Notifications

| | **28-map** | **21-platform-notifications** |
|---|---|---|
| **What** | Price/availability candidate generation + map linkage | OneSignal push delivery, throttling, quiet hours |
| **Tables** | `alert_candidate`, `delivered_alert`, `price_sighting` | Push token registry, send-push handler |
| **Kinds** | Produces `price_alert`, `map_nearby_opportunity` | Delivers them |

# Blocked by

- 01-platform-foundation (API router, mobile shell, Redis bindings for travel cache read)
- 04-brain-foundation (constraint profile RPC for ranking)
- 07-brain-constraint-tools (hard exclusion filters)
- 24-scanner (scan → sighting input — unshipped)
- 26-menu-scanning (menu fit intel — unshipped)
- 27-ground (Ground layer + density read — unshipped; also blocked on **28** places)
- 43-pricing-tiers (Luma map entitlement — unshipped)

# Blocks

- 27-ground (`location_id` FK → `map_place`; shared Mapbox shell)
- 26-menu-scanning (place overlay read)
- 24-scanner (scan "Map" follow-up target)
- 42-bela (smart routing data)
- 34-pantry-meal-plan (store suggestions from map price data)
- 35-ambient-intelligence (travel map display on arrival)
- 21-platform-notifications (`price_alert`, `map_nearby_opportunity` producers)
- 33-receipt-intelligence (shared price sighting sink)
- 46-verified-profiles (map listing badge)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/010-map-complete.md` | Docs-only completion |
| `build-guide/02-coding-standards/07-data-layer-drizzle.md` | Example `product_sightings` schema conflicts with `10-map/02` |
| `brioela-specs/29-food-cost-inflation-tracker.md` | `price_alert` table name vs map `alert_candidate` |
| `brioela-specs/03-hyperlocal-community-notes.md` | Deprecated — ranking uses Ground summaries |
| No implementation ledger for map | Build from build-guide 10 only |

# Draft count

**20** files in `draft/` — 19 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/10-map/` (00–06)
- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`
- `build-guide/17-menu-scanning/07-personalized-restaurant-discovery.md`
- `build-guide/01-design-system/05-skia-layers.md`
- `build-guide/09-ground/04-map-rendering.md`
- `_records/connections/05-map-connections.md`
- `_records/build-order/08-layer-map.md`
- `_records/session-log/010-map-complete.md`
- `_features/21-platform-notifications/spec.md`
- `_features/24-scanner/status.md`
- `_features/26-menu-scanning/status.md`
- `_features/27-ground/status.md`
