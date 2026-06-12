# Draft index — 28-map

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `map.schema.gap.md` | `shared/validator/map.schema.ts` | **01** shared package |
| `map.place.schema.gap.md` | `shared/drizzle/schema/map.place.schema.ts` | Supabase migration |
| `map.place.signal.schema.gap.md` | `shared/drizzle/schema/map.place.signal.schema.ts` | `map_place` FK |
| `product.sighting.schema.gap.md` | `shared/drizzle/schema/product.sighting.schema.ts` | `map_place` FK |
| `price.sighting.schema.gap.md` | `shared/drizzle/schema/price.sighting.schema.ts` | `map_place` FK |
| `alert.candidate.schema.gap.md` | `shared/drizzle/schema/alert.candidate.schema.ts` | price/sighting tables |
| `get.nearby.handler.gap.md` | `backend/src/api/map/_handlers/get.nearby.handler.ts` | schemas, geo helper |
| `get.place.handler.gap.md` | `backend/src/api/map/_handlers/get.place.handler.ts` | schemas |
| `post.sighting.handler.gap.md` | `backend/src/api/map/_handlers/post.sighting.handler.ts` | schemas, decay helper |
| `post.price.sighting.handler.gap.md` | `backend/src/api/map/_handlers/post.price.sighting.handler.ts` | schemas |
| `evaluate.alerts.handler.gap.md` | `backend/src/api/map/_handlers/evaluate.alerts.handler.ts` | alert generator |
| `rank.places.helper.gap.md` | `backend/src/api/map/_helpers/rank.places.helper.ts` | Brain RPC, **26**/**27** reads |
| `decay.sighting.helper.gap.md` | `backend/src/api/map/_helpers/decay.sighting.helper.ts` | drizzle schemas |
| `generate.alert.candidates.helper.gap.md` | `backend/src/api/map/_helpers/generate.alert.candidates.helper.ts` | price history |
| `mapbox.config.gap.md` | `mobile/features/map/config/mapbox.config.ts` | EAS env, Mapbox token |
| `mobile.healthy-map.feature.gap.md` | `mobile/features/map/components/healthy-map.feature.tsx` | Mapbox SDK, network |
| `healthy-signal-layer.gap.md` | `mobile/features/map/components/healthy-signal-layer.tsx` | Skia, nearby API |
| `place-detail.sheet.gap.md` | `mobile/features/map/components/place-detail.sheet.tsx` | place API, **27** find list |
| `use.healthy.map.hook.gap.md` | `mobile/features/map/hooks/use.healthy.map.hook.ts` | get-nearby API |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **27** | `_features/27-ground/draft/mobile.ground-map.feature.gap.md` — Ground layer on shared MapView |
| **27** | `_features/27-ground/draft/ground.signal.layer.gap.md` — pulse dots |
| **26** | `_features/26-menu-scanning/draft/mobile.menu-scanning.feature.gap.md` — place overlay read |
| **24** | `_features/24-scanner/draft/` — scan "Map" + sighting create |

## Shipped (not in draft/)

| Path | Note |
|---|---|
| `backend/src/api/maps/handlers/location-search.handler.ts` | LocationIQ autocomplete — not discovery map |
| `shared/validators/location-search.validator.ts` | Autocomplete contract |
| `mobile/network/maps/maps.api.ts` | Client for location search |

**Total in this folder:** 20 files (19 gap + this index).
