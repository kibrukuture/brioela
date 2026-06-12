import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables'

export interface AlarmContext {
	database: BrainDatabase
	userId: string
	wake: AlarmWakeCallbacks
}

export interface AlarmOutcome {
	status: 'completed' | 'failed'
	failureReason?: string
	actionOutcomeStatus?: string
	actionOutcomeJson?: string
}

export interface AlarmAction {
	handle(alarm: BrainScheduledAlarm, ctx: AlarmContext): Promise<AlarmOutcome>
}
