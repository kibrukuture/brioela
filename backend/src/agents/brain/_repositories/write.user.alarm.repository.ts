import { eq, getReturned } from '@/database/drizzle/_database'
import {
	scheduledAlarms,
	type BrainScheduledAlarm,
	type NewBrainScheduledAlarm,
} from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeUserAlarm(
	database: BrainDatabase,
	values: NewBrainScheduledAlarm,
): BrainScheduledAlarm {
	return getReturned(
		database
			.insert(scheduledAlarms)
			.values(values)
			.returning(),
	)
}

type CancelUserAlarmInput = {
	id: string
	cancelReason: string | null
	cancelledAt: number
	updatedAt: number
}

export function cancelUserAlarm(
	database: BrainDatabase,
	input: CancelUserAlarmInput,
): BrainScheduledAlarm {
	return getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: 'cancelled',
				cancelReason: input.cancelReason,
				cancelledAt: input.cancelledAt,
				updatedAt: input.updatedAt,
			})
			.where(eq(scheduledAlarms.id, input.id))
			.returning(),
	)
}
