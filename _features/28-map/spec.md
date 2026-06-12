# Healthy Food Map — Spec

Feature **28**. Mapbox base map, healthy place discovery, personalized ranking, product availability sightings, hyperlocal price alert candidate generation, Skia healthy-place layer, layer toggles (Ground overlay from **27**, menu-intel fit from **26**), place detail surface, and geo travel-cache display consumer (**35** pre-trip preload writes; **28** renders on arrival). Location autocomplete for address/place pickers is a separate, shipped path via LocationIQ — not the discovery map.

**Not in this feature:** Ground Find submission, authenticity gate, `find` / `location_signal_summary` tables (**27**); menu dish parsing, per-dish verdict assembly, shared menu intelligence write path (**26** — **28** reads summarized fit); product barcode scan and verdict UI (**24** — scan can create sightings); push delivery of `price_alert` / `map_nearby_opportunity` (**21**); travel intent detection and QStash preload jobs (**35**); Bela smart routing UI and shopper consent (**42** — consumes map tables); receipt private price history storage (**33** — feeds alert inputs); verified business onboarding UI (**46** — writes `verification_status`); Passport generation (**47**); Tonight dinner answer (**54** — separate notification kind); turn-by-turn navigation engine.

---

## Purpose

Someone with dietary constraints, allergies, or food preferences opens Brioela near a store, market, or restaurant → the map shows curated healthy places, recent product availability, and affordability signals sized and ranked for *their* profile — with optional Ground community observations (**27**) and menu-intelligence fit (**26**) as separate toggled layers on the same Mapbox base.

1. **Render** a 3D-capable Mapbox base with building extrusions, camera control, and attribution.
2. **Discover** nearby stores, restaurants, markets, and trusted businesses via `GET /api/map/nearby`.
3. **Rank** places with user-aware scoring — constraints first, then relevance, distance, open-now, Ground density, price/availability confidence.
4. **Record** product availability sightings from scans, receipts, and normalized Ground mentions.
5. **Track** price sightings and generate throttled `alert_candidate` rows for **21** delivery.
6. **Toggle** healthy places, Ground signals (**27**), and menu-intel overlays independently.
7. **Detail** place bottom sheets: health summary, products, price signals, Ground find list (via **27** API), actions (scan here, route, save).
8. **Consume** destination geo cache from **35** travel preload on arrival — switch map context without user setup.

Without **28**, scan "Map" follow-up (**24**), menu place overlay (**26**), Ground `location_id` FK (**27**), Bela routing (**42**), pantry store suggestions (**34**), and pre-trip arrival experience (**35**) lack place identity and nearby APIs.

---

## Product definition

| Term | Meaning |
|---|---|
| **Healthy food map** | Curated place/product discovery layer — health scores, sightings, price signals. Not community observations. |
| **Place** | A real-world venue in `map_place` — store, restaurant, market, stall, trusted business. |
| **Product sighting** | Normalized availability signal: product seen at place at time with confidence. Not a Ground Find. |
| **Price sighting** | Observed product price at a place — feeds ranking and alert candidates. |
| **Personalized ranking** | Per-user place ordering using constraints, memory, menu intel, Ground density — not one global score. |

**Design principle:** The map should feel alive — pulses, color, focused bottom sheets — not labeled pins on Google Maps. Do not over-label; use layers and relevance sizing.

