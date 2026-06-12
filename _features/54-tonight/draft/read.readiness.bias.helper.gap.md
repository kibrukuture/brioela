# Draft: read.readiness.bias.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/read.readiness.bias.helper.ts`

**Gap (feature 54):** Read `health.biometrics` for readiness modulation.

**Source:** `brioela-specs/40-wearables-integration.md` § Downstream Consumers (Spec 51)

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'

export type ReadinessBias = 'low' | 'normal' | 'high_activity'

export type ReadReadinessBiasResult = {
  bias: ReadinessBias
  source: 'wearable' | 'none'
}

export async function readReadinessBias(
  db: BrainDatabase,
  userId: string,
): Promise<ReadReadinessBiasResult> {
  const memory = await db.run(/* read user_memory health.biometrics for today */)

  if (!memory?.readinessScore) {
    return { bias: 'normal', source: 'none' }
  }

  if (memory.readinessScore < 45) {
    return { bias: 'low', source: 'wearable' }
  }

  if (memory.highActivityDay) {
    return { bias: 'high_activity', source: 'wearable' }
  }

  return { bias: 'normal', source: 'wearable' }
}
```

**Boundary:** Writes to `health.biometrics` are **36** only. Sub-line never names metrics.
