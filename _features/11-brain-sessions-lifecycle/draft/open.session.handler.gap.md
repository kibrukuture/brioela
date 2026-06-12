# Draft: open.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/open.session.handler.ts`

**Gap (feature 11):** Handler **not in production**. Ledger `brain/05-session-lifecycle/0001.session-open.md` is open. Depends on **15** `buildSystemPrompt`, **10** `BrioelaIdentity`, **09** alarm repos + optional `AlarmWakeCallbacks`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { insertUserSession } from '@/agents/brain/_repositories'
import {
	readEarliestPendingScheduledAt,
	writeUserAlarm,
} from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { buildSystemPrompt } from '@/agents/brain/_handlers/build.system.prompt.handler'
import type { BrainSession, NewBrainSession } from '@/agents/brain/_schemas'
import { readCurrentEpochMs } from '@/time/_helpers'

/** Prefer implementable-specs/17-session-lifecycle.md durations. */
const WATCHDOG_DURATION_MS: Record<NewBrainSession['sessionType'], number> = {
	chat: 2 * 60 * 60 * 1000,
	cooking: 8 * 60 * 60 * 1000,
	alarm: 1 * 60 * 60 * 1000,
	background: 1 * 60 * 60 * 1000,
}

export type OpenSessionInput = {
	userId: string
	sessionType: NewBrainSession['sessionType']
	model: string
	recipeId?: string | null
	alarmType?: string | null
	parentSessionId?: string | null
}

export async function openSession(
	database: BrainDatabase,
	input: OpenSessionInput,
	wake?: Pick<AlarmWakeCallbacks, 'scheduleAlarm'>,
): Promise<{ sessionId: string; systemPrompt: string }> {
	const now = readCurrentEpochMs()
	const sessionId = createId()

	insertUserSession(database, {
		id: sessionId,
		userId: input.userId,
		sessionType: input.sessionType,
		parentSessionId: input.parentSessionId ?? null,
		recipeId: input.recipeId ?? null,
		alarmType: input.alarmType ?? null,
		status: 'active',
		outcomeSummary: null,
		model: input.model,
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		estimatedCostUsd: null,
		turnCount: 0,
		skillsCreated: 0,
		constraintsProposed: 0,
		memoryWrites: 0,
		startedAt: now,
		endedAt: null,
		endReason: null,
	})

	const watchdogId = createId()
	writeUserAlarm(database, {
		id: watchdogId,
		userId: input.userId,
		alarmType: 'session_watchdog',
		triggeringSessionId: sessionId,
		payload: JSON.stringify({ session_id: sessionId }),
		sdkScheduleId: null,
		status: 'pending',
		attempts: 0,
		failureReason: null,
		cancelledAt: null,
		cancelReason: null,
		rescheduledFromAlarmId: null,
		rescheduledToAlarmId: null,
		label: null,
		scheduledAt: now + WATCHDOG_DURATION_MS[input.sessionType],
		startedAt: null,
		completedAt: null,
		actionOutcomeStatus: null,
		actionOutcomeJson: null,
		createdAt: now,
		updatedAt: now,
	})

	if (wake) {
		const next = readEarliestPendingScheduledAt(database, input.userId)
		if (next) {
			await wake.scheduleAlarm(next.scheduledAt)
		}
	}

	const systemPrompt = await buildSystemPrompt(database, input.sessionType, input.userId)

	return { sessionId, systemPrompt }
}
```

**Notes:**
- `buildSystemPrompt` import fails until **15** ships.
- `insertUserSession` import fails until session repository ships (gap file `write.user.session.repository.gap.md`).
- `wake` optional mirrors **09** — alarm tools omitted when undefined; open should accept wake from **20** once **09** G1 closes.