**Explicitly not built** (spec constraint): turn-by-turn navigation inside Brioela (deep link to native maps only); delivery marketplace; promotional ad placement on map; merging `map_place_signal` with `location_signal_summary`.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/10-map/`, `brioela-specs/04-healthy-food-map.md`, `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`, `build-guide/17-menu-scanning/07-personalized-restaurant-discovery.md`, `backend/src/api/maps/`, `mobile/network/maps/`, neighbor `_features/21`, `24`, `26`, `27`, `35`, `42`.

| Component | Type | In **28**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Mapbox SDK + tokens** | Mobile + web config | **Yes** | No | Native RN integration + GL JS web | `01-mapbox-setup.md` |
| **`map_place` Supabase table** | Postgres | **Yes** | No | Place identity for all map layers | `02-map-data-model.md`, spec 04 |
| **`map_place_signal` table** | Postgres | **Yes** | No | Curated health/affordability scores | `02-map-data-model.md` |
| **`product_sighting` table** | Postgres | **Yes** | No | Availability with decay | `02-map-data-model.md`, `04-product-sightings.md` |
| **`price_sighting` table** | Postgres | **Yes** | No | Observed prices | `02-map-data-model.md`, `05-price-alerts.md` |
| **`alert_candidate` table** | Postgres | **Yes** | No | Pre-delivery opportunities | spec 15 |
| **`delivered_alert` table** | Postgres | **Yes** | No | Suppression / throttling log | spec 15 |
| **`GET /api/map/nearby`** | Hono handler | **Yes** | No | Viewport bbox + personalized rank | spec 04, `03-nearby-ranking-api.md` |
| **`GET /api/map/places/:id`** | Hono handler | **Yes** | No | Place detail + signals + sightings | spec 04 |
| **`POST /api/map/sightings`** | Hono handler | **Yes** | No | Create/update product sighting | spec 04 |
| **`POST /api/map/price-sightings`** | Hono handler | **Yes** | No | Record price observation | spec 15 |
| **`POST /api/alerts/evaluate`** | Hono handler | **Yes** | No | Generate alert candidates | spec 15 |
| **Geohash / S2 spatial index** | Backend query | **Yes** | No | Efficient bbox queries | spec 04 |
| **Personalized place ranking** | Backend helper | **Yes** | No | Hard constraint filter → score | `03-nearby-ranking-api.md`, `17/07` |
| **Menu-intel fit scoring** | Backend read | **Yes** consumer | No | Uses **26** shared restaurant intel | `17-menu-scanning/07-personalized-restaurant-discovery.md` |
| **Ground density input** | Backend read | Consumer | No | Reads **27** `location_signal_summary` | `03-nearby-ranking-api.md` |
| **Sighting decay / reconfirm** | Backend job | **Yes** | No | Stale availability drops confidence | `04-product-sightings.md` |
| **Price alert thresholds** | Backend helper | **Yes** | No | >15% increase / >10% decrease vs 90d | spec 15, `05-price-alerts.md` |
| **Healthy map Skia layer** | Mobile | **Yes** | No | Layer 4 dots — places, scores | `01-design-system/05-skia-layers.md` |
| **Layer toggles UI** | Mobile | **Yes** | No | Healthy / Ground / menu intel | `06-map-ui-layers.md` |
| **Place detail bottom sheet** | Mobile | **Yes** | No | Health, products, Ground list hook | `06-map-ui-layers.md` |
| **Travel destination cache read** | Mobile + Brain | Consumer | No | **35** writes Redis; **28** displays | spec 22, `18-ambient-intelligence/03` |
| **`GET /v1/maps/location-search`** | Hono handler | Partial | **Yes** | LocationIQ autocomplete — address picker | `backend/src/api/maps/` |
| **Ground signal layer** | **27** | Separate owner | No | Skia pulse dots on shared base | `09-ground/04-map-rendering.md` |
| **Push `price_alert`** | **21** | Delivery only | Partial kinds doc | **28** produces candidates | `_features/21-platform-notifications/spec.md` |
| **Push `map_nearby_opportunity`** | **21** | Delivery only | Doc only | Farmers market / health store discovery | spec 21 |
| **Scan → sighting** | **24** consumer | Integration | No | Scan with place match creates sighting | `07-scanner/04-scan-result-ui.md` |
| **Receipt → price sighting** | **33** consumer | Integration | No | Parsed receipt lines | `13-receipt-intelligence/05` |

### Shipped in repo today (map-related)

- `backend/src/api/maps/` — **location search only** (LocationIQ proxy), not healthy map.
- `shared/validators/location-search.validator.ts`, `shared/api/maps.routes.ts` — autocomplete contract.
- `mobile/network/maps/maps.api.ts`, `use-location-search.ts` — client for location search.
- Design system Skia Layer 4 spec (`01-design-system/05-skia-layers.md`) — docs only; covers Ground + healthy + sightings dots.
- Platform notifications (**21**) — documents `price_alert`, `map_nearby_opportunity` kinds; no map producers.
- **No** Mapbox dependency in repo (`rg Mapbox` — zero).
- **No** `map_place`, `product_sighting`, or price alert Drizzle schemas in `shared/drizzle/schema/`.
- **No** `GET /api/map/nearby`, place detail, sightings, or alert evaluate handlers.
- **No** `mobile/features/map/` healthy map UI.
- **No** map-specific tests.

---

## Architecture — discovery to alert

```text
Entry paths
  ├── User opens map tab / scan "Map" action (24)
  ├── Ambient map suggestion (35 app-open)
  ├── Travel arrival — destination cache active (35 → 28 display)
  ├── Price alert deep link (21 → place on map)
  └── Menu scan place overlay read (26 → 28 place APIs)

        │
        ▼
