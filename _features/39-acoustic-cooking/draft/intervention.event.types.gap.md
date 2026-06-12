# Draft: intervention.event.types.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_constants/intervention.event.types.ts`

**Gap:** No shared intervention event type constants for acoustic + vision coach.

**Source:** `build-guide/33-acoustic-cooking/03-intervention-events.md`, `brioela-specs/46-acoustic-cooking-intelligence.md`

---

```typescript
export const ACOUSTIC_INTERVENTION_EVENT_TYPES = [
  'heat_warning',
  'boil_over_warning',
  'burning_onset',
  'step_confirmed',
  'abnormal_silence',
] as const

export type AcousticInterventionEventType =
  (typeof ACOUSTIC_INTERVENTION_EVENT_TYPES)[number]

export const SHARED_INTERVENTION_EVENT_TYPES = [
  ...ACOUSTIC_INTERVENTION_EVENT_TYPES,
  'technique_note',
  'generic_intervention',
] as const

export type InterventionEventType = (typeof SHARED_INTERVENTION_EVENT_TYPES)[number]

export function isAcousticInterventionEventType(
  eventType: string,
): eventType is AcousticInterventionEventType {
  return (ACOUSTIC_INTERVENTION_EVENT_TYPES as readonly string[]).includes(eventType)
}
```
