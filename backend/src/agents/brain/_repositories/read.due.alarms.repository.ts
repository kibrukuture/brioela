import { and, asc, eq, lt, or } from '@/database/drizzle/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { STALE_PROCESSING_MS } from '@/agents/brain/_constants'

export function readDueAlarms(database: BrainDatabase, userId: string, now: number) {
	return database
		.select()
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.userId, userId),
				or(
					and(
						eq(scheduledAlarms.status, 'pending'),
						lt(scheduledAlarms.scheduledAt, now + 1),
					),
					and(
						eq(scheduledAlarms.status, 'processing'),
						lt(scheduledAlarms.startedAt, now - STALE_PROCESSING_MS),
					),
				),
			),
		)
		.orderBy(asc(scheduledAlarms.scheduledAt))
		.all()
}
