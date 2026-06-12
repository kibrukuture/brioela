# Draft: compress.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/compress.session.handler.ts`

**Gap (feature 13):** Orchestration handler — threshold check, subAgent compressor call (**12**), DB apply, continuation block return.

**12 owns:** Haiku reasoning inside `SessionContextCompressor` — see `_features/12-brain-sub-agents/draft/`.

**Blocked by:** **11** session repos (partial — compression-specific repos in **13** drafts), **12** DO binding, **09** alarm cancel/schedule.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { CompressionSummary } from '@/agents/brain/_schemas/compression.summary.schema'
import type { BrainSessionTurn } from '@/agents/brain/_schemas'
import { SessionContextCompressor } from '@/agents/brain/_subagents/session-context-compressor'
import {
	isCompressionThresholdMet,
	COMPRESSION_VERBATIM_TAIL_TURN_COUNT,
} from '@/agents/brain/_constants/compression.thresholds.constant'
import {
	readSessionCompressionCounters,
	readSessionTurnsOrdered,
	readLastSessionTurns,
} from '@/agents/brain/_repositories/read.session.compression.repository'
import { applySessionCompressionWrites } from '@/agents/brain/_repositories/write.session.compression.repository'
import {
	cancelUserAlarm,
	readEarliestPendingScheduledAt,
	writeUserAlarm,
} from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { formatContinuationContext } from '@/agents/brain/_handlers/format.continuation.context.helper'
import { readCurrentEpochMs } from '@/time/_helpers'

/** Prefer implementable-specs/17-session-lifecycle.md durations — same as openSession. */
const WATCHDOG_DURATION_MS = {
	chat: 2 * 60 * 60 * 1000,
	cooking: 8 * 60 * 60 * 1000,
	alarm: 1 * 60 * 60 * 1000,
	background: 1 * 60 * 60 * 1000,
} as const

export type RunCompressionResult = {
	newSessionId: string
	compressionSummary: CompressionSummary
	recentTurns: BrainSessionTurn[]
	continuationContextBlock: string
}

export function checkCompressionNeeded(database: BrainDatabase, sessionId: string): boolean {
	const row = readSessionCompressionCounters(database, sessionId)
	if (!row || row.status !== 'active') {
		return false
	}
	return isCompressionThresholdMet({
		sessionType: row.sessionType,
		turnCount: row.turnCount,
		inputTokens: row.inputTokens,
	})
}

async function cancelSessionWatchdog(
	database: BrainDatabase,
	sessionId: string,
	userId: string,
	wake?: Pick<AlarmWakeCallbacks, 'scheduleAlarm' | 'cancelAlarm'>,
): Promise<void> {
	const pending = database
		.select()
		.from(/* scheduledAlarms table via repo */)
		// Prefer readPendingWatchdogByTriggeringSessionId helper from **11**
		.get()

	if (!pending) return

	cancelUserAlarm(database, {
		id: pending.id,
		cancelReason: 'session_compressed',
		cancelledAt: readCurrentEpochMs(),
		updatedAt: readCurrentEpochMs(),
	})

	if (!wake) return
	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) await wake.scheduleAlarm(next.scheduledAt)
	else await wake.cancelAlarm()
}

async function scheduleSessionWatchdog(
	database: BrainDatabase,
	sessionId: string,
	userId: string,
	sessionType: keyof typeof WATCHDOG_DURATION_MS,
	wake?: Pick<AlarmWakeCallbacks, 'scheduleAlarm'>,
): Promise<void> {
	const now = readCurrentEpochMs()
	writeUserAlarm(database, {
		id: createId(),
		userId,
		alarmType: 'session_watchdog',
		triggeringSessionId: sessionId,
		payload: JSON.stringify({ session_id: sessionId }),
		sdkScheduleId: null,
		status: 'pending',
		scheduledAt: now + WATCHDOG_DURATION_MS[sessionType],
		attempts: 0,
		createdAt: now,
		updatedAt: now,
	})

	if (wake) {
		const next = readEarliestPendingScheduledAt(database, userId)
		if (next) await wake.scheduleAlarm(next.scheduledAt)
	}
}

export async function applyCompression(
	database: BrainDatabase,
	oldSessionId: string,
	summary: CompressionSummary,
	last10Turns: BrainSessionTurn[],
	wake?: Pick<AlarmWakeCallbacks, 'scheduleAlarm' | 'cancelAlarm'>,
): Promise<Omit<RunCompressionResult, 'continuationContextBlock'>> {
	const { newSessionId, oldSession } = applySessionCompressionWrites(database, oldSessionId, summary)

	await cancelSessionWatchdog(database, oldSessionId, oldSession.userId, wake)
	await scheduleSessionWatchdog(database, newSessionId, oldSession.userId, oldSession.sessionType, wake)

	return {
		newSessionId,
		compressionSummary: summary,
		recentTurns: last10Turns,
	}
}

export async function runCompression(
	database: BrainDatabase,
	brain: BrioelaBrain,
	sessionId: string,
	userId: string,
	wake?: Pick<AlarmWakeCallbacks, 'scheduleAlarm' | 'cancelAlarm'>,
): Promise<RunCompressionResult> {
	const counters = readSessionCompressionCounters(database, sessionId)
	if (!counters || counters.status !== 'active') {
		throw new Error('session_not_active')
	}
	if (!checkCompressionNeeded(database, sessionId)) {
		throw new Error('compression_not_needed')
	}

	const turns = readSessionTurnsOrdered(database, sessionId)
	const last10Turns = readLastSessionTurns(database, sessionId, COMPRESSION_VERBATIM_TAIL_TURN_COUNT)

	if (counters.sessionType !== 'chat' && counters.sessionType !== 'cooking') {
		throw new Error('session_type_not_compressible')
	}

	const compressorKey = `compressor_${userId}_${sessionId}`
	const compressor = await brain.subAgent(SessionContextCompressor, compressorKey)
	const summary = await compressor.compressContext({
		sessionId,
		sessionType: counters.sessionType,
		turns: turns.map((t) => ({
			role: t.role,
			content: t.content,
			turnNumber: t.turnNumber,
		})),
	})

	const applied = await applyCompression(database, sessionId, summary, last10Turns, wake)
	const continuationContextBlock = formatContinuationContext({
		summary,
		recentTurns: last10Turns,
	})

	return { ...applied, continuationContextBlock }
}
```

**Notes:**

- `cancelSessionWatchdog` / `scheduleSessionWatchdog` should delegate to **11** helpers when available — inline above shows contract.
- Do **not** inline Haiku here — single path through **12** DO.
- Compression runs **before** new user turn — caller (**20**) must switch `sessionId` to `newSessionId` before append.

Source: `implementable-specs/17-session-lifecycle.md`; ledger `0004.session-compression.md`.
