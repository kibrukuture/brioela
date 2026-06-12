# Draft: initialize.health.insight.alarms.handler.ts (gap)

Target: `backend/src/agents/brain/_handlers/initialize.health.insight.alarms.handler.ts`

**Owner:** **22** — NOT in **12** `initializeBrainSubAgentAlarms` (maintenance + pattern only).

Source: `03-health-insight-agent.md` scheduling block.

Called from Brain DO first-boot / init sequence (**04** `12-schema-version` extension).

```typescript
import { eq, and } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import { readCurrentEpochMs } from '@/time/_helpers'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function initializeHealthInsightAlarms(database: BrainDatabase, userId: string): void {
	const existing = database
		.select({ id: scheduledAlarms.id })
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.userId, userId),
				eq(scheduledAlarms.alarmType, 'health_insight_run'),
				eq(scheduledAlarms.status, 'pending'),
			),
		)
		.get()

	if (existing) return

	const now = readCurrentEpochMs()
	database
		.insert(scheduledAlarms)
		.values({
			id: crypto.randomUUID(),
			userId,
			alarmType: 'health_insight_run',
			payload: JSON.stringify({ userId }),
			scheduledAt: now + SEVEN_DAYS_MS,
			status: 'pending',
			createdAt: now,
			updatedAt: now,
		})
		.run()
}
```

After insert: `readEarliestPendingScheduledAt` → `scheduleAlarm` (**09** wake contract).
