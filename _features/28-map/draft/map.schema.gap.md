# Gap snapshot: map.schema.ts

Target: `shared/validator/map.schema.ts`

**Status:** Not in repo. From `brioela-specs/04-healthy-food-map.md`, `build-guide/10-map/02-map-data-model.md`.

```typescript
import { z } from '@brioela/shared/zod'

export const MapPlaceKindSchema = z.enum([
  'store',
  'restaurant',
  'market',
  'stall',
  'trusted_business',
])

export const VerificationStatusSchema = z.enum([
  'unverified',
  'pending',
  'verified',
])

export const MapPlaceSchema = z.object({
  placeId: z.string().uuid(),
  kind: MapPlaceKindSchema,
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  geohash: z.string().min(1),
  verificationStatus: VerificationStatusSchema,
  addressJson: z.record(z.unknown()).nullable(),
})

export const MapPlaceSignalSchema = z.object({
  placeId: z.string().uuid(),
  healthyScore: z.number().min(0).max(1),
  communityScore: z.number().min(0).max(1),
  affordabilityScore: z.number().min(0).max(1),
  recencyScore: z.number().min(0).max(1),
  updatedAt: z.string().datetime(),
})

export const ProductSightingSchema = z.object({
  sightingId: z.string().uuid(),
  placeId: z.string().uuid(),
  productId: z.string().min(1),
  seenAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  firstSeenAt: z.string().datetime().nullable(),
})

export const PriceSightingSchema = z.object({
  priceSightingId: z.string().uuid(),
  productId: z.string().min(1),
  placeId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  seenAt: z.string().datetime(),
})

export const MapNearbyQuerySchema = z.object({
  minLat: z.coerce.number(),
  minLng: z.coerce.number(),
  maxLat: z.coerce.number(),
  maxLng: z.coerce.number(),
  zoom: z.coerce.number().optional(),
  kinds: z.array(MapPlaceKindSchema).optional(),
  openNow: z.coerce.boolean().optional(),
  showAll: z.coerce.boolean().optional(),
  layers: z
    .object({
      healthy: z.boolean().optional(),
      ground: z.boolean().optional(),
      menuIntel: z.boolean().optional(),
    })
    .optional(),
})

export const RankedPlaceSchema = MapPlaceSchema.extend({
  signal: MapPlaceSignalSchema,
  personalizedScore: z.number(),
  hardExcluded: z.boolean(),
  renderedDotSize: z.number(),
  explanation: z.string(),
  menuFitScore: z.number().nullable(),
  groundDensityScore: z.number(),
  distanceMeters: z.number().nullable(),
})

export const MapNearbyResponseSchema = z.object({
  places: z.array(RankedPlaceSchema),
  bbox: z.object({
    minLat: z.number(),
    minLng: z.number(),
    maxLat: z.number(),
    maxLng: z.number(),
  }),
})

export const PlaceDetailSchema = z.object({
  place: MapPlaceSchema,
  signal: MapPlaceSignalSchema,
  sightings: z.array(ProductSightingSchema),
  recentPrices: z.array(PriceSightingSchema),
  menuFitPreview: z
    .object({
      greenCount: z.number(),
      yellowCount: z.number(),
      redCount: z.number(),
      clarityLabel: z.enum(['clear', 'mixed', 'unclear']),
      priceLabel: z.enum(['low', 'medium', 'high', 'unknown']),
      bestDishes: z.array(
        z.object({
          dishName: z.string(),
          verdict: z.enum(['green', 'yellow', 'red']),
          shortReason: z.string(),
        }),
      ),
    })
    .nullable(),
  groundSummaryLines: z.array(z.string()),
})

export const CreateSightingRequestSchema = z.object({
  placeId: z.string().uuid(),
  productId: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0.8),
  seenAt: z.string().datetime().optional(),
})

export const CreatePriceSightingRequestSchema = z.object({
  placeId: z.string().uuid(),
  productId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  seenAt: z.string().datetime().optional(),
})
```

**Note:** Ground find rows are **27** schemas — not duplicated here. Place detail returns `groundSummaryLines` from summarized **27** read.
