import { z } from '@brioela/shared/zod'

export const BRAIN_ALARM_TYPE_VALUES = [
	'brain:watchdog',
	'brain:maintenance',
	'brain:behavior:pattern',
] as const

export const brainAlarmTypeSchema = z.enum(BRAIN_ALARM_TYPE_VALUES)

export type BrainAlarmType = z.infer<typeof brainAlarmTypeSchema>
