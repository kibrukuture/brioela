# Draft: build.daily.summary.helper.ts (gap — file does not exist)

Target: `mobile/features/wearables/helpers/build.daily.summary.helper.ts`

**Source:** `build-guide/20-wearables/02-client-aggregation.md`

---

```typescript
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'

type HealthKitBuildInput = {
  connectionId: string
  localDate: string
  timezone: string
  samples: unknown[]
}

export function buildDailySummaryFromHealthKit(
  input: HealthKitBuildInput,
): WearableDailySummary | null {
  void input.samples
  return {
    provider: 'apple_health',
    connectionId: input.connectionId,
    localDate: input.localDate,
    timezone: input.timezone,
    sleep: null,
    recovery: null,
    activity: null,
    glucose: null,
    generatedAt: Date.now(),
  }
}

type OuraBuildInput = {
  connectionId: string
  localDate: string
  timezone: string
  sleepJson: unknown
  readinessJson: unknown
}

export function buildDailySummaryFromOura(input: OuraBuildInput): WearableDailySummary | null {
  void input.sleepJson
  void input.readinessJson
  return {
    provider: 'oura',
    connectionId: input.connectionId,
    localDate: input.localDate,
    timezone: input.timezone,
    sleep: null,
    recovery: null,
    activity: null,
    glucose: null,
    generatedAt: Date.now(),
  }
}

export function computeHrvBaseline7d(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function computeHrvDelta(current: number, baseline: number): number {
  return Math.round((current - baseline) * 10) / 10
}
```

Full HealthKit/Oura field mapping implemented at connector integration time — helper owns derivation math only.
