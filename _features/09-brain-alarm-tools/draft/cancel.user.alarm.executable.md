# Draft: cancel.user.alarm.executable

Target: `backend/src/agents/brain/_tools/_executables/cancel.user.alarm.executable.ts`

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import {
	cancelUserAlarm,
	readEarliestPendingScheduledAt,
	readUserAlarm,
} from '@/agents/brain/_repositories'
import type { cancelUserAlarmSchema } from '@/agents/brain/_tools/_schemas/cancel.user.alarm.schema'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { z } from '@brioela/shared/zod'

export const cancelUserAlarmExecutable = async (
	database: BrainDatabase,
	userId: string,
	input: z.infer<typeof cancelUserAlarmSchema>,
	wake: AlarmWakeCallbacks,
) => {
	const alarm = readUserAlarm(database, input.id)
	if (!alarm) {
		return { error: 'alarm_not_found' as const, id: input.id }
	}

	if (alarm.status !== 'pending') {
		return {
			error: 'alarm_not_cancellable' as const,
			id: input.id,
			current_status: alarm.status,
			hint: `Only pending alarms can be cancelled. Status is: ${alarm.status}`,
		}
	}

	const earliestBefore = readEarliestPendingScheduledAt(database, userId)
	const wasNextAlarm = earliestBefore?.scheduledAt === alarm.scheduledAt

	const now = readCurrentEpochMs()
	cancelUserAlarm(database, {
		id: input.id,
		cancelReason: input.reason ?? null,
		cancelledAt: now,
		updatedAt: now,
	})

	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) {
		await wake.scheduleAlarm(next.scheduledAt)
	} else {
		await wake.cancelAlarm()
	}

	return {
		id: input.id,
		alarm_type: alarm.alarmType,
		status: 'cancelled' as const,
		was_next_alarm: wasNextAlarm,
		new_next_alarm_at: next?.scheduledAt ?? null,
	}
}
```
