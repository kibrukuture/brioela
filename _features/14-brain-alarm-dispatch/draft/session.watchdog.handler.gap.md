# Draft: session.watchdog.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/session.watchdog.handler.ts`

**Gap (feature 14):** Watchdog fire logic from `implementable-specs/17-session-lifecycle.md` not implemented. **11** schedules row.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, desc, eq } from 'drizzle-orm'
import { createId } from '@brioela/shared/_ids'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { sessions, sessionTurns, type BrainScheduledAlarm } from '@/agents/brain/_schemas'
import {
	readEarliestPendingScheduledAt,
	writeUserAlarm,
} from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { buildAbandonedSummary } from '@/agents/brain/_helpers/build.abandoned.summary.helper'
import { parseSessionWatchdogPayload } from '@/agents/brain/_helpers/parse.alarm.payload.helper'
import { SESSION_INACTIVITY_THRESHOLD_MS } from '@/agents/brain/_constants/alarm.dispatch.constants'
import { readCurrentEpochMs } from '@/time/_helpers'

const WATCHDOG_RESCHEDULE_MS = 60 * 60 * 1000

export async function handleSessionWatchdog(
	database: BrainDatabase,
	_brain: BrioelaBrain,
	alarm: BrainScheduledAlarm,
	payload: Record<string, unknown>,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const { sessionId } = parseSessionWatchdogPayload(payload)
	const now = readCurrentEpochMs()

	const session = database
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.get()

	if (!session || session.status !== 'active') {
		return
	}

	const lastTurn = database
		.select({ createdAt: sessionTurns.createdAt, turnNumber: sessionTurns.turnNumber })
		.from(sessionTurns)
		.where(eq(sessionTurns.sessionId, sessionId))
		.orderBy(desc(sessionTurns.turnNumber))
		.limit(1)
		.get()

	const threshold = SESSION_INACTIVITY_THRESHOLD_MS[session.sessionType]
	const lastActivity = lastTurn?.createdAt ?? session.startedAt
	const timeSinceActivity = now - lastActivity

	if (timeSinceActivity >= threshold) {
		database
			.update(sessions)
			.set({
				status: 'abandoned',
				endedAt: now,
				endReason: 'timeout',
				outcomeSummary: buildAbandonedSummary(session, lastTurn ?? null),
				updatedAt: now,
			})
			.where(eq(sessions.id, sessionId))
			.run()
		return
	}

	writeUserAlarm(database, {
		id: createId(),
		userId: alarm.userId,
		alarmType: 'session_watchdog',
		triggeringSessionId: sessionId,
		payload: JSON.stringify({ session_id: sessionId }),
		status: 'pending',
		scheduledAt: now + WATCHDOG_RESCHEDULE_MS,
		attempts: 0,
		createdAt: now,
		updatedAt: now,
	})

	const next = readEarliestPendingScheduledAt(database, alarm.userId)
	if (next) await wake.scheduleAlarm(next.scheduledAt)
}
```

**Thresholds:** per **17** — chat 30m, cooking 1h, alarm/background 15m.
