# Draft: surface.ambient.candidate.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/surface.ambient.candidate.helper.ts`

**Gap (feature 35):** Pick candidate for surface moment; audit; suppression check.

**Source:** `build-guide/18-ambient-intelligence/06-surfacing-and-privacy.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { AmbientCandidateKind } from '@/agents/brain/_schemas/ambient.candidate.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export type AmbientSurfaceRequest = {
  userId: string
  kind: AmbientCandidateKind
  surface: 'conversation' | 'scan_inline' | 'recipe_open' | 'weekly_summary' | 'push'
  entityId?: string
}

export type AmbientSurfaceResult =
  | { surfaced: false; reason: 'suppressed' | 'none_eligible' | 'budget_exhausted' }
  | { surfaced: true; candidateId: string; copy: string }

export async function surfaceAmbientCandidate(
  database: BrainDatabase,
  request: AmbientSurfaceRequest,
): Promise<AmbientSurfaceResult> {
  const now = readCurrentEpochMs()

  // TODO: check ambient_suppression for family mapped from kind
  // TODO: pattern interventions — weekly budget (max 1 new / 7d)
  // TODO: time_machine — never push when surface === 'push'
  // TODO: select highest confidence candidate matching surface + entityId
  // TODO: write audit: candidateId, surface, copy, surfacedAt
  // TODO: update candidate status surfaced

  void now
  return { surfaced: false, reason: 'none_eligible' }
}

export async function recordAmbientDismissal(
  database: BrainDatabase,
  userId: string,
  family: 'patterns' | 'travel' | 'time_machine' | 'guest_mode',
): Promise<void> {
  // Increment dismissedCount; apply 14d / permanent rules
}
```

Push path delegates to **21** `send-push` only for `travel_preload` family.
