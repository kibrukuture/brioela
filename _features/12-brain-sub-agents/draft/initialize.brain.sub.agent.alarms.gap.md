# Draft: initialize.brain.sub.agent.alarms.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/initialize.brain.sub.agent.alarms.handler.ts`

**Gap (feature 12):** First-boot seed for `brain_maintenance_run` and `behavior_pattern_detection` not implemented. Spec: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` + `implementable-specs/12-schema-version.md` init step 3.

**Not a sub-agent** — DO initialization job that enables sub-agent alarms.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, eq } from 'drizzle-orm'
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import {
	readEarliestPendingScheduledAt,
	writeUserAlarm,
} from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { readCurrentEpochMs } from '@/time/_helpers'

const MS_PER_DAY = 86_400_000

export async function initializeBrainSubAgentAlarms(
	database: BrainDatabase,
	userId: string,
	wake?: AlarmWakeCallbacks,
): Promise<void> {
	const now = readCurrentEpochMs()

	const existingMaintenance = database
		.select({ id: scheduledAlarms.id })
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.alarmType, 'brain_maintenance_run'),
				eq(scheduledAlarms.status, 'pending'),
			),
		)
		.get()

	if (!existingMaintenance) {
		writeUserAlarm(database, {
			id: createId(),
			userId,
			alarmType: 'brain_maintenance_run',
			status: 'pending',
			scheduledAt: now + 7 * MS_PER_DAY,
			payload: '{}',
			triggeringSessionId: null,
			attempts: 0,
			createdAt: now,
			updatedAt: now,
		})
	}

	const existingPattern = database
		.select({ id: scheduledAlarms.id })
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.alarmType, 'behavior_pattern_detection'),
				eq(scheduledAlarms.status, 'pending'),
			),
		)
		.get()

	if (!existingPattern) {
		writeUserAlarm(database, {
			id: createId(),
			userId,
			alarmType: 'behavior_pattern_detection',
			status: 'pending',
			scheduledAt: now + 3 * MS_PER_DAY,
			payload: '{}',
			triggeringSessionId: null,
			attempts: 0,
			createdAt: now,
			updatedAt: now,
		})
	}

	if (wake) {
		const next = readEarliestPendingScheduledAt(database, userId)
		if (next) await wake.scheduleAlarm(next.scheduledAt)
	}
}
```

**Cadence:** 7d maintenance, 3d pattern — per spec **15** (not build-guide 14d).

**Call site:** Brain init after `do.initialized = '1'` transition (**04** migration runtime / agent startup).
