# Draft: read.user.alarm.repository

Target: `backend/src/agents/brain/_repositories/read.user.alarm.repository.ts`

```typescript
import { and, asc, eq, getOne } from '@/database/drizzle/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function readUserAlarm(database: BrainDatabase, id: string) {
	return getOne(
		database
			.select()
			.from(scheduledAlarms)
			.where(eq(scheduledAlarms.id, id)),
	)
}

export function readPendingUserAlarmByType(
	database: BrainDatabase,
	userId: string,
	alarmType: string,
) {
	return getOne(
		database
			.select()
			.from(scheduledAlarms)
			.where(
				and(
					eq(scheduledAlarms.userId, userId),
					eq(scheduledAlarms.alarmType, alarmType),
					eq(scheduledAlarms.status, 'pending'),
				),
			),
	)
}

export function readEarliestPendingScheduledAt(database: BrainDatabase, userId: string) {
	return getOne(
		database
			.select({ scheduledAt: scheduledAlarms.scheduledAt })
			.from(scheduledAlarms)
			.where(
				and(
					eq(scheduledAlarms.userId, userId),
					eq(scheduledAlarms.status, 'pending'),
				),
			)
			.orderBy(asc(scheduledAlarms.scheduledAt))
			.limit(1),
	)
}
```
