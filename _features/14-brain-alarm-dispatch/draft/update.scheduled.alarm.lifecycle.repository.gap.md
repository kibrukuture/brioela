# Draft: update.scheduled.alarm.lifecycle.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/update.scheduled.alarm.lifecycle.repository.ts`

**Gap (feature 14):** Lifecycle transitions `processing` → `completed`/`failed` not implemented.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, eq, sql } from 'drizzle-orm'
import { getOne, getReturned } from '@/database/drizzle/_database'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduledAlarms, type BrainScheduledAlarm } from '@/agents/brain/_schemas'

export function markAlarmProcessing(
	database: BrainDatabase,
	alarmId: string,
	nowMs: number,
): BrainScheduledAlarm | null {
	return getOne(
		database
			.update(scheduledAlarms)
			.set({
				status: 'processing',
				startedAt: nowMs,
				attempts: sql`${scheduledAlarms.attempts} + 1`,
				updatedAt: nowMs,
			})
			.where(
				and(
					eq(scheduledAlarms.id, alarmId),
					eq(scheduledAlarms.status, 'pending'),
				),
			)
			.returning(),
	)
}

export function markAlarmCompleted(
	database: BrainDatabase,
	alarmId: string,
	nowMs: number,
): BrainScheduledAlarm {
	return getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: 'completed',
				completedAt: nowMs,
				updatedAt: nowMs,
			})
			.where(eq(scheduledAlarms.id, alarmId))
			.returning(),
	)
}

export function markAlarmFailed(
	database: BrainDatabase,
	alarmId: string,
	failureReason: string,
	nowMs: number,
): BrainScheduledAlarm {
	return getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: 'failed',
				failureReason,
				updatedAt: nowMs,
			})
			.where(eq(scheduledAlarms.id, alarmId))
			.returning(),
	)
}

export function markAlarmRetryPending(
	database: BrainDatabase,
	alarmId: string,
	nowMs: number,
): BrainScheduledAlarm {
	return getReturned(
		database
			.update(scheduledAlarms)
			.set({
				status: 'pending',
				updatedAt: nowMs,
			})
			.where(eq(scheduledAlarms.id, alarmId))
			.returning(),
	)
}
```

**Note:** Stale `processing` reclaim may use separate conditional `WHERE status = 'processing'` variant if needed.
