# Wearables — Client Aggregation

## What This File Covers

How the mobile client turns raw wearable data into small daily summaries before anything reaches the Brain DO.

---

## Core Rule

Never stream raw sensor data to the Brain DO.

Raw wearable data is too frequent, too sensitive, and too noisy. The client reads provider data locally, derives food-relevant summaries, and sends compact JSON.

---

## Daily Summary Shape

```typescript
type WearableDailySummary = {
  provider: "apple_health" | "oura" | "health_connect" | "dexcom" | "abbott" | "whoop" | "withings"
  connectionId: string
  localDate: string
  timezone: string
  sleep: {
    durationMin: number | null
    efficiency: number | null
    deepMin: number | null
    remMin: number | null
    qualityScore: number | null
  } | null
  recovery: {
    readinessScore: number | null
    hrvAvgMs: number | null
    hrvBaseline7d: number | null
    hrvDelta: number | null
    restingHrBpm: number | null
    temperatureDeviationC: number | null
  } | null
  activity: {
    steps: number | null
    activeEnergyKcal: number | null
    workoutMinutes: number | null
  } | null
  glucose: {
    fastingMgdl: number | null
    dailyMeanMgdl: number | null
    timeAboveRangeMin: number | null
  } | null
  generatedAt: number
}
```

Target size: about 500 bytes when sparse, still small when all sections are present.

---

## Sync Timing

Sync daily summaries when:

- app opens
- app returns to foreground
- platform background task runs successfully
- user taps sync in Connected Devices

Do not assume background tasks run reliably on every platform. The first robust path is app-open sync.

---

## Client-Side Derivation

The client can derive:

- 7-day HRV baseline
- HRV delta from baseline
- sleep quality score if provider does not supply one
- temperature deviation trend
- daily activity summary
- glucose daily summary

The server should trust only validated schemas, not raw client claims. But it should avoid asking for raw readings unless the CGM meal-window flow explicitly requires short-window readings.

---

## Upload Endpoint

```typescript
// POST /api/wearables/daily-summary
type WearableDailySummaryRequest = {
  summaries: WearableDailySummary[]
}

type WearableDailySummaryResponse = {
  accepted: number
  rejected: Array<{
    connectionId: string
    localDate: string
    reason: string
  }>
}
```

The endpoint forwards accepted summaries to the user's Brain DO for memory routing.

---

## Validation

Validate at the boundary:

- provider is connected
- user owns connection
- granted data types include submitted fields
- date is not too far in future
- values are plausible ranges
- duplicate summaries are idempotent updates

Reject invalid fields, not necessarily the whole summary. For example, invalid blood oxygen should not discard sleep duration.

---

## No Analytics Copy

Wearable summaries are not app analytics.

Do not pipe them into generic event tracking. Do not send them to product analytics, crash logs, or shared tables. They go to Brain DO only.
