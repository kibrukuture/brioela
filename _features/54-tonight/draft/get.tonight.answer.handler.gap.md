# Draft: get.tonight.answer.handler.ts (gap — file does not exist)

Target: `backend/src/api/tonight/_handlers/get.tonight.answer.handler.ts`

**Gap (feature 54):** API read today's card.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { loadTonightAnswer } from '@/agents/brain/_handlers/tonight/load.tonight.answer.handler'
import { checkTonightTierGate } from '@/agents/brain/_helpers/tonight/check.tonight.tier.gate.helper'

export async function getTonightAnswerHandler(
  db: BrainDatabase,
  userId: string,
  dateLocal: string,
  entitlement: Parameters<typeof checkTonightTierGate>[0],
) {
  const gate = checkTonightTierGate(entitlement)
  if (!gate.allowed) {
    return null
  }

  return loadTonightAnswer(db, userId, dateLocal)
}
```
