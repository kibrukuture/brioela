# Draft: close.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/close.session.handler.ts`

**Gap (feature 11):** Handler **not in production**. Ledger `brain/05-session-lifecycle/0003.session-close.md` is open.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { and, eq } from '@/database/drizzle/_database'
import type { BrainDatabase } from '@/agents/brain/_database'
import {
	cancelUserAlarm,
	completeUserSession,
	readUserSession,
} from '@/agents/brain/_repositories'
import { readEarliestPendingScheduledAt } from '@/agents/brain/_repositories'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { readCurrentEpochMs } from '@/time/_helpers'

export type CloseSessionEndReason = 'completed' | 'user_closed' | 'error'

export async function closeSession(
	database: BrainDatabase,
	userId: string,
	sessionId: string,
	endReason: CloseSessionEndReason,
	outcomeSummary: string,
	wake?: AlarmWakeCallbacks,
): Promise<void> {
	const session = readUserSession(database, sessionId, userId)
	if (!session) {
		throw new Error(`session_not_found:${sessionId}`)
	}

	if (session.status !== 'active') {
		return
	}

	const now = readCurrentEpochMs()

	completeUserSession(database, sessionId, {
		status: 'completed',
		outcomeSummary,
		endedAt: now,
		endReason,
	})

	const watchdog = database
		.select({ id: scheduledAlarms.id })
		.from(scheduledAlarms)
		.where(
			and(
				eq(scheduledAlarms.userId, userId),
				eq(scheduledAlarms.alarmType, 'session_watchdog'),
				eq(scheduledAlarms.triggeringSessionId, sessionId),
				eq(scheduledAlarms.status, 'pending'),
			),
		)
		.get()

	if (watchdog) {
		cancelUserAlarm(database, {
			id: watchdog.id,
			cancelReason: 'session_closed',
			cancelledAt: now,
			updatedAt: now,
		})
	}

	if (wake) {
		const next = readEarliestPendingScheduledAt(database, userId)
		if (next) {
			await wake.scheduleAlarm(next.scheduledAt)
		} else {
			await wake.cancelAlarm()
		}
	}
}
```

**Notes:**
- Compression (**13**) marks old session `compressed` instead of calling this handler — but must still cancel watchdog (same cancel block).
- Abandoned path sets `status: 'abandoned'` in **14**, not this handler.
