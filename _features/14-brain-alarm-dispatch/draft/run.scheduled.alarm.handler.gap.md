# Draft: run.scheduled.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/run.scheduled.alarm.handler.ts`

**Gap (feature 14):** Per-row SDK callback entry from `05-alarm-system.md` / `07-agent-framework-hardening.md`. Optional if product stays on MIN-pending batch only (**09** G6).

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { readUserAlarm, readEarliestPendingScheduledAt } from '@/agents/brain/_repositories'
import {
	markAlarmCompleted,
	markAlarmFailed,
	markAlarmProcessing,
	markAlarmRetryPending,
} from '@/agents/brain/_repositories/update.scheduled.alarm.lifecycle.repository'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { dispatchAlarm } from '@/agents/brain/_handlers/dispatch.alarm.handler'
import { MAX_ALARM_ATTEMPTS } from '@/agents/brain/_constants/alarm.dispatch.constants'
import { readCurrentEpochMs } from '@/time/_helpers'

async function refreshWakeSlot(
	database: BrainDatabase,
	userId: string,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) await wake.scheduleAlarm(next.scheduledAt)
	else await wake.cancelAlarm()
}

export async function runScheduledAlarmById(
	database: BrainDatabase,
	brain: BrioelaBrain,
	userId: string,
	scheduledAlarmId: string,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const alarm = readUserAlarm(database, scheduledAlarmId)
	if (!alarm || alarm.status !== 'pending') return

	const now = readCurrentEpochMs()
	const claimed = markAlarmProcessing(database, alarm.id, now)
	if (!claimed) return

	try {
		await dispatchAlarm(database, brain, claimed, wake)
		markAlarmCompleted(database, claimed.id, now)
	} catch (error) {
		if (claimed.attempts >= MAX_ALARM_ATTEMPTS) {
			markAlarmFailed(database, claimed.id, String(error), now)
		} else {
			markAlarmRetryPending(database, claimed.id, now)
		}
	}

	await refreshWakeSlot(database, userId, wake)
}
```

**Relationship to batch:** If both `alarm()` batch and per-row SDK schedules coexist, guard against double-processing via conditional `markAlarmProcessing`.
