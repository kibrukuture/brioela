# Draft: extract-intervention-events-from-transcript.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/acoustic/extract-intervention-events-from-transcript.helper.ts`

**Gap:** Fallback path for **40** growth mirror when live `vision_event` writes missed.

**Source:** `brioela-specs/53-growth-mirror.md` § How the Trajectory Builds, `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`

---

```typescript
import type { EvidenceSource } from '@brioela/shared/validator/acoustic-cooking/evidence.source.schema'
import { ACOUSTIC_INTERVENTION_EVENT_TYPES } from '@/agents/mira/_constants/intervention.event.types'

export type ExtractedInterventionEvent = {
  eventType: string
  evidenceSource: EvidenceSource
  confidence: number
  excerpt: string
}

const ACOUSTIC_PHRASE_HINTS: Record<string, string[]> = {
  heat_warning: ['sounds too hot', 'pan sounds too hot', 'too hot before'],
  boil_over_warning: ['about to boil over', 'boil over', 'boiling over'],
  burning_onset: ['starting to burn', 'burning', 'scorching'],
  abnormal_silence: ['lose heat', 'pan lose heat', 'gone quiet'],
  step_confirmed: ['sounds right', 'that sounds done', 'whistle'],
}

export function extractInterventionEventsFromTranscript(
  transcript: string,
  sessionHadVision: boolean,
): ExtractedInterventionEvent[] {
  const normalized = transcript.toLowerCase()
  const results: ExtractedInterventionEvent[] = []

  for (const eventType of ACOUSTIC_INTERVENTION_EVENT_TYPES) {
    const hints = ACOUSTIC_PHRASE_HINTS[eventType] ?? []
    const match = hints.find((hint) => normalized.includes(hint))
    if (!match) continue

    results.push({
      eventType,
      evidenceSource: sessionHadVision ? 'fused' : 'acoustic',
      confidence: 0.6,
      excerpt: match,
    })
  }

  return results
}
```
