# Gap snapshot: alarm.handler.ts (cooking timers)

Target: `backend/src/agents/mira/_handlers/alarm.handler.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/05-timers.md`. Mira authoritative; Brain audit optional.

```typescript
import type { MiraSession } from '../mira-session.agent'
import { forwardToolToBrain } from '../_helpers/forward-tool-to-brain.helper'
import { writeTranscriptSystemEvent } from '../_helpers/write-transcript-turn.helper'
import { injectTimerFireIntoGemini } from '../_helpers/inject-timer-fire.helper'

export async function scheduleTimer(
	args: { label: string; seconds: number },
	miraSession: MiraSession,
): Promise<{ success: boolean; alarmId: string; fires_in_seconds: number }> {
	const state = miraSession.sessionState
	if (!state) throw new Error('session_not_initialized')

	const { label, seconds } = args
	if (miraSession.activeTimers.has(label)) {
		throw new Error(`Timer "${label}" already exists. Cancel it first.`)
	}
	if (seconds <= 0 || seconds > 4 * 60 * 60) {
		throw new Error('Timer must be between 1 second and 4 hours.')
	}

	const firesAt = Date.now() + seconds * 1000
	const timerId = crypto.randomUUID()

	await miraSession.ctx.storage.sql.exec(
		`INSERT INTO cooking_timers (id, session_id, label, fires_at, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
		timerId,
		state.sessionId,
		label,
		firesAt,
		Date.now(),
	)

	const schedule = await miraSession.schedule(
		new Date(firesAt),
		'fireCookingTimer',
		{ timerId },
		{ idempotent: true },
	)

	await miraSession.ctx.storage.sql.exec(
		`UPDATE cooking_timers SET sdk_schedule_id = ? WHERE id = ?`,
		schedule.id,
		timerId,
	)

	miraSession.activeTimers.set(label, { firesAt, timerId, sdkScheduleId: schedule.id })

	miraSession.ctx.waitUntil(
		forwardToolToBrain(
			{
				tool: 'schedule_user_alarm',
				args: {
					alarm_type: 'cooking_timer',
					scheduled_at: firesAt,
					triggering_session_id: state.sessionId,
					payload: JSON.stringify({ label, timer_id: timerId }),
					label,
				},
			},
			state,
			miraSession.env,
		).catch(() => undefined),
	)

	await writeTranscriptSystemEvent(`Timer set: ${label} (${seconds}s)`, miraSession)

	return { success: true, alarmId: timerId, fires_in_seconds: seconds }
}

export async function fireCookingTimer(
	miraSession: MiraSession,
	payload: { timerId: string },
): Promise<void> {
	const timer = await miraSession.ctx.storage.sql
		.exec(`SELECT id, label, status FROM cooking_timers WHERE id = ?`, payload.timerId)
		.one<{ id: string; label: string; status: string }>()
		.catch(() => null)

	if (!timer || timer.status !== 'pending') return

	await miraSession.ctx.storage.sql.exec(
		`UPDATE cooking_timers SET status = 'fired', fired_at = ? WHERE id = ? AND status = 'pending'`,
		Date.now(),
		timer.id,
	)

	miraSession.activeTimers.delete(timer.label)
	miraSession.speechEngine?.onTimerFired(timer.label)

	if (miraSession.sessionState?.status === 'active') {
		await injectTimerFireIntoGemini(timer.label, miraSession)
	}

	await writeTranscriptSystemEvent(`Timer fired: ${timer.label}`, miraSession)
}

export async function cancelTimer(
	label: string,
	miraSession: MiraSession,
): Promise<{ success: boolean; cancelled: boolean }> {
	const entry = miraSession.activeTimers.get(label)
	if (!entry) return { success: true, cancelled: false }

	miraSession.activeTimers.delete(label)
	await miraSession.ctx.storage.sql.exec(
		`UPDATE cooking_timers SET status = 'cancelled', cancelled_at = ? WHERE id = ? AND status = 'pending'`,
		Date.now(),
		entry.timerId,
	)
	await miraSession.cancelSchedule(entry.sdkScheduleId)
	return { success: true, cancelled: true }
}

export async function cancelAllTimers(miraSession: MiraSession): Promise<void> {
	for (const [label] of miraSession.activeTimers) {
		try {
			await cancelTimer(label, miraSession)
		} catch {
			// best effort at session end
		}
	}
	miraSession.activeTimers.clear()
}

export async function rebuildTimerState(miraSession: MiraSession): Promise<void> {
	const rows = await miraSession.ctx.storage.sql
		.exec(
			`SELECT id, label, fires_at, sdk_schedule_id FROM cooking_timers WHERE status = 'pending'`,
		)
		.toArray<{ id: string; label: string; fires_at: number; sdk_schedule_id: string }>()

	for (const row of rows) {
		miraSession.activeTimers.set(row.label, {
			firesAt: row.fires_at,
			timerId: row.id,
			sdkScheduleId: row.sdk_schedule_id,
		})
	}
}

export async function handleMobileDisconnectDeadline(
	miraSession: MiraSession,
	payload: { sessionId: string },
): Promise<void> {
	const state = miraSession.sessionState
	if (!state || state.sessionId !== payload.sessionId) return
	if (state.mobileWs) return
	const { endSession } = await import('./end-session.handler')
	await endSession('mobile_disconnected', miraSession)
}
