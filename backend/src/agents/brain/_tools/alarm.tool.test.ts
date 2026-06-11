import { runInDurableObject } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { createId } from '@brioela/shared/_ids'
import { createDatabase } from '@/agents/brain/_database'
import { ensureAlarmToolTestSchema } from '@/agents/brain/_tools/alarm.tool.test.schema.helper'
import { cancelUserAlarmExecutable } from '@/agents/brain/_tools/_executables/cancel.user.alarm.executable'
import { scheduleUserAlarmExecutable } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { cancelUserAlarmTool } from '@/agents/brain/_tools/cancel.user.alarm.tool'
import { getBrainTools } from '@/agents/brain/_tools/get.brain.tools'
import { scheduleUserAlarmTool } from '@/agents/brain/_tools/schedule.user.alarm.tool'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import { eq } from '@/database/drizzle/_database'

const userId = 'user-alarm-test'
const sessionId = '00000000-0000-4000-8000-000000000099'

async function withAlarmDatabase(
	run: (database: ReturnType<typeof createDatabase>) => void | Promise<void>,
) {
	const brain = env.BRIOELA_BRAIN.get(
		env.BRIOELA_BRAIN.idFromName(`alarm-tool-test-${createId()}`),
	)

	await runInDurableObject(brain, async (_, state) => {
		const database = createDatabase(state.storage)
		ensureAlarmToolTestSchema(database)
		await run(database)
	})
}

function wakeMocks() {
	return {
		scheduleAlarm: vi.fn(async () => undefined),
		cancelAlarm: vi.fn(async () => undefined),
	}
}

describe('Brain Alarm Tools', () => {
	it('exposes alarm tools by session kind when wake callbacks are provided', async () => {
		await withAlarmDatabase((database) => {
			const wake = wakeMocks()
			const chatTools = getBrainTools(database, userId, 'chat', null, undefined, wake)
			const cookingTools = getBrainTools(database, userId, 'cooking', null, undefined, wake)
			const alarmTools = getBrainTools(database, userId, 'alarm', null, undefined, wake)

			expect(chatTools.schedule_user_alarm).toBeDefined()
			expect(chatTools.cancel_user_alarm).toBeDefined()
			expect(cookingTools.schedule_user_alarm).toBeDefined()
			expect(cookingTools.cancel_user_alarm).toBeDefined()
			expect(alarmTools.schedule_user_alarm).toBeUndefined()
			expect(alarmTools.cancel_user_alarm).toBeUndefined()
		})
	})

	it('schedule_user_alarm inserts a pending row and calls scheduleAlarm', async () => {
		await withAlarmDatabase(async (database) => {
			const wake = wakeMocks()
			const scheduledAt = Date.now() + 60_000

			const result = await scheduleUserAlarmExecutable(database, userId, {
				alarm_type: 'sickness_followup',
				scheduled_at: scheduledAt,
				payload: { symptoms_reported: 'nausea' },
				triggering_session_id: sessionId,
			}, wake)

			expect(result.status).toBe('pending')
			if (result.status !== 'pending') throw new Error('expected pending schedule')
			const alarmId = result.id
			expect(result.alarm_type).toBe('sickness_followup')
			expect(wake.scheduleAlarm).toHaveBeenCalledWith(scheduledAt)

			const row = database
				.select()
				.from(scheduledAlarms)
				.where(eq(scheduledAlarms.id, alarmId))
				.get()
			expect(row?.status).toBe('pending')
			expect(row?.triggeringSessionId).toBe(sessionId)
			expect(JSON.parse(row?.payload ?? '{}')).toEqual({ symptoms_reported: 'nausea' })
		})
	})

	it('schedule_user_alarm rejects duplicate brain_maintenance_run pending rows', async () => {
		await withAlarmDatabase(async (database) => {
			const wake = wakeMocks()
			const scheduledAt = Date.now() + 120_000

			const first = await scheduleUserAlarmExecutable(database, userId, {
				alarm_type: 'brain_maintenance_run',
				scheduled_at: scheduledAt,
				payload: {},
			}, wake)

			const second = await scheduleUserAlarmExecutable(database, userId, {
				alarm_type: 'brain_maintenance_run',
				scheduled_at: scheduledAt + 60_000,
				payload: {},
			}, wake)

			expect(first.status).toBe('pending')
			if (first.status !== 'pending') throw new Error('expected pending schedule')
			expect(second.error).toBe('alarm_already_pending')
			expect(second.id).toBe(first.id)
		})
	})

	it('cancel_user_alarm cancels pending rows and clears wake when none remain', async () => {
		await withAlarmDatabase(async (database) => {
			expect(cancelUserAlarmTool(database, userId, wakeMocks())).toBeDefined()
			const wake = wakeMocks()
			const scheduledAt = Date.now() + 90_000

			const scheduled = await scheduleUserAlarmExecutable(database, userId, {
				alarm_type: 'travel_preload',
				scheduled_at: scheduledAt,
				payload: { destination: 'Addis Ababa' },
			}, wake)
			if (scheduled.status !== 'pending') throw new Error('expected pending schedule')
			const scheduledId = scheduled.id

			wake.scheduleAlarm.mockClear()

			const cancelled = await cancelUserAlarmExecutable(database, userId, {
				id: scheduledId,
				reason: 'Trip cancelled.',
			}, wake)

			expect(cancelled.status).toBe('cancelled')
			expect(cancelled.was_next_alarm).toBe(true)
			expect(cancelled.new_next_alarm_at).toBeNull()
			expect(wake.cancelAlarm).toHaveBeenCalledTimes(1)

			const row = database
				.select()
				.from(scheduledAlarms)
				.where(eq(scheduledAlarms.id, scheduledId))
				.get()
			expect(row?.status).toBe('cancelled')
			expect(row?.cancelReason).toBe('Trip cancelled.')
			expect(row?.cancelledAt).toBeTypeOf('number')
		})
	})

	it('cancel_user_alarm rejects non-pending alarms', async () => {
		await withAlarmDatabase(async (database) => {
			const wake = wakeMocks()
			const scheduled = await scheduleUserAlarmExecutable(database, userId, {
				alarm_type: 'travel_preload',
				scheduled_at: Date.now() + 90_000,
				payload: {},
			}, wake)
			if (scheduled.status !== 'pending') throw new Error('expected pending schedule')
			const scheduledId = scheduled.id

			await cancelUserAlarmExecutable(database, userId, { id: scheduledId, reason: 'First cancel.' }, wake)

			const again = await cancelUserAlarmExecutable(database, userId, {
				id: scheduledId,
				reason: 'Duplicate cancel.',
			}, wake)

			expect(again.error).toBe('alarm_not_cancellable')
		})
	})
})
