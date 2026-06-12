# Draft: handle.tonight.generation.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/alarms/handle.tonight.generation.alarm.handler.ts`

**Gap (feature 54):** Alarm kind `tonight_generation` → pipeline.

**Source:** `_records/build-order/35-layer-tonight.md`, **09**/**14** alarm pattern

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { ScheduledAlarmRow } from '@/agents/brain/_schemas/scheduled.alarm.schema'
import { runTonightGeneration } from '@/agents/brain/_handlers/tonight/run.tonight.generation.handler'
import { scheduleTonightAlarms } from '@/agents/brain/_helpers/tonight/schedule.tonight.alarms.helper'

export async function handleTonightGenerationAlarm(
  db: BrainDatabase,
  alarm: ScheduledAlarmRow,
): Promise<void> {
  const { userId, timezone, dateLocal } = alarm.payload as {
    userId: string
    timezone: string
    dateLocal: string
  }

  const entitlement = await db.run(/* loadUserEntitlement **43** */)

  await runTonightGeneration(db, userId, dateLocal, timezone, entitlement)

  await scheduleTonightAlarms(db, userId, timezone)
}
```
