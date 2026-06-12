# Draft: run.ambient.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/run.ambient.pass.handler.ts`

**Gap (feature 35):** Dispatcher for ambient write passes — patterns, time_machine, guest_review.

**Source:** `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { checkAmbientIdle, rescheduleAmbientPass } from './check.ambient.idle.helper'
import { runAmbientBehaviorPatternPass } from './run.ambient.behavior.pattern.pass.handler'
import { buildTimeMachineCandidates } from './build.time.machine.candidates.helper'
import { reviewGuestSessionArchive } from './review.guest.session.archive.helper'
import { readCurrentEpochMs } from '@/time/_helpers'

export type AmbientPassKind = 'patterns' | 'time_machine' | 'guest_review'

export async function runAmbientPass(input: {
  database: BrainDatabase
  brain: BrioelaBrain
  userId: string
  pass: AmbientPassKind
}): Promise<{ deferred?: boolean; reason?: string }> {
  const idle = await checkAmbientIdle(input.database, input.userId)
  if (!idle.canRunNow && idle.rescheduleAt !== null) {
    await rescheduleAmbientPass(input.database, input.userId, `ambient_${input.pass}`, idle.rescheduleAt)
    return { deferred: true, reason: 'active_session' }
  }

  const now = readCurrentEpochMs()

  switch (input.pass) {
    case 'patterns':
      await runAmbientBehaviorPatternPass(input.database, input.brain, {
        userId: input.userId,
        now,
      })
      break
    case 'time_machine':
      await buildTimeMachineCandidates(input.database, input.userId, now)
      break
    case 'guest_review':
      await reviewGuestSessionArchive(input.database, input.brain, input.userId, now)
      break
  }

  return {}
}
```

`travel_preload` is **not** routed here — separate `scheduled_alarms.alarm_type` via **14**.
