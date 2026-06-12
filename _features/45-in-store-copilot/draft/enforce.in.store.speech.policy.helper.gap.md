# Draft: enforce.in.store.speech.policy.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/enforce.in.store.speech.policy.helper.ts`

**Gap:** No 3-intervention cap + safety bypass (G17).

**Source:** `build-guide/32-in-store-copilot/03-speech-rules-and-swaps.md`, spec 45 silence rules

---

```typescript
import type { InStoreCopilotSituation } from '@/agents/mira/_scenes/build.in.store.copilot.mira.scene.helper'

export type SpeechInterventionKind =
  | 'user_question'
  | 'constraint_warning'
  | 'mesa_warning'
  | 'swap_suggestion'
  | 'ground_find_relay'
  | 'baseline_crossing'
  | 'degraded_mode'

export type SpeechDecision =
  | { speak: true; reason: SpeechInterventionKind }
  | { speak: false; reason: 'cap_reached' | 'already_mentioned' | 'evidence_bar_failed' }

const SAFETY_KINDS: SpeechInterventionKind[] = [
  'constraint_warning',
  'mesa_warning',
]

export function decideInStoreSpeech(
  situation: InStoreCopilotSituation,
  kind: SpeechInterventionKind,
): SpeechDecision {
  if (kind === 'user_question') {
    return { speak: true, reason: kind }
  }

  if (SAFETY_KINDS.includes(kind)) {
    return { speak: true, reason: kind }
  }

  if (kind === 'baseline_crossing' && situation.baselineMentioned) {
    return { speak: false, reason: 'already_mentioned' }
  }

  if (kind === 'ground_find_relay' && situation.groundFindRelayed) {
    return { speak: false, reason: 'already_mentioned' }
  }

  if (situation.unpromptedInterventionCount >= 3) {
    return { speak: false, reason: 'cap_reached' }
  }

  return { speak: true, reason: kind }
}

export function bumpInterventionCounter(
  situation: InStoreCopilotSituation,
  kind: SpeechInterventionKind,
): InStoreCopilotSituation {
  if (SAFETY_KINDS.includes(kind) || kind === 'user_question') {
    return situation
  }

  return {
    ...situation,
    unpromptedInterventionCount: situation.unpromptedInterventionCount + 1,
    baselineMentioned:
      kind === 'baseline_crossing' ? true : situation.baselineMentioned,
    groundFindRelayed:
      kind === 'ground_find_relay' ? true : situation.groundFindRelayed,
  }
}
```