Mapbox base (28) — 3D style, camera, attribution
        │
        ├── Layer toggle: Healthy places (28)
        │     GET /api/map/nearby → map_place + map_place_signal
        │     + product_sighting confidence + menu intel fit (26 read)
        │     + Ground density (27 location_signal_summary read)
        │     + user constraint hard filters (07 via Brain RPC)
        │     → Skia healthy dots sized by personalized fit
        │
        ├── Layer toggle: Ground (27)
        │     GET /api/finds/nearby → summaries only
        │     → Skia Ground pulse layer (27 component)
        │
        └── Layer toggle: Menu intel highlights (28 UI, 26 data)
              restaurant_fit_summary overlay when available

Place tap
        │
        ▼
GET /api/map/places/:id
  ├── health scores, affordability, recency
  ├── recent product_sightings (decayed confidence)
  ├── price_sighting sparkline / delta
  ├── Ground finds list via GET /api/finds/locations/:id (27)
  └── actions: scan here, native maps route, save place

Sighting / price inputs
  ├── POST /api/scans/resolve with geo (24) → POST /api/map/sightings
  ├── Receipt parse (33) → price_sighting rows
  ├── Ground price Finds (27) → normalized price_sighting (async)
  └── User manual price report → POST /api/map/price-sightings

Alert pipeline (28 generates, 21 delivers)
        │
        ▼
POST /api/alerts/evaluate (cron or post-sighting)
  ├── prior user interest (Brain purchase/scan history)
  ├── price delta vs 90-day rolling average
  ├── availability confidence recent
  ├── geo proximity + suppression (delivered_alert)
  └── insert alert_candidate → queue price_alert / map_nearby_opportunity (21)
