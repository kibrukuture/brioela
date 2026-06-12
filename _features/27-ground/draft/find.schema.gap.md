# Gap snapshot: find.schema.ts

Target: `shared/validator/find.schema.ts`

**Status:** Not in repo. From `build-guide/09-ground/01-find-data-model.md`, `02-authenticity-gate.md`, `brioela-specs/35`.

```typescript
import { z } from 'zod'

export const FindSignalTypeSchema = z.enum([
  'health',
  'ingredient',
  'price',
  'new_product',
  'general',
])

export const FindStatusSchema = z.enum(['active', 'stale', 'archived', 'removed'])

export const FindGateCheckSchema = z.object({
  check: z.enum([
    'specificity',
    'no_promotion',
    'no_negativity_targeting',
    'freshness_plausibility',
    'no_personal_information',
    'face_detection',
    'minimum_information_density',
  ]),
  passed: z.boolean(),
  reason: z.string().nullable(),
})

export const FindGateResultSchema = z.object({
  passed: z.boolean(),
  checks: z.array(FindGateCheckSchema),
  rejectionReason: z.string().nullable(),
})

export const CreateFindRequestSchema = z.object({
  locationId: z.string().uuid(),
  signalType: FindSignalTypeSchema,
  content: z.string().min(1).max(280),
  mediaUrls: z.array(z.string().url()).max(3).optional(),
  capturedAt: z.string().datetime(),
  source: z.enum(['manual', 'voice', 'scan_draft', 'map', 'bela_shopper']),
  draftFromScanId: z.string().uuid().nullable().optional(),
})

export const FindSchema = z.object({
  findId: z.string().uuid(),
  locationId: z.string().uuid(),
  signalType: FindSignalTypeSchema,
  content: z.string(),
  mediaUrls: z.array(z.string()).nullable(),
  capturedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  status: FindStatusSchema,
  gatePassed: z.boolean(),
})

export const FindNearbyQuerySchema = z.object({
  minLat: z.coerce.number(),
  minLng: z.coerce.number(),
  maxLat: z.coerce.number(),
  maxLng: z.coerce.number(),
  signalTypes: z.array(FindSignalTypeSchema).optional(),
})

export const LocationSignalSummarySchema = z.object({
  locationId: z.string().uuid(),
  signalType: FindSignalTypeSchema,
  activeCount: z.number().int().min(0),
  lastFindAt: z.string().datetime().nullable(),
  relevanceScore: z.number().min(0).max(1).optional(),
  renderedDotSize: z.number().positive().optional(),
})

export const FindDraftFromScanSchema = z.object({
  draftId: z.string().uuid(),
  content: z.string().max(280),
  signalType: FindSignalTypeSchema,
  locationId: z.string().uuid(),
  locationName: z.string(),
  productName: z.string().nullable(),
  scanVerdictLevel: z.enum(['green', 'yellow']).nullable(),
})

export const ReportFindSchema = z.object({
  reason: z.enum(['spam', 'false', 'harmful', 'other']),
  detail: z.string().max(500).optional(),
})

export type FindSignalType = z.infer<typeof FindSignalTypeSchema>
export type CreateFindRequest = z.infer<typeof CreateFindRequestSchema>
export type Find = z.infer<typeof FindSchema>
export type LocationSignalSummary = z.infer<typeof LocationSignalSummarySchema>
export type FindDraftFromScan = z.infer<typeof FindDraftFromScanSchema>
export type FindGateResult = z.infer<typeof FindGateResultSchema>
```
