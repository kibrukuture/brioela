# Draft: check.ambient.idle.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/check.ambient.idle.helper.ts`

**Gap (feature 35):** Idle gate before write-heavy ambient passes — 2h active-session window per build-guide **18** (conflicts with **12** 1h defer — G22).

**Source:** `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { readCurrentEpochMs } from '@/time/_helpers'

const ACTIVE_SESSION_LOOKBACK_MS = 2 * 60 * 60 * 1000
const RESCHEDULE_DELAY_MS = 2 * 60 * 60 * 1000

export type AmbientIdleCheck = {
  activeSessionId: string | null
  lastSessionStartedAt: number | null
  canRunNow: boolean
  rescheduleAt: number | null
}

export async function checkAmbientIdle(
  database: BrainDatabase,
  userId: string,
): Promise<AmbientIdleCheck> {
  const now = readCurrentEpochMs()
  const cutoff = now - ACTIVE_SESSION_LOOKBACK_MS

  // TODO(11): query sessions WHERE status = 'active' OR started_at >= cutoff
  const activeSessionId: string | null = null
  const lastSessionStartedAt: number | null = null

  const canRunNow = activeSessionId === null
  const rescheduleAt = canRunNow ? null : now + RESCHEDULE_DELAY_MS

  return { activeSessionId, lastSessionStartedAt, canRunNow, rescheduleAt }
}

export async function rescheduleAmbientPass(
  database: BrainDatabase,
  userId: string,
  alarmType: string,
  rescheduleAt: number,
): Promise<void> {
  // TODO(09): schedule_user_alarm({ alarm_type, scheduled_at: rescheduleAt, payload: {} })
}
```

Pattern reads without surfacing may bypass `canRunNow` when `options.readOnly === true`.
