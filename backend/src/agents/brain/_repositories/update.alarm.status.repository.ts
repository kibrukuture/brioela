import { and, eq, inArray } from '@/database/drizzle/_database'
import { getReturned } from '@/database/drizzle/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function markAlarmProcessing(database: BrainDatabase, id: string, now: number): boolean {
	const row = database
		.select({ attempts: scheduledAlarms.attempts })
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.id, id),
				inArray(scheduledAlarms.status, ['pending', 'processing']),
			),
		)
		.get()

	if (!row) return false

	getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: 'processing',
				startedAt: now,
				attempts: row.attempts + 1,
				updatedAt: now,
			})
			.where(eq(scheduledAlarms.id, id))
			.returning(),
	)

	return true
}

type AlarmFinishedInput = {
	id: string
	status: 'completed' | 'failed'
	failureReason?: string
	actionOutcomeStatus?: string
	actionOutcomeJson?: string
	now: number
}

export function markAlarmFinished(database: BrainDatabase, input: AlarmFinishedInput): void {
	getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: input.status,
				completedAt: input.status === 'completed' ? input.now : null,
				failureReason: input.failureReason ?? null,
				actionOutcomeStatus: input.actionOutcomeStatus ?? null,
				actionOutcomeJson: input.actionOutcomeJson ?? null,
				updatedAt: input.now,
			})
			.where(eq(scheduledAlarms.id, input.id))
			.returning(),
	)
}
