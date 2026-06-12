# Draft: record-intervention-event.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_helpers/record-intervention-event.helper.ts`

**Gap:** MiraSession does not forward derived intervention events to Brain.

**Source:** `brioela-specs/46-acoustic-cooking-intelligence.md`, `_features/29-cooking-session/spec.md` (Brain RPC pattern)

---

```typescript
import type { EvidenceSource } from '@brioela/shared/validator/acoustic-cooking/evidence.source.schema'
import type { Env } from '@/types/env'

export type RecordInterventionEventParams = {
  sessionId: string
  userId: string
  eventType: string
  confidence: number
  evidenceSource: EvidenceSource
  recipeStepOrder?: number | null
}

export async function recordInterventionEvent(
  env: Env,
  brainId: DurableObjectId,
  params: RecordInterventionEventParams,
): Promise<void> {
  const brain = env.BRIOELA_BRAIN.get(brainId)
  await brain.writeInterventionEvent(params)
}
```
