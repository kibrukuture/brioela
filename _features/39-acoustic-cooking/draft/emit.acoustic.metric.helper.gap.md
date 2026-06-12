# Draft: emit-acoustic-metric.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/acoustic/emit-acoustic-metric.helper.ts`

**Gap:** No acoustic false-positive / useful-intervention metrics.

**Source:** `build-guide/33-acoustic-cooking/03-intervention-events.md` § Metrics, `brioela-specs/46-acoustic-cooking-intelligence.md` Success Metrics

---

```typescript
export type AcousticMetricName =
  | 'acoustic_intervention_useful'
  | 'acoustic_intervention_false_positive'
  | 'acoustic_step_confirmed'
  | 'acoustic_step_confirmed_rejected'

export type EmitAcousticMetricParams = {
  userId: string
  sessionId: string
  metric: AcousticMetricName
  eventType?: string
  dismissedWithinMs?: number
}

export function emitAcousticMetric(params: EmitAcousticMetricParams): void {
  console.log(
    JSON.stringify({
      kind: 'acoustic_cooking_metric',
      ...params,
      at: Date.now(),
    }),
  )
}

export function isAcousticFalsePositive(dismissedWithinMs: number): boolean {
  return dismissedWithinMs <= 2_000
}
```
