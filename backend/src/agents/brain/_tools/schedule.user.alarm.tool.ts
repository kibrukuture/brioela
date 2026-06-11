import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduleUserAlarmSchema } from '@/agents/brain/_tools/_schemas/schedule.user.alarm.schema'
import { scheduleUserAlarmPrompt } from '@/agents/brain/_tools/_prompts/schedule.user.alarm.prompt'
import {
	type AlarmWakeCallbacks,
	scheduleUserAlarmExecutable,
} from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'

export const scheduleUserAlarmTool = (
	database: BrainDatabase,
	userId: string,
	wake: Pick<AlarmWakeCallbacks, 'scheduleAlarm'>,
) => tool({
	description: scheduleUserAlarmPrompt,
	inputSchema: scheduleUserAlarmSchema,
	execute: async (params) => scheduleUserAlarmExecutable(database, userId, params, wake),
})
