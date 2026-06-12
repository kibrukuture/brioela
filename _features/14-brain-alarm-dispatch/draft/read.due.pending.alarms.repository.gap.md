# Draft: read.due.pending.alarms.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/read.due.pending.alarms.repository.ts`

**Gap (feature 14):** No query for all due pending alarms — only `readEarliestPendingScheduledAt` exists (**09**).

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, asc, eq, lte } from 'drizzle-orm'
import { getMany, getOne } from '@/database/drizzle/_database'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'

export function readDuePendingAlarms(
	database: BrainDatabase,
	userId: string,
	nowMs: number,
) {
	return getMany(
		database
			.select()
			.from(scheduledAlarms)
			.where(
				and(
					eq(scheduledAlarms.userId, userId),
					eq(scheduledAlarms.status, 'pending'),
					lte(scheduledAlarms.scheduledAt, nowMs),
				),
			)
			.orderBy(asc(scheduledAlarms.scheduledAt)),
	)
}

export function readStaleProcessingAlarms(
	database: BrainDatabase,
	userId: string,
	staleBeforeMs: number,
) {
	return getMany(
		database
			.select()
			.from(scheduledAlarms)
			.where(
				and(
					eq(scheduledAlarms.userId, userId),
					eq(scheduledAlarms.status, 'processing'),
					lte(scheduledAlarms.startedAt, staleBeforeMs),
				),
			)
			.orderBy(asc(scheduledAlarms.scheduledAt)),
	)
}
```

Export from `_repositories/index.ts` when shipped.
