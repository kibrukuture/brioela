# Draft: derive.glucose.window.metrics.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/derive.glucose.window.metrics.helper.ts`

**Source:** `build-guide/20-wearables/04-cgm-food-response.md`

Raw readings passed in memory only — not persisted after derivation (G23).

---

```typescript
import type { GlucoseWindowReading } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'

export type GlucoseWindowDerivedMetrics = {
  baselineMgdl: number | null
  peakMgdl: number | null
  peakTimeMin: number | null
  auc: number | null
  returnToBaselineMin: number | null
  readingCount: number
  confidence: number
  attributionFlags: string[]
}

type DeriveInput = {
  readings: GlucoseWindowReading[]
  multipleFoodsInWindow: boolean
  workoutDuringWindow: boolean
  scanLikelyEating: boolean
}

export function deriveGlucoseWindowMetrics(input: DeriveInput): GlucoseWindowDerivedMetrics {
  const { readings } = input
  const readingCount = readings.length

  if (readingCount < 3) {
    return {
      baselineMgdl: readings[0]?.glucoseMgdl ?? null,
      peakMgdl: null,
      peakTimeMin: null,
      auc: null,
      returnToBaselineMin: null,
      readingCount,
      confidence: 0.2,
      attributionFlags: ['sparse_readings'],
    }
  }

  const sorted = [...readings].sort((a, b) => a.relativeMinute - b.relativeMinute)
  const baselineMgdl = sorted[0]?.glucoseMgdl ?? null
  let peak = sorted[0]
  for (const r of sorted) {
    if (r.glucoseMgdl > peak.glucoseMgdl) peak = r
  }

  let auc = 0
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const dt = curr.relativeMinute - prev.relativeMinute
    auc += ((prev.glucoseMgdl + curr.glucoseMgdl) / 2) * dt
  }

  let returnToBaselineMin: number | null = null
  if (baselineMgdl != null) {
    const threshold = baselineMgdl + 10
    for (const r of sorted) {
      if (r.relativeMinute > peak.relativeMinute && r.glucoseMgdl <= threshold) {
        returnToBaselineMin = r.relativeMinute
        break
      }
    }
  }

  const attributionFlags: string[] = []
  if (input.multipleFoodsInWindow) attributionFlags.push('multiple_foods')
  if (input.workoutDuringWindow) attributionFlags.push('workout_during_window')
  if (!input.scanLikelyEating) attributionFlags.push('scan_not_eating')
  if (baselineMgdl == null) attributionFlags.push('missing_baseline')

  let confidence = 0.75
  if (attributionFlags.length > 0) confidence = Math.max(0.2, confidence - 0.15 * attributionFlags.length)
  if (readingCount < 5) confidence = Math.min(confidence, 0.55)

  return {
    baselineMgdl,
    peakMgdl: peak.glucoseMgdl,
    peakTimeMin: peak.relativeMinute,
    auc,
    returnToBaselineMin,
    readingCount,
    confidence,
    attributionFlags,
  }
}
```
