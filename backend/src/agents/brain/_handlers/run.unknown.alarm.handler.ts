import type { AlarmAction, AlarmContext, AlarmOutcome } from '@/agents/brain/_types'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'

export const runUnknownAlarm: AlarmAction = {
	async handle(alarm: BrainScheduledAlarm, _ctx: AlarmContext): Promise<AlarmOutcome> {
		return { status: 'failed', failureReason: `unknown_alarm_type:${alarm.alarmType}` }
	},
}
