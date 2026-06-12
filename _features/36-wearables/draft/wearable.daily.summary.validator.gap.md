# Draft: shared/validator/wearables/*.schema.ts (gap — files do not exist)

Target:
- `shared/validator/wearables/wearable.daily.summary.schema.ts`
- `shared/validator/wearables/wearable.connection.schema.ts`
- `shared/validator/wearables/glucose.window.schema.ts`

**Source:** `build-guide/20-wearables/02-client-aggregation.md`, `04-cgm-food-response.md`

---

```typescript
import { z } from 'zod'

export const wearableProviderSchema = z.enum([
  'apple_health',
  'oura',
  'health_connect',
  'dexcom',
  'abbott',
  'whoop',
  'withings',
])

export const wearableDataTypeSchema = z.enum([
  'sleep',
  'hrv',
  'resting_heart_rate',
  'activity',
  'body_temperature_deviation',
  'blood_oxygen',
  'weight',
  'glucose',
])

export const wearableSleepSectionSchema = z.object({
  durationMin: z.number().int().min(0).max(1200).nullable(),
  efficiency: z.number().min(0).max(1).nullable(),
  deepMin: z.number().int().min(0).nullable(),
  remMin: z.number().int().min(0).nullable(),
  qualityScore: z.number().min(0).max(100).nullable(),
})

export const wearableRecoverySectionSchema = z.object({
  readinessScore: z.number().min(0).max(100).nullable(),
  hrvAvgMs: z.number().min(0).max(300).nullable(),
  hrvBaseline7d: z.number().min(0).max(300).nullable(),
  hrvDelta: z.number().min(-200).max(200).nullable(),
  restingHrBpm: z.number().int().min(30).max(220).nullable(),
  temperatureDeviationC: z.number().min(-5).max(5).nullable(),
})

export const wearableActivitySectionSchema = z.object({
  steps: z.number().int().min(0).nullable(),
  activeEnergyKcal: z.number().min(0).nullable(),
  workoutMinutes: z.number().int().min(0).nullable(),
})

export const wearableGlucoseDailySectionSchema = z.object({
  fastingMgdl: z.number().min(40).max(400).nullable(),
  dailyMeanMgdl: z.number().min(40).max(400).nullable(),
  timeAboveRangeMin: z.number().int().min(0).nullable(),
})

export const wearableDailySummarySchema = z.object({
  provider: wearableProviderSchema,
  connectionId: z.string().uuid(),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  sleep: wearableSleepSectionSchema.nullable(),
  recovery: wearableRecoverySectionSchema.nullable(),
  activity: wearableActivitySectionSchema.nullable(),
  glucose: wearableGlucoseDailySectionSchema.nullable(),
  generatedAt: z.number().int().positive(),
})

export const wearableDailySummaryRequestSchema = z.object({
  summaries: z.array(wearableDailySummarySchema).min(1).max(7),
})

export const wearableDailySummaryResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.array(
    z.object({
      connectionId: z.string(),
      localDate: z.string(),
      reason: z.string(),
    }),
  ),
})

export const glucoseWindowReadingSchema = z.object({
  relativeMinute: z.number().int().min(0).max(180),
  glucoseMgdl: z.number().min(40).max(400),
})

export const glucoseWindowReadingsRequestSchema = z.object({
  windowId: z.string().uuid(),
  readings: z.array(glucoseWindowReadingSchema).min(1).max(12),
})

export type WearableDailySummary = z.infer<typeof wearableDailySummarySchema>
export type GlucoseWindowReading = z.infer<typeof glucoseWindowReadingSchema>
```