```

**Query rule:** `GET /api/map/nearby` must use geohash/S2 — no full-table geographic scans (`03-nearby-ranking-api.md`).

**Ranking rule:** Hard safety constraints filter first; map does not hide the world except on hard blocks. Irrelevant places rank lower / render smaller — same philosophy as Ground relevance sizing (35b Angle 1).

---

## Data contract

### Shared Supabase — `map_place`

| Field | Notes |
|---|---|
| `place_id` | uuid PK |
| `kind` | store \| restaurant \| market \| stall \| trusted_business |
| `name` | text |
| `lat`, `lng` | numeric |
| `geohash` | indexed for bbox queries |
| `verification_status` | unverified \| pending \| verified (**46** writes) |
| `address_json` | optional structured address |

### Shared Supabase — `map_place_signal`

| Field | Notes |
|---|---|
| `place_id` | FK → map_place |
| `healthy_score` | 0–1 curated quality |
| `community_score` | aggregate trust (disputes decrement — **42**) |
| `affordability_score` | price level signal |
| `recency_score` | data freshness |
| `updated_at` | timestamptz |

**Never merge with `location_signal_summary` (27).** Different truth types.

### Shared Supabase — `product_sighting`

| Field | Notes |
|---|---|
| `sighting_id` | uuid PK |
| `place_id` | FK |
| `product_id` | UPC / corpus id |
| `seen_at` | timestamptz |
| `reporter_user_id` | uuid — internal; not displayed on map |
| `confidence` | 0–1; decays unless reconfirmed |
| `first_seen_at` | for "new at location" signals |

### Shared Supabase — `price_sighting`

| Field | Notes |
|---|---|
| `price_sighting_id` | uuid PK |
| `product_id`, `place_id` | FKs |
| `amount`, `currency` | numeric + ISO code |
| `seen_at` | timestamptz |
| `reporter_user_id` | uuid |

### Shared Supabase — `alert_candidate` / `delivered_alert`

Per spec 15 — candidate queue before **21** push; delivery log for throttling.

---

## Ranking model

Inputs (from spec 04 + build-guide 03 + menu 07):

1. **Hard exclusions** — allergy, dietary identity mismatch, active boycott (**07**), medical food rules (**23**).
2. **Base place quality** — `map_place_signal.healthy_score`.
3. **Product relevance** — sightings matching user's scan/purchase memory.
4. **Distance** — user location or viewport center.
5. **Open-now** — when hours data available.
6. **Ground find density** — `location_signal_summary.active_count` at place (**27** read).
7. **Menu intel fit** — green/yellow/red dish counts from **26** shared intel when `restaurantId` linked.
8. **Price / availability confidence** — recent `price_sighting` + `product_sighting.confidence`.
9. **Affordability** — `map_place_signal.affordability_score`.

Personalized restaurant discovery (`17-menu-scanning/07`) defines the **scoring shape**; **28** implements map-scale query and render. **26** supplies shared menu facts; **28** never stores raw menu text.

```typescript
type PersonalizedPlaceScore = {
  placeId: string
  hardExcluded: boolean
  fitScore: number
  healthyScore: number
  menuFitScore: number | null
  groundDensityScore: number
  distanceScore: number
  affordabilityScore: number
  explanation: string
}
```

Default map behavior: show best-fit places first; size/highlight by fit; suppress poor matches unless "show all"; explain recommendations in place cards.

---

## Layer model

From `06-map-ui-layers.md` + design Layer 4:

| Layer | Owner | Data source | Visual |
|---|---|---|---|
| 1. Base Mapbox style | **28** | Mapbox tiles | 3D buildings |
| 2. Healthy places / products | **28** | map_place_signal, sightings | Skia dots — health color, fit-sized |
| 3. Ground signals | **27** | location_signal_summary | Skia pulse — type color, freshness |
| 4. User location | **28** | device GPS | standard puck |
| 5. Alert / opportunity hints | **28** UI | alert_candidate geo | subtle highlight — not push |

Layer toggles are independent. Both food intelligence layers share one Mapbox `MapView`; Skia canvases overlay per layer.

---

## API surface

| Method | Path | Role |
|---|---|---|
| GET | `/api/map/nearby` | Bbox/radius query, ranked places + summary signals |
| GET | `/api/map/places/:id` | Place detail, sightings, scores, menu fit preview |
| POST | `/api/map/sightings` | Create/reconfirm product sighting |
| POST | `/api/map/price-sightings` | Record price observation |
| POST | `/api/alerts/evaluate` | Batch evaluate alert candidates (internal/cron) |
| GET | `/v1/maps/location-search` | **Shipped** — LocationIQ autocomplete (not discovery map) |

Ground APIs (`/api/finds/*`) owned by **27** — place detail sheet calls them for find lists.

---

## Entry points

| Path | Trigger | Behavior |
|---|---|---|
| **Map tab** | Primary navigation | Full layer stack + toggles |
| **Scan result "Map"** | **24** follow-up | Fly to geoHash bbox; filter products/places near scan |
| **Menu scan overlay** | **26** when `restaurantId` | Read place + Ground summary lines — no raw finds |
| **Price alert tap** | **21** push | Deep link to place on map |
| **Travel arrival** | **35** cache hit | Default map context = destination city |
| **Bela routing** | **42** | Reads sightings/signals — no map UI |
| **Share classifier** | **25** `map_place` route | Opens place detail / save to map memory |

---

## Tier gates

From `19-pricing-and-tiers.md` + `25-pricing-tiers/02-tier-entitlements.md`:

| Tier | Map access |
|---|---|
| **Sapor (free)** | Read-only glimpses of map/community where available |
| **Luma** | Full healthy map, geo-scoped alerts, community notes visibility |
| **Verified business add-on** | `verification_status` + map listing badge (**46**) |

Geo-scoped **price alerts** require Luma. Basic place browse may remain visible at Sapor tier per entitlements doc.

---

## Privacy model

- `product_sighting.reporter_user_id` and `price_sighting.reporter_user_id` are internal — never shown on public map.
- Personalized ranking uses Brain private profile via RPC — scores are per-user; shared tables hold no PII.
- Travel geo cache (**35**) is user-scoped in Redis — **28** reads only requesting user's cache.
- Aggregate anonymized price trends may feed nearby cheaper-store suggestions (spec 29 / receipt guide) — personal receipt history stays in Brain DO (**33**).

---

## Notification surfaces (producer contract)

From **21** — **28** produces; **21** delivers:

| Kind | Trigger | Priority |
|---|---|---|
| `price_alert` | Price delta crosses threshold near user | Medium; geo timing |
| `map_nearby_opportunity` | New high-fit place discovered (e.g. farmers market) | Medium; geo |
| `travel_preload_ready` | **35** owns detection; map is deep-link target | High/quiet — **35** producer |

---

## Success metrics

From spec 04 + spec 15:

- Nearby result clickthrough rate
- Place revisit rate
- Density of active sightings per city
- Alert open rate and alert-to-map conversion
- Repeat sighting contribution rate

---

## 28 vs neighbor boundaries

| In **28** (this feature) | In separate feature |
|---|---|
| Mapbox base + tokens + style | Ground Find tables + gate — **27** |
| map_place, map_place_signal, sightings, price tables | Find submission + pulse rendering — **27** |
| GET /api/map/nearby, place detail | GET /api/finds/* — **27** |
| Personalized healthy place ranking | Dish-level menu verdicts — **26** |
| Menu-intel fit **read** for ranking | Shared menu intelligence **write** — **26** |
| Product sighting from scan hook | Product scan verdict — **24** |
| alert_candidate generation | Push delivery — **21** |
| Private receipt price history | Receipt parse + Brain storage — **33** |
| Display travel geo cache | Travel intent + preload jobs — **35** |
| Smart routing data consumer | Bela order/shopper UI — **42** |
| verification_status field | Verified profile onboarding — **46** |
| LocationIQ location search | — (shipped sub-path of maps API) |

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_records/session-log/010-map-complete.md` | Build-guide docs only — zero Mapbox / map_place production |
| `build-guide/02-coding-standards/07-data-layer-drizzle.md` | Example `product_sightings` schema uses `storeId`, `geohash` — differs from `10-map/02` (`place_id`, `confidence`, decay) |
| `brioela-specs/29-food-cost-inflation-tracker.md` | Names `price_alert` table — map uses `alert_candidate` + `delivered_alert`; inflation tracker is **33** private history + **28** shared sightings |
| `brioela-specs/03-hyperlocal-community-notes.md` | Deprecated — community density in ranking now means Ground summaries (**27**) |
| `brioela-specs/22-pre-trip-food-intelligence.md` | Says "community notes" — Ground Finds replace; preload owned by **35**, display by **28** |
| `build-guide/17-menu-scanning/07-personalized-restaurant-discovery.md` | Ranking **logic** doc — implementation owner is **28**, intel supplier is **26**; not a duplicate feature |
| LocationIQ vs Mapbox | Autocomplete (shipped) ≠ map rendering (unshipped) — different providers, same "maps" API folder |
| **27** `mobile.ground-map.feature.gap.md` | Owns Ground layer on shared MapView; healthy layer placeholder explicitly **28** |

---

## Sources

- `build-guide/10-map/` (00–06)
- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/15-hyperlocal-price-and-availability-alerts.md`
- `brioela-specs/22-pre-trip-food-intelligence.md` (display consumer boundary)
- `brioela-specs/29-food-cost-inflation-tracker.md` (price alert input boundary)
- `build-guide/01-design-system/05-skia-layers.md`
- `build-guide/09-ground/04-map-rendering.md` (shared base boundary)
- `build-guide/17-menu-scanning/05-storage-offline-map.md`, `07-personalized-restaurant-discovery.md`
- `build-guide/07-scanner/04-scan-result-ui.md`
- `build-guide/13-receipt-intelligence/05-price-history-and-alerts.md`
- `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `implementable-specs/bela/08-smart-routing.md`
- `_records/connections/05-map-connections.md`
- `_records/build-order/08-layer-map.md`
- `_records/session-log/010-map-complete.md`
- `_features/21-platform-notifications/spec.md`
- `_features/24-scanner/status.md`
- `_features/26-menu-scanning/spec.md`
- `_features/27-ground/spec.md`
