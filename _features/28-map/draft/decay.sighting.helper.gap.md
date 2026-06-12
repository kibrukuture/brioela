# Gap snapshot: decay.sighting.helper.ts

Target: `backend/src/api/map/_helpers/decay.sighting.helper.ts`

**Status:** Not in repo. From `build-guide/10-map/04-product-sightings.md`.

```typescript
type SightingRow = {
  sightingId: string
  placeId: string
  productId: string
  seenAt: string
  confidence: number
  firstSeenAt: string | null
}

const DECAY_HALF_LIFE_DAYS = 14
const MIN_CONFIDENCE = 0.05

export function applySightingDecay(row: SightingRow): SightingRow {
  const seenAtMs = Date.parse(row.seenAt)
  const ageDays = (Date.now() - seenAtMs) / (1000 * 60 * 60 * 24)
  const decayFactor = Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS)
  const decayedConfidence = Math.max(MIN_CONFIDENCE, row.confidence * decayFactor)

  return {
    ...row,
    confidence: decayedConfidence,
  }
}

export function shouldHideFromMap(confidence: number): boolean {
  return confidence < 0.2
}

/** Called by map-decay-sightings.job.ts — optional DB sweep */
export function computeDecayForAge(baseConfidence: number, ageDays: number): number {
  const decayFactor = Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS)
  return Math.max(MIN_CONFIDENCE, baseConfidence * decayFactor)
}
```

**Rule:** old sightings must not show product as confidently available (`04-product-sightings.md`).
