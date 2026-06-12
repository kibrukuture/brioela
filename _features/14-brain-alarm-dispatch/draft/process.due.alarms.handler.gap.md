# Draft: process.due.alarms.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/process.due.alarms.handler.ts`

**Gap (feature 14):** Batch alarm processor — canonical MIN-pending wake path per `10-scheduled-alarms.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import {
	readDuePendingAlarms,
	readStaleProcessingAlarms,
} from '@/agents/brain/_repositories/read.due.pending.alarms.repository'
import {
	markAlarmCompleted,
	markAlarmFailed,
	markAlarmProcessing,
	markAlarmRetryPending,
} from '@/agents/brain/_repositories/update.scheduled.alarm.lifecycle.repository'
import { readEarliestPendingScheduledAt } from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { dispatchAlarm } from '@/agents/brain/_handlers/dispatch.alarm.handler'
import {
	MAX_ALARM_ATTEMPTS,
	STALE_PROCESSING_MS,
} from '@/agents/brain/_constants/alarm.dispatch.constants'
import { readCurrentEpochMs } from '@/time/_helpers'

async function refreshWakeSlot(
	database: BrainDatabase,
	userId: string,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) {
		await wake.scheduleAlarm(next.scheduledAt)
	} else {
		await wake.cancelAlarm()
	}
}

export async function processDueAlarms(
	database: BrainDatabase,
	brain: BrioelaBrain,
	userId: string,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const now = readCurrentEpochMs()
	const due = readDuePendingAlarms(database, userId, now)
	const stale = readStaleProcessingAlarms(database, userId, now - STALE_PROCESSING_MS)
	const toProcess = [...due, ...stale]

	for (const alarm of toProcess) {
		const claimed = markAlarmProcessing(database, alarm.id, now)
		if (!claimed) continue

		try {
			await dispatchAlarm(database, brain, claimed, wake)
			markAlarmCompleted(database, claimed.id, now)
		} catch (error) {
			const attempts = claimed.attempts
			if (attempts >= MAX_ALARM_ATTEMPTS) {
				markAlarmFailed(database, claimed.id, String(error), now)
			} else {
				markAlarmRetryPending(database, claimed.id, now)
			}
		}
	}

	await refreshWakeSlot(database, userId, wake)
}
```

**Call sites:** `BrioelaBrain.alarm()` after readiness; optionally end of `runScheduledAlarm` after single-row dispatch.
