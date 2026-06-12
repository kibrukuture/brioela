import { readCurrentEpochMs } from '@/time/_helpers'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { AlarmRegistry } from '@/agents/brain/_dispatch'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables'
import {
	markAlarmFinished,
	markAlarmProcessing,
	readDueAlarms,
	readEarliestPendingScheduledAt,
} from '@/agents/brain/_repositories'
import { runUnknownAlarm } from '@/agents/brain/_handlers/run.unknown.alarm.handler'
import { MAX_ALARM_ATTEMPTS } from '@/agents/brain/_constants'

export async function settleDueAlarms(
	database: BrainDatabase,
	userId: string,
	registry: AlarmRegistry,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const now = readCurrentEpochMs()
	const dueAlarms = readDueAlarms(database, userId, now)

	for (const alarm of dueAlarms) {
		const claimed = markAlarmProcessing(database, alarm.id, now)
		if (!claimed) continue

		const newAttempts = alarm.attempts + 1

		if (newAttempts > MAX_ALARM_ATTEMPTS) {
			markAlarmFinished(database, { id: alarm.id, status: 'failed', failureReason: 'max_attempts_exceeded', now })
			continue
		}

		const action = registry.resolve(alarm.alarmType) ?? runUnknownAlarm

		try {
			const outcome = await action.handle(alarm, { database, userId, wake })
			markAlarmFinished(database, {
				id: alarm.id,
				status: outcome.status,
				failureReason: outcome.failureReason,
				actionOutcomeStatus: outcome.actionOutcomeStatus,
				actionOutcomeJson: outcome.actionOutcomeJson,
				now,
			})
		} catch {
			markAlarmFinished(database, { id: alarm.id, status: 'failed', failureReason: 'action_threw', now })
		}
	}

	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) {
		await wake.scheduleAlarm(next.scheduledAt)
	} else {
		await wake.cancelAlarm()
	}
}
