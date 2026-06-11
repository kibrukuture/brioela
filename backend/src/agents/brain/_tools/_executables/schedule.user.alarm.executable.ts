import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import {
	readEarliestPendingScheduledAt,
	readPendingUserAlarmByType,
	writeUserAlarm,
} from '@/agents/brain/_repositories'
import {
	DEDUP_USER_ALARM_TYPES,
	type scheduleUserAlarmSchema,
} from '@/agents/brain/_tools/_schemas/schedule.user.alarm.schema'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { z } from '@brioela/shared/zod'

export type AlarmWakeCallbacks = {
	scheduleAlarm: (scheduledAtMs: number) => Promise<void>
	cancelAlarm: () => Promise<void>
}

export const scheduleUserAlarmExecutable = async (
	database: BrainDatabase,
	userId: string,
	input: z.infer<typeof scheduleUserAlarmSchema>,
	wake: Pick<AlarmWakeCallbacks, 'scheduleAlarm'>,
) => {
	const now = readCurrentEpochMs()

	if (input.scheduled_at <= now) {
		return {
			error: 'scheduled_at_must_be_future' as const,
			scheduled_at: input.scheduled_at,
			now,
		}
	}

	if (DEDUP_USER_ALARM_TYPES.some((alarmType) => alarmType === input.alarm_type)) {
		const existing = readPendingUserAlarmByType(database, userId, input.alarm_type)
		if (existing) {
			return {
				error: 'alarm_already_pending' as const,
				id: existing.id,
				alarm_type: input.alarm_type,
				scheduled_at: existing.scheduledAt,
				hint: 'A pending alarm of this type already exists. Cancel it first if you need to reschedule.',
			}
		}
	}

	const alarmId = createId()

	writeUserAlarm(database, {
		id: alarmId,
		userId,
		alarmType: input.alarm_type,
		triggeringSessionId: input.triggering_session_id ?? null,
		payload: JSON.stringify(input.payload),
		status: 'pending',
		scheduledAt: input.scheduled_at,
		attempts: 0,
		createdAt: now,
		updatedAt: now,
	})

	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) {
		await wake.scheduleAlarm(next.scheduledAt)
	}

	return {
		id: alarmId,
		alarm_type: input.alarm_type,
		scheduled_at: input.scheduled_at,
		status: 'pending' as const,
	}
}
