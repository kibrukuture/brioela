# Draft: review.guest.session.archive.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/review.guest.session.archive.helper.ts`

**Gap (feature 35):** Weekly `guest_review` pass — promote recurring constraint patterns to `social.cooking_patterns` memory.

**Source:** `brioela-specs/37-guest-and-cooking-for-others.md`, `build-guide/18-ambient-intelligence/05-guest-mode.md`

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'

const MIN_SESSIONS_FOR_PROMOTION = 4

export async function reviewGuestSessionArchive(
  database: BrainDatabase,
  brain: BrioelaBrain,
  userId: string,
  now: number,
): Promise<{ promoted: boolean }> {
  // Load guest_session WHERE status = 'archived'
  // Group by overlapping constraint sets
  // If group count >= MIN_SESSIONS_FOR_PROMOTION:
  //   LLM judgment: worth promoting?
  //   If yes: brain.writeUserMemory({
  //     namespace: 'social.cooking_patterns',
  //     key: 'frequent_guest_restrictions',
  //     value: { restrictions, sessionCount, lastOccasion },
  //     confidence: 0.8,
  //   })
  // Never promote guest names or one-time sessions

  return { promoted: false }
}
```

Creates `ambient_candidate` kind `guest_memory_promotion` when promotion suggested for conversational confirm.
