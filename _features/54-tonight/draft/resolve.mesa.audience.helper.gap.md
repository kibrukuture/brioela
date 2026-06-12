# Draft: resolve.mesa.audience.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/resolve.mesa.audience.helper.ts`

**Gap (feature 54):** Conservative Mesa audience inference.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § Technical Constraints

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'

export type ResolvedMesaAudience = {
  memberIds: string[]
  isMesaActive: boolean
  source: 'explicit_active' | 'recurring_pattern' | 'solo'
}

export async function resolveMesaAudience(
  db: BrainDatabase,
  userId: string,
  dateLocal: string,
): Promise<ResolvedMesaAudience> {
  const explicit = await db.run(/* mesa_audience where active_for_date = dateLocal */)
  if (explicit?.memberIds?.length) {
    return {
      memberIds: explicit.memberIds,
      isMesaActive: true,
      source: 'explicit_active',
    }
  }

  const recurring = await db.run(/* user_memory mesa.recurring_pattern promoted */)
  if (recurring?.memberIds?.length) {
    return {
      memberIds: recurring.memberIds,
      isMesaActive: true,
      source: 'recurring_pattern',
    }
  }

  return { memberIds: [userId], isMesaActive: false, source: 'solo' }
}
```

**Rule:** Never guess who is eating tonight from thin air.
