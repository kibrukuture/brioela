import type { AlarmAction, AlarmContext, AlarmOutcome } from '@/agents/brain/_types'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'

export const runBrainMaintenance: AlarmAction = {
	async handle(_alarm: BrainScheduledAlarm, _ctx: AlarmContext): Promise<AlarmOutcome> {
		return { status: 'completed' }
	},
}
